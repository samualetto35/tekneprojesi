import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, Clock, Calendar, Moon } from "lucide-react";

// Veri çekme fonksiyonları (Server Side)
async function getHourlyListings() {
  const { data } = await supabase
    .from('listings')
    .select('*')
    .eq('is_active', true)
    .eq('is_hourly_active', true);
  return data || [];
}

async function getDailyListings() {
  const { data } = await supabase
    .from('listings')
    .select('*')
    .eq('is_active', true)
    .eq('is_daily_active', true);
  return data || [];
}

async function getStayListings() {
  const { data } = await supabase
    .from('listings')
    .select('*')
    .eq('is_active', true)
    .eq('is_stay_active', true);
  return data || [];
}

// Tekne Kartı Bileşeni
function BoatCard({ 
  boat, 
  priceType 
}: { 
  boat: any; 
  priceType: 'hourly' | 'daily' | 'stay' 
}) {
  const getPrice = () => {
    switch (priceType) {
      case 'hourly': return boat.price_hourly || 0;
      case 'daily': return boat.price_daily || boat.price || 0;
      case 'stay': return boat.price_stay || 0;
    }
  };

  const getPriceLabel = () => {
    switch (priceType) {
      case 'hourly': return '/ saat';
      case 'daily': return '/ gün';
      case 'stay': return '/ gece';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group pt-0">
      {/* Resim Alanı */}
      <div className="h-56 bg-gray-200 relative overflow-hidden">
        <img 
          src={boat.image_urls?.[0] || "https://via.placeholder.com/400"} 
          alt={boat.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <Badge className="absolute top-4 right-4 bg-black/70">
          {boat.capacity} Kişilik
        </Badge>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{boat.title}</CardTitle>
        <div className="flex items-center text-slate-500 text-sm">
          <MapPin className="w-4 h-4 mr-1" /> {boat.location}
        </div>
      </CardHeader>

      <CardFooter className="flex justify-between items-center border-t pt-4 bg-slate-50">
        <div>
          <span className="text-xl font-bold text-slate-900">
            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: boat.currency || 'TRY' }).format(getPrice())}
          </span>
          <span className="text-xs text-slate-500 ml-1">{getPriceLabel()}</span>
        </div>
        <Link href={`/listings/${boat.id}?type=${priceType}`}>
          <Button size="sm">Detay Gör</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// Bölüm Bileşeni
function ListingSection({ 
  title, 
  icon: Icon, 
  boats, 
  priceType,
  bgColor 
}: { 
  title: string; 
  icon: any;
  boats: any[]; 
  priceType: 'hourly' | 'daily' | 'stay';
  bgColor: string;
}) {
  if (boats.length === 0) return null;

  return (
    <section className={`py-16 ${bgColor}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-blue-900 rounded-lg">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          <Badge variant="secondary" className="ml-2">{boats.length} Tekne</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boats.map((boat) => (
            <BoatCard key={boat.id} boat={boat} priceType={priceType} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  const [hourlyListings, dailyListings, stayListings] = await Promise.all([
    getHourlyListings(),
    getDailyListings(),
    getStayListings()
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HERO SECTION */}
      <section className="relative h-[60vh] flex items-center justify-center bg-slate-900 text-white">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=80&w=2070")' }}
        />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Lüksü Keşfet.</h1>
          <p className="text-xl mb-8 text-white/90">İstanbul ve Bodrum&apos;un en özel yatları.</p>
          <div className="flex flex-wrap justify-center gap-4">
            {hourlyListings.length > 0 && (
              <a href="#saatlik">
                <Button size="lg" variant="outline" className="bg-white/10 border-white/30 hover:bg-white/20 text-white">
                  <Clock className="w-4 h-4 mr-2" /> Saatlik Kirala
                </Button>
              </a>
            )}
            {dailyListings.length > 0 && (
              <a href="#gunluk">
                <Button size="lg" variant="outline" className="bg-white/10 border-white/30 hover:bg-white/20 text-white">
                  <Calendar className="w-4 h-4 mr-2" /> Günlük Kirala
                </Button>
              </a>
            )}
            {stayListings.length > 0 && (
              <a href="#konaklama">
                <Button size="lg" variant="outline" className="bg-white/10 border-white/30 hover:bg-white/20 text-white">
                  <Moon className="w-4 h-4 mr-2" /> Konaklamalı
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* SAATLİK TEKNELERİ */}
      <div id="saatlik">
        <ListingSection 
          title="Öne Çıkan Saatlik Tekneler" 
          icon={Clock}
          boats={hourlyListings} 
          priceType="hourly"
          bgColor="bg-white"
        />
      </div>

      {/* GÜNLÜK TEKNELER */}
      <div id="gunluk">
        <ListingSection 
          title="Öne Çıkan Günlük Tekneler" 
          icon={Calendar}
          boats={dailyListings} 
          priceType="daily"
          bgColor="bg-slate-50"
        />
      </div>

      {/* KONAKLAMALI TEKNELER */}
      <div id="konaklama">
        <ListingSection 
          title="Öne Çıkan Konaklamalı Tekneler" 
          icon={Moon}
          boats={stayListings} 
          priceType="stay"
          bgColor="bg-white"
        />
      </div>

      {/* Hiç tekne yoksa */}
      {hourlyListings.length === 0 && dailyListings.length === 0 && stayListings.length === 0 && (
        <section className="py-20 text-center">
          <p className="text-gray-500 text-lg">Henüz aktif tekne bulunmamaktadır.</p>
        </section>
      )}
    </main>
  );
}
