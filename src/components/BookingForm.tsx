"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, differenceInDays } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarIcon, Loader2, Clock, ChevronDown, Users } from "lucide-react";

interface CharterOption {
  active: boolean;
  price: number;
  label: string;
  minHours?: number;
  minDays?: number;
}

interface CharterOptions {
  hourly: CharterOption;
  daily: CharterOption;
  stay: CharterOption;
}

type CharterType = 'hourly' | 'daily' | 'stay';

interface BookingFormProps {
  boatId: string;
  boatName: string;
  currency: string;
  charterOptions: CharterOptions;
  defaultCharterType?: CharterType;
  ownerName?: string;
  ownerPhone?: string;
  commissionRate: number;
}

// Saat seçenekleri
const HOUR_OPTIONS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 - 20:00

export default function BookingForm({ 
  boatId, 
  boatName, 
  currency, 
  charterOptions,
  defaultCharterType,
  ownerName,
  ownerPhone,
  commissionRate
}: BookingFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Aktif olan ilk kiralama türünü varsayılan olarak seç
  const getInitialCharterType = (): CharterType => {
    if (defaultCharterType && charterOptions[defaultCharterType].active) {
      return defaultCharterType;
    }
    if (charterOptions.daily.active) return "daily";
    if (charterOptions.hourly.active) return "hourly";
    if (charterOptions.stay.active) return "stay";
    return "daily";
  };

  // Form State
  const [charterType, setCharterType] = useState<CharterType>(getInitialCharterType());
  const [date, setDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [startHour, setStartHour] = useState<number>(10);
  const [endHour, setEndHour] = useState<number>(14);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState("1");
  const [isGuestsDropdownOpen, setIsGuestsDropdownOpen] = useState(false);
  const guestsDropdownRef = useRef<HTMLDivElement>(null);

  // Kişi sayısı seçenekleri (1-20)
  const GUEST_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1);

  // Dropdown dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (guestsDropdownRef.current && !guestsDropdownRef.current.contains(event.target as Node)) {
        setIsGuestsDropdownOpen(false);
      }
    };

    if (isGuestsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isGuestsDropdownOpen]);

  // Fiyat hesaplamaları
  const priceCalculation = useMemo(() => {
    const basePrice = charterOptions[charterType]?.price || 0;
    let quantity = 1;
    let unitLabel = "";
    let totalPrice = basePrice;

    if (charterType === "hourly") {
      quantity = Math.max(endHour - startHour, charterOptions.hourly.minHours || 2);
      unitLabel = "saat";
      totalPrice = basePrice * quantity;
    } else if (charterType === "daily") {
      quantity = 1;
      unitLabel = "gün";
      totalPrice = basePrice;
    } else if (charterType === "stay" && date && checkOutDate) {
      quantity = Math.max(differenceInDays(checkOutDate, date), charterOptions.stay.minDays || 1);
      unitLabel = "gece";
      totalPrice = basePrice * quantity;
    }

    const commission = Math.round(totalPrice * (commissionRate / 100));
    const captainAmount = totalPrice - commission;

    return {
      basePrice,
      quantity,
      unitLabel,
      totalPrice,
      commission,
      captainAmount,
      commissionRate
    };
  }, [charterType, charterOptions, startHour, endHour, date, checkOutDate, commissionRate]);

  // Para formatla
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount);
  };

  // Kiralama türünün Türkçe karşılığı
  const getCharterTypeLabel = (type: CharterType) => {
    switch (type) {
      case "hourly": return "Saatlik";
      case "daily": return "Günübirlik";
      case "stay": return "Konaklamalı";
      default: return type;
    }
  };

  const handleSubmit = async () => {
    if (!date || !name || !phone) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }

    if (charterType === "stay" && !checkOutDate) {
      alert("Lütfen çıkış tarihini seçin.");
      return;
    }

    setLoading(true);

    // Başlangıç ve bitiş zamanlarını oluştur
    const startTimestamp = new Date(date);
    if (charterType === "hourly") {
      startTimestamp.setHours(startHour, 0, 0, 0);
    }

    let endTimestamp: Date | null = null;
    if (charterType === "hourly") {
      endTimestamp = new Date(date);
      endTimestamp.setHours(endHour, 0, 0, 0);
    } else if (charterType === "stay" && checkOutDate) {
      endTimestamp = checkOutDate;
    }

    // 1. Supabase'e kaydet
    const { error } = await supabase.from("leads").insert({
      listing_id: boatId,
      customer_name: name,
      customer_phone: phone,
      requested_charter_type: charterType,
      start_timestamp: startTimestamp.toISOString(),
      end_timestamp: endTimestamp?.toISOString() || null,
      guest_count: parseInt(guests) || 1,
      status: "new"
    });

    if (error) {
      setLoading(false);
      alert("Bir hata oluştu: " + error.message);
      return;
    }

    // 2. Email bildirimi gönder
    try {
      await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          boatName: boatName,
          guestCount: parseInt(guests) || 1,
          type: getCharterTypeLabel(charterType),
          // Tarih bilgileri
          startDate: format(date, "PPP", { locale: tr }),
          startHour: charterType === "hourly" ? `${startHour}:00` : null,
          endHour: charterType === "hourly" ? `${endHour}:00` : null,
          endDate: checkOutDate ? format(checkOutDate, "PPP", { locale: tr }) : null,
          // Fiyat bilgileri
          basePrice: priceCalculation.basePrice,
          quantity: priceCalculation.quantity,
          unitLabel: priceCalculation.unitLabel,
          totalPrice: priceCalculation.totalPrice,
          commissionRate: priceCalculation.commissionRate,
          commission: priceCalculation.commission,
          captainAmount: priceCalculation.captainAmount,
          currency: currency,
          // Kaptan bilgileri
          ownerName: ownerName,
          ownerPhone: ownerPhone
        })
      });
    } catch (emailError) {
      console.error("Email gönderilemedi:", emailError);
    }

    setLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="p-4 lg:p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-lg text-center">
        <div className="mb-3">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">✅</span>
          </div>
          <h3 className="text-lg lg:text-xl font-bold text-green-800 mb-2">Talep Alındı!</h3>
        </div>
        <p className="text-green-700 leading-relaxed text-xs lg:text-sm">
          Teşekkürler {name} Bey/Hanım. <br className="hidden sm:block"/>
          Danışmanımız {phone} numarasından size 15 dakika içinde dönüş yapacaktır.
        </p>
      </div>
    );
  }

  // Aktif kiralama türü yoksa form gösterme
  const hasActiveOptions = charterOptions.hourly.active || charterOptions.daily.active || charterOptions.stay.active;
  
  if (!hasActiveOptions) {
    return (
      <div className="border-2 border-slate-200 rounded-xl p-4 lg:p-5 shadow-lg bg-white text-center">
        <p className="text-slate-500 text-xs lg:text-sm">Bu tekne için kiralama seçeneği bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="border-2 border-slate-200/60 rounded-xl p-4 lg:p-5 shadow-xl bg-white">
      {/* Fiyat Özeti */}
      <div className="mb-4 pb-4 border-b border-slate-200">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl lg:text-3xl font-bold text-slate-900">
            {formatCurrency(priceCalculation.basePrice)}
          </span>
          <span className="text-slate-500 text-xs lg:text-sm font-medium">
            / {charterType === "hourly" ? "saat" : charterType === "daily" ? "gün" : "gece"}
          </span>
        </div>
        {priceCalculation.quantity > 1 && (
          <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <div className="flex justify-between items-center text-xs lg:text-sm">
              <span className="text-slate-700 font-medium">
                {formatCurrency(priceCalculation.basePrice)} × {priceCalculation.quantity} {priceCalculation.unitLabel}
              </span>
              <span className="font-bold text-slate-900">{formatCurrency(priceCalculation.totalPrice)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3.5">
        {/* 1. Kiralama Tipi */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-700">Kiralama Türü</Label>
          <Select onValueChange={(value) => setCharterType(value as CharterType)} value={charterType}>
            <SelectTrigger className="w-full h-10 text-sm border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <SelectValue placeholder="Seçiniz" />
            </SelectTrigger>
            <SelectContent>
              {charterOptions.hourly.active && (
                <SelectItem value="hourly" className="text-sm">
                  Saatlik - {formatCurrency(charterOptions.hourly.price)}/saat
                </SelectItem>
              )}
              {charterOptions.daily.active && (
                <SelectItem value="daily" className="text-sm">
                  Günübirlik - {formatCurrency(charterOptions.daily.price)}
                </SelectItem>
              )}
              {charterOptions.stay.active && (
                <SelectItem value="stay" className="text-sm">
                  Konaklamalı - {formatCurrency(charterOptions.stay.price)}/gece
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* 2. Tarih Seçimi - Türe Göre Değişir */}
        {charterType === "hourly" && (
          <>
            {/* Saatlik: Gün + Saat Aralığı */}
            <div className="space-y-2 flex flex-col">
              <Label className="text-xs font-semibold text-slate-700">Tarih</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="h-10 justify-start text-left font-normal text-sm border-slate-300 hover:bg-slate-50 hover:border-slate-400 focus:ring-2 focus:ring-blue-500">
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-500" />
                    {date ? format(date, "PPP", { locale: tr }) : <span className="text-slate-500">Tarih Seçin</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar 
                    mode="single" 
                    selected={date} 
                    onSelect={setDate} 
                    initialFocus 
                    disabled={(d) => d < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Başlangıç Saati</Label>
                <Select onValueChange={(v) => setStartHour(parseInt(v))} value={startHour.toString()}>
                  <SelectTrigger className="h-10 text-sm border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOUR_OPTIONS.map((hour) => (
                      <SelectItem key={hour} value={hour.toString()} className="text-sm">
                        {hour.toString().padStart(2, '0')}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Bitiş Saati</Label>
                <Select onValueChange={(v) => setEndHour(parseInt(v))} value={endHour.toString()}>
                  <SelectTrigger className="h-10 text-sm border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOUR_OPTIONS.filter(h => h > startHour).map((hour) => (
                      <SelectItem key={hour} value={hour.toString()} className="text-sm">
                        {hour.toString().padStart(2, '0')}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {endHour - startHour < (charterOptions.hourly.minHours || 2) && (
              <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-amber-600 text-xs">⚠️</span>
                <p className="text-xs text-amber-700 font-medium">
                  Minimum {charterOptions.hourly.minHours} saat kiralama zorunludur.
                </p>
              </div>
            )}
          </>
        )}

        {charterType === "daily" && (
          <div className="space-y-2 flex flex-col">
            <Label className="text-xs font-semibold text-slate-700">Tarih</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="h-10 justify-start text-left font-normal text-sm border-slate-300 hover:bg-slate-50 hover:border-slate-400 focus:ring-2 focus:ring-blue-500">
                  <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-500" />
                  {date ? format(date, "PPP", { locale: tr }) : <span className="text-slate-500">Tarih Seçin</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar 
                  mode="single" 
                  selected={date} 
                  onSelect={setDate} 
                  initialFocus 
                  disabled={(d) => d < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {charterType === "stay" && (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-2 flex flex-col">
                <Label className="text-xs font-semibold text-slate-700">Giriş Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="h-10 justify-start text-left font-normal text-xs border-slate-300 hover:bg-slate-50 hover:border-slate-400 focus:ring-2 focus:ring-blue-500">
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-500" />
                      {date ? format(date, "dd MMM", { locale: tr }) : <span className="text-slate-500">Giriş</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar 
                      mode="single" 
                      selected={date} 
                      onSelect={(d) => {
                        setDate(d);
                        // Çıkış tarihini otomatik ayarla
                        if (d) {
                          const minCheckout = new Date(d);
                          minCheckout.setDate(minCheckout.getDate() + (charterOptions.stay.minDays || 3));
                          setCheckOutDate(minCheckout);
                        }
                      }} 
                      initialFocus 
                      disabled={(d) => d < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2 flex flex-col">
                <Label className="text-xs font-semibold text-slate-700">Çıkış Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="h-10 justify-start text-left font-normal text-xs border-slate-300 hover:bg-slate-50 hover:border-slate-400 focus:ring-2 focus:ring-blue-500">
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-500" />
                      {checkOutDate ? format(checkOutDate, "dd MMM", { locale: tr }) : <span className="text-slate-500">Çıkış</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar 
                      mode="single" 
                      selected={checkOutDate} 
                      onSelect={setCheckOutDate} 
                      initialFocus 
                      disabled={(d) => {
                        if (!date) return true;
                        const minDate = new Date(date);
                        minDate.setDate(minDate.getDate() + (charterOptions.stay.minDays || 1));
                        return d < minDate;
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {date && checkOutDate && differenceInDays(checkOutDate, date) > 0 && (
              <div className="flex items-center justify-center gap-2 p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg">
                <span className="text-indigo-600 text-xs">🌙</span>
                <p className="text-xs text-center text-indigo-700 font-medium">
                  {differenceInDays(checkOutDate, date)} gece konaklama
                </p>
              </div>
            )}
          </>
        )}

        {/* 3. Kişisel Bilgiler */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-700">Ad Soyad</Label>
          <Input 
            placeholder="Adınız Soyadınız" 
            onChange={(e) => setName(e.target.value)} 
            className="h-10 text-sm border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-700">Telefon (WhatsApp)</Label>
          <Input 
            type="tel" 
            placeholder="05XX XXX XX XX" 
            onChange={(e) => setPhone(e.target.value)} 
            className="h-10 text-sm border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-700">Kişi Sayısı</Label>
          <div ref={guestsDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsGuestsDropdownOpen(!isGuestsDropdownOpen)}
              className="w-full h-10 px-3 text-left text-sm bg-white border border-slate-300 rounded-md shadow-sm hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <span className={guests ? "text-slate-900" : "text-slate-500"}>
                  {guests ? `${guests} ${parseInt(guests) === 1 ? 'Kişi' : 'Kişi'}` : 'Kişi Sayısı Seçin'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isGuestsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isGuestsDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                <div className="py-1">
                  {GUEST_OPTIONS.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        setGuests(count.toString());
                        setIsGuestsDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 text-left text-sm hover:bg-blue-50 transition-colors flex items-center justify-between ${
                        guests === count.toString() 
                          ? 'bg-blue-50 text-blue-700 font-medium' 
                          : 'text-slate-700'
                      }`}
                    >
                      <span>{count} {count === 1 ? 'Kişi' : 'Kişi'}</span>
                      {guests === count.toString() && (
                        <span className="text-blue-600">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Toplam Fiyat */}
        {priceCalculation.totalPrice > 0 && (
          <div className="p-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-lg shadow-lg">
            <div className="flex justify-between items-center">
              <span className="text-xs lg:text-sm font-medium text-slate-200">Toplam Tutar</span>
              <span className="text-xl lg:text-2xl font-bold">{formatCurrency(priceCalculation.totalPrice)}</span>
            </div>
          </div>
        )}

        <Button 
          className="w-full h-10 lg:h-11 text-sm lg:text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
          onClick={handleSubmit} 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gönderiliyor...
            </>
          ) : (
            "Müsaitlik Sor"
          )}
        </Button>
      </div>
      
      <p className="text-xs text-center text-slate-400 mt-3 leading-relaxed">
        Kredi kartı gerekmez. Sadece uygunluk kontrolü yapılır.
      </p>
    </div>
  );
}
