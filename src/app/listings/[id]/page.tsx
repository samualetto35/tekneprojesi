import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Clock, Anchor, Calendar, Ruler, Ship, Home, Fuel, CheckCircle2 } from "lucide-react";
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

  // Get amenities separately
  let amenitiesData: any[] = [];
  if (boat) {
    const { data: listingAmenities } = await supabase
      .from('listing_amenities')
      .select(`
        amenity_id,
        amenities (
          id,
          name,
          icon
        )
      `)
      .eq('listing_id', id);
    
    if (listingAmenities) {
      amenitiesData = listingAmenities.map((la: any) => ({
        amenity_id: la.amenity_id,
        amenities: la.amenities
      }));
    }
  }

  // Format captain name (first name + .)
  const formatCaptainName = (name: string | null | undefined) => {
    if (!name) return null;
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return `${parts[0]}.`;
    }
    return name;
  };

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
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 md:p-8 text-white pointer-events-none z-20">
          <div className="flex gap-2 mb-2 md:mb-3 flex-wrap">
            {boat.is_hourly_active && <Badge className="bg-white/20 backdrop-blur-sm text-xs md:text-sm">Saatlik</Badge>}
            {boat.is_daily_active && <Badge className="bg-white/20 backdrop-blur-sm text-xs md:text-sm">Günlük</Badge>}
            {boat.is_stay_active && <Badge className="bg-white/20 backdrop-blur-sm text-xs md:text-sm">Konaklamalı</Badge>}
          </div>
          <h1 className="text-2xl md:text-4xl font-bold">{boat.title}</h1>
          <p className="flex items-center mt-2 text-sm md:text-lg">
            <MapPin className="w-4 h-4 md:w-5 md:h-5 mr-2" /> {boat.location}
          </p>
        </div>
      </div>

      <div className="container mx-auto mt-4 md:mt-6 px-4 sm:px-5 lg:px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* SOL TARAF: BİLGİLER */}
          <div className="lg:col-span-2 space-y-3">
            {/* Kaptan Bilgisi */}
            {boat.captain_name && (
              <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm p-3">
                <div className="flex items-center gap-2">
                  <Anchor className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600">Kaptan:</span>
                  <span className="text-sm font-semibold text-slate-900">{formatCaptainName(boat.captain_name)}</span>
                </div>
              </div>
            )}

            {/* Tekne Özellikleri */}
            <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm p-3 lg:p-4">
              <h2 className="text-base lg:text-lg font-semibold mb-3 text-slate-900">Tekne Özellikleri</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {boat.capacity && (
                  <div className="flex flex-col p-2 bg-slate-50 rounded-md">
                    <p className="text-xs text-slate-500 mb-0.5">Kapasite</p>
                    <p className="text-sm font-semibold text-slate-900">{boat.capacity} Kişi</p>
                  </div>
                )}
                {boat.model_year && (
                  <div className="flex flex-col p-2 bg-slate-50 rounded-md">
                    <p className="text-xs text-slate-500 mb-0.5">Model Yılı</p>
                    <p className="text-sm font-semibold text-slate-900">{boat.model_year}</p>
                  </div>
                )}
                {boat.renovation_year && (
                  <div className="flex flex-col p-2 bg-slate-50 rounded-md">
                    <p className="text-xs text-slate-500 mb-0.5">Yenileme Yılı</p>
                    <p className="text-sm font-semibold text-slate-900">{boat.renovation_year}</p>
                  </div>
                )}
                {boat.cruising_capacity && (
                  <div className="flex flex-col p-2 bg-slate-50 rounded-md">
                    <p className="text-xs text-slate-500 mb-0.5">Seyir Kapasitesi</p>
                    <p className="text-sm font-semibold text-slate-900">{boat.cruising_capacity}</p>
                  </div>
                )}
                {boat.wc_count && (
                  <div className="flex flex-col p-2 bg-slate-50 rounded-md">
                    <p className="text-xs text-slate-500 mb-0.5">WC Sayısı</p>
                    <p className="text-sm font-semibold text-slate-900">{boat.wc_count}</p>
                  </div>
                )}
                {boat.length_metres && (
                  <div className="flex flex-col p-2 bg-slate-50 rounded-md">
                    <p className="text-xs text-slate-500 mb-0.5">Uzunluk</p>
                    <p className="text-sm font-semibold text-slate-900">{boat.length_metres} m</p>
                  </div>
                )}
                {boat.width_metres && (
                  <div className="flex flex-col p-2 bg-slate-50 rounded-md">
                    <p className="text-xs text-slate-500 mb-0.5">Genişlik</p>
                    <p className="text-sm font-semibold text-slate-900">{boat.width_metres} m</p>
                  </div>
                )}
                {boat.boat_type && (
                  <div className="flex flex-col p-2 bg-slate-50 rounded-md">
                    <p className="text-xs text-slate-500 mb-0.5">Tekne Türü</p>
                    <p className="text-sm font-semibold text-slate-900">{boat.boat_type}</p>
                  </div>
                )}
                {boat.guest_bathroom_count && (
                  <div className="flex flex-col p-2 bg-slate-50 rounded-md">
                    <p className="text-xs text-slate-500 mb-0.5">Misafir Banyosu</p>
                    <p className="text-sm font-semibold text-slate-900">{boat.guest_bathroom_count}</p>
                  </div>
                )}
                {boat.guest_shower_count && (
                  <div className="flex flex-col p-2 bg-slate-50 rounded-md">
                    <p className="text-xs text-slate-500 mb-0.5">Misafir Duş</p>
                    <p className="text-sm font-semibold text-slate-900">{boat.guest_shower_count}</p>
                  </div>
                )}
                {boat.check_in_time && (
                  <div className="flex flex-col p-2 bg-slate-50 rounded-md">
                    <p className="text-xs text-slate-500 mb-0.5">Check-in</p>
                    <p className="text-sm font-semibold text-slate-900">{boat.check_in_time}</p>
                  </div>
                )}
                {boat.check_out_time && (
                  <div className="flex flex-col p-2 bg-slate-50 rounded-md">
                    <p className="text-xs text-slate-500 mb-0.5">Check-out</p>
                    <p className="text-sm font-semibold text-slate-900">{boat.check_out_time}</p>
                  </div>
                )}
                {boat.rental_model && (
                  <div className="flex flex-col p-2 bg-slate-50 rounded-md">
                    <p className="text-xs text-slate-500 mb-0.5">Kiralama Modeli</p>
                    <p className="text-sm font-semibold text-slate-900">{boat.rental_model}</p>
                  </div>
                )}
                {boat.fuel_price_included !== null && (
                  <div className="flex flex-col p-2 bg-slate-50 rounded-md">
                    <p className="text-xs text-slate-500 mb-0.5">Yakıt</p>
                    <p className="text-sm font-semibold text-slate-900">{boat.fuel_price_included ? "Dahil" : "Dahil Değil"}</p>
                  </div>
                )}
              </div>
            </div>

            {/* İmkanlar */}
            {amenitiesData && amenitiesData.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm p-3 lg:p-4">
                <h2 className="text-base lg:text-lg font-semibold mb-3 text-slate-900">İmkanlar</h2>
                <div className="flex flex-wrap gap-2">
                  {amenitiesData.map((item: any) => (
                    <Badge key={item.amenity_id} variant="outline" className="text-xs">
                      {item.amenities?.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Açıklama */}
            {boat.description && (
              <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm p-3 lg:p-4">
                <h2 className="text-base lg:text-lg font-semibold mb-2 text-slate-900">Açıklama</h2>
                <p className="text-slate-700 leading-relaxed text-sm lg:text-base whitespace-pre-line">
                  {boat.description}
                </p>
              </div>
            )}

            {/* Fiyatlandırma */}
            <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm p-3 lg:p-4">
              <h2 className="text-base lg:text-lg font-semibold mb-3 text-slate-900">Fiyatlandırma</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {charterOptions.hourly.active && (
                  <div className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg border border-blue-200/60">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Saatlik</p>
                    <p className="text-lg font-bold text-slate-900 mb-0.5">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: boat.currency || 'TRY' }).format(charterOptions.hourly.price)}
                    </p>
                    <p className="text-xs text-blue-600">Min. {charterOptions.hourly.minHours} saat</p>
                  </div>
                )}
                {charterOptions.daily.active && (
                  <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg border border-emerald-200/60">
                    <p className="text-xs font-semibold text-emerald-700 mb-1">Günlük</p>
                    <p className="text-lg font-bold text-slate-900 mb-0.5">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: boat.currency || 'TRY' }).format(charterOptions.daily.price)}
                    </p>
                    <p className="text-xs text-emerald-600">Günübirlik</p>
                  </div>
                )}
                {charterOptions.stay.active && (
                  <div className="p-2.5 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg border border-purple-200/60">
                    <p className="text-xs font-semibold text-purple-700 mb-1">Konaklamalı</p>
                    <p className="text-lg font-bold text-slate-900 mb-0.5">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: boat.currency || 'TRY' }).format(charterOptions.stay.price)}
                    </p>
                    <p className="text-xs text-purple-600">Min. {charterOptions.stay.minDays} gece</p>
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
