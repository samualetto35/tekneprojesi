"use client";

import { useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, differenceInDays } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarIcon, Loader2, Clock } from "lucide-react";

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
  const [guests, setGuests] = useState("");

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
      <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-center sticky top-8">
        <h3 className="text-xl font-bold text-green-800 mb-2">Talep Alındı! ✅</h3>
        <p className="text-green-700">
          Teşekkürler {name} Bey/Hanım. <br/>
          Danışmanımız {phone} numarasından size 15 dakika içinde dönüş yapacaktır.
        </p>
      </div>
    );
  }

  // Aktif kiralama türü yoksa form gösterme
  const hasActiveOptions = charterOptions.hourly.active || charterOptions.daily.active || charterOptions.stay.active;
  
  if (!hasActiveOptions) {
    return (
      <div className="border rounded-xl p-6 shadow-xl bg-white sticky top-8 text-center">
        <p className="text-gray-500">Bu tekne için kiralama seçeneği bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl p-6 shadow-xl bg-white sticky top-8">
      {/* Fiyat Özeti */}
      <div className="mb-6 border-b pb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-900">
            {formatCurrency(priceCalculation.basePrice)}
          </span>
          <span className="text-gray-500 text-sm">
            / {charterType === "hourly" ? "saat" : charterType === "daily" ? "gün" : "gece"}
          </span>
        </div>
        {priceCalculation.quantity > 1 && (
          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>{formatCurrency(priceCalculation.basePrice)} x {priceCalculation.quantity} {priceCalculation.unitLabel}</span>
              <span className="font-semibold">{formatCurrency(priceCalculation.totalPrice)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* 1. Kiralama Tipi */}
        <div className="space-y-2">
          <Label>Kiralama Türü</Label>
          <Select onValueChange={(value) => setCharterType(value as CharterType)} value={charterType}>
            <SelectTrigger>
              <SelectValue placeholder="Seçiniz" />
            </SelectTrigger>
            <SelectContent>
              {charterOptions.hourly.active && (
                <SelectItem value="hourly">
                  Saatlik - {formatCurrency(charterOptions.hourly.price)}/saat
                </SelectItem>
              )}
              {charterOptions.daily.active && (
                <SelectItem value="daily">
                  Günübirlik - {formatCurrency(charterOptions.daily.price)}
                </SelectItem>
              )}
              {charterOptions.stay.active && (
                <SelectItem value="stay">
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
              <Label>Tarih</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: tr }) : <span>Tarih Seçin</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Başlangıç Saati</Label>
                <Select onValueChange={(v) => setStartHour(parseInt(v))} value={startHour.toString()}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOUR_OPTIONS.map((hour) => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour.toString().padStart(2, '0')}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Bitiş Saati</Label>
                <Select onValueChange={(v) => setEndHour(parseInt(v))} value={endHour.toString()}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOUR_OPTIONS.filter(h => h > startHour).map((hour) => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour.toString().padStart(2, '0')}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {endHour - startHour < (charterOptions.hourly.minHours || 2) && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                ⚠️ Minimum {charterOptions.hourly.minHours} saat kiralama zorunludur.
              </p>
            )}
          </>
        )}

        {charterType === "daily" && (
          <div className="space-y-2 flex flex-col">
            <Label>Tarih</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: tr }) : <span>Tarih Seçin</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 flex flex-col">
                <Label>Giriş Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="justify-start text-left font-normal text-sm">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd MMM", { locale: tr }) : <span>Giriş</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
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
                <Label>Çıkış Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="justify-start text-left font-normal text-sm">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {checkOutDate ? format(checkOutDate, "dd MMM", { locale: tr }) : <span>Çıkış</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
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
              <p className="text-sm text-center text-slate-600 bg-slate-50 p-2 rounded">
                🌙 {differenceInDays(checkOutDate, date)} gece konaklama
              </p>
            )}
          </>
        )}

        {/* 3. Kişisel Bilgiler */}
        <div className="space-y-2">
          <Label>Ad Soyad</Label>
          <Input placeholder="Adınız Soyadınız" onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Telefon (WhatsApp)</Label>
          <Input type="tel" placeholder="05XX XXX XX XX" onChange={(e) => setPhone(e.target.value)} />
        </div>
        
        <div className="space-y-2">
          <Label>Kişi Sayısı</Label>
          <Input type="number" placeholder="Örn: 6" onChange={(e) => setGuests(e.target.value)} />
        </div>

        {/* Toplam Fiyat */}
        {priceCalculation.totalPrice > 0 && (
          <div className="p-4 bg-slate-900 text-white rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm">Toplam Tutar</span>
              <span className="text-2xl font-bold">{formatCurrency(priceCalculation.totalPrice)}</span>
            </div>
          </div>
        )}

        <Button className="w-full text-lg py-6 bg-blue-900 hover:bg-blue-800" onClick={handleSubmit} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Müsaitlik Sor"}
        </Button>
      </div>
      
      <p className="text-xs text-center text-gray-400 mt-4">
        Kredi kartı gerekmez. Sadece uygunluk kontrolü yapılır.
      </p>
    </div>
  );
}
