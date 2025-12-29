import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Clock, Anchor } from "lucide-react";
import BookingForm from "@/components/BookingForm";
import BackButton from "@/components/BackButton";
import ImageCarousel from "@/components/ImageCarousel";

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
      price: boat.price_daily || 0,
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
        {boat.image_urls && boat.image_urls.length > 0 && (
          <ImageCarousel 
            images={boat.image_urls} 
            title={boat.title}
            autoPlayInterval={5000}
          />
        )}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-8 text-white pointer-events-none z-20">
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

      <div className="container mx-auto mt-4 md:mt-6 px-4 sm:px-5 lg:px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* SOL TARAF: BİLGİLER */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tekne Özellikleri */}
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 lg:p-5">
              <h2 className="text-xl lg:text-2xl font-bold mb-4 text-slate-900">Tekne Özellikleri</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center p-3.5 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg border border-slate-200/50 hover:border-blue-300/50 transition-colors duration-200 group">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-500/20 transition-colors">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-0.5">Kapasite</p>
                    <p className="text-base font-bold text-slate-900">{boat.capacity} Kişi</p>
                  </div>
                </div>
                <div className="flex items-center p-3.5 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg border border-slate-200/50 hover:border-blue-300/50 transition-colors duration-200 group">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-500/20 transition-colors">
                    <Anchor className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-0.5">Kaptan</p>
                    <p className="text-base font-bold text-slate-900">{boat.has_captain ? "Kaptanlı" : "Kaptansız"}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Açıklama */}
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 lg:p-5">
              <h2 className="text-xl lg:text-2xl font-bold mb-4 text-slate-900">Açıklama</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 leading-relaxed text-sm lg:text-base whitespace-pre-line">
                  {boat.description || "Bu tekne için henüz açıklama girilmemiş."}
                </p>
              </div>
            </div>

            {/* Fiyatlandırma */}
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 lg:p-5">
              <h2 className="text-xl lg:text-2xl font-bold mb-4 text-slate-900">Fiyatlandırma</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {charterOptions.hourly.active && (
                  <div className="p-3.5 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg border-2 border-blue-200/60 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Saatlik</p>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    </div>
                    <p className="text-xl lg:text-2xl font-bold text-slate-900 mb-1">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: boat.currency || 'TRY' }).format(charterOptions.hourly.price)}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">Min. {charterOptions.hourly.minHours} saat</p>
                  </div>
                )}
                {charterOptions.daily.active && (
                  <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg border-2 border-emerald-200/60 hover:border-emerald-300 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Günlük</p>
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    </div>
                    <p className="text-xl lg:text-2xl font-bold text-slate-900 mb-1">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: boat.currency || 'TRY' }).format(charterOptions.daily.price)}
                    </p>
                    <p className="text-xs text-emerald-600 font-medium">Günübirlik</p>
                  </div>
                )}
                {charterOptions.stay.active && (
                  <div className="p-3.5 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg border-2 border-purple-200/60 hover:border-purple-300 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Konaklamalı</p>
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    </div>
                    <p className="text-xl lg:text-2xl font-bold text-slate-900 mb-1">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: boat.currency || 'TRY' }).format(charterOptions.stay.price)}
                    </p>
                    <p className="text-xs text-purple-600 font-medium">Min. {charterOptions.stay.minDays} gece (Gecelik)</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SAĞ TARAF: FORM ALANI */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 lg:top-6">
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
      </div>
    </div>
  );
}
