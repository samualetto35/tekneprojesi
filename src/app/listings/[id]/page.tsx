import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Clock, Anchor } from "lucide-react";
import BookingForm from "@/components/BookingForm";
import BackButton from "@/components/BackButton";

// Sayfa params ve searchParams ile ID ve type'ı alır
// Next.js 16'da bu değerler Promise olarak geliyor, bu nedenle önce await ile çözülüyor.
export default async function ListingDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = await params;
  const { type } = await searchParams;
  
  const { data: boat } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single();

  if (!boat) {
    // Ürün bulunamazsa framework 404'ü yerine sade bir bilgi ekranı göster
    // Böylece olası veri/ID uyuşmazlıkları kullanıcı için daha anlaşılır olur.
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">İlan bulunamadı</h1>
          <p className="text-slate-500 text-sm">
            Görüntülemek istediğiniz tekne ilanı kaldırılmış veya artık aktif değil.
          </p>
        </div>
      </div>
    );
  }

  // Aktif kiralama türlerini ve fiyatlarını hazırla
  const charterOptions = {
    hourly: {
      active: boat.is_hourly_active || false,
      price: boat.price_hourly || 0,
      label: "Saatlik Kiralama",
      minHours: boat.min_hours || 2
    },
    daily: {
      active: boat.is_daily_active || false,
      price: boat.price_daily || boat.price || 0,
      label: "Günübirlik Kiralama"
    },
    stay: {
      active: boat.is_stay_active || false,
      price: boat.price_stay_per_night || 0,
      label: "Konaklamalı (Yatılı)",
      minDays: boat.min_stay_days || 3
    }
  };

  // URL'den gelen type'ı kontrol et, geçerli ve aktif mi?
  const validTypes = ['hourly', 'daily', 'stay'] as const;
  type CharterType = typeof validTypes[number];
  
  let defaultCharterType: CharterType | undefined;
  if (type && validTypes.includes(type as CharterType)) {
    const requestedType = type as CharterType;
    // Sadece aktif olan türü kabul et
    if (charterOptions[requestedType].active) {
      defaultCharterType = requestedType;
    }
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* ÜST NAVİGASYON */}
      <div className="absolute top-0 left-0 right-0 z-40 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <BackButton />
        </div>
      </div>

      {/* GÖRSEL ALANI */}
      <div className="h-[60vh] bg-gray-200 relative">
        <img 
          src={boat.image_urls?.[0]} 
          alt={boat.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-8 text-white">
          <div className="flex gap-2 mb-3">
            {boat.is_hourly_active && <Badge className="bg-white/20 backdrop-blur-sm">Saatlik</Badge>}
            {boat.is_daily_active && <Badge className="bg-white/20 backdrop-blur-sm">Günlük</Badge>}
            {boat.is_stay_active && <Badge className="bg-white/20 backdrop-blur-sm">Konaklamalı</Badge>}
          </div>
          <h1 className="text-4xl font-bold">{boat.title}</h1>
          <p className="flex items-center mt-2 text-lg">
            <MapPin className="w-5 h-5 mr-2" /> {boat.location}
          </p>
        </div>
      </div>

      <div className="container mx-auto mt-8 px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* SOL TARAF: BİLGİLER */}
        <div className="md:col-span-2 space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Tekne Özellikleri</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center p-4 bg-slate-50 rounded-lg">
                <Users className="w-6 h-6 mr-3 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Kapasite</p>
                  <p className="font-semibold">{boat.capacity} Kişi</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-slate-50 rounded-lg">
                <Anchor className="w-6 h-6 mr-3 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Kaptan</p>
                  <p className="font-semibold">{boat.has_captain ? "Kaptanlı" : "Kaptansız"}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-4">Açıklama</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {boat.description || "Bu tekne için henüz açıklama girilmemiş."}
            </p>
          </div>

          {/* Fiyat Tablosu */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Fiyatlandırma</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {charterOptions.hourly.active && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-600 font-medium">Saatlik</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: boat.currency || 'TRY' }).format(charterOptions.hourly.price)}
                  </p>
                  <p className="text-xs text-blue-500 mt-1">Min. {charterOptions.hourly.minHours} saat</p>
                </div>
              )}
              {charterOptions.daily.active && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-sm text-green-600 font-medium">Günlük</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: boat.currency || 'TRY' }).format(charterOptions.daily.price)}
                  </p>
                </div>
              )}
              {charterOptions.stay.active && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-sm text-purple-600 font-medium">Konaklamalı (Gecelik)</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: boat.currency || 'TRY' }).format(charterOptions.stay.price)}
                  </p>
                  <p className="text-xs text-purple-500 mt-1">Min. {charterOptions.stay.minDays} gece</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SAĞ TARAF: FORM ALANI */}
        <div className="md:col-span-1">
          <BookingForm 
            boatId={boat.id} 
            boatName={boat.title} 
            currency={boat.currency || 'TRY'}
            charterOptions={charterOptions}
            defaultCharterType={defaultCharterType}
            ownerName={boat.captain_name}
            ownerPhone={boat.captain_phone}
            commissionRate={boat.commission_rate || 0}
          />
        </div>
      </div>
    </div>
  );
}
