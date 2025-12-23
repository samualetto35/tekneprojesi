import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoatCard } from "@/components/BoatCard";
import SearchBar from "@/components/SearchBar";

async function getHourlyListings() {
  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("is_active", true)
    .eq("is_hourly_active", true)
    .limit(3);
  return data || [];
}

async function getDailyListings() {
  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("is_active", true)
    .eq("is_daily_active", true)
    .limit(3);
  return data || [];
}

async function getStayListings() {
  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("is_active", true)
    .eq("is_stay_active", true)
    .limit(3);
  return data || [];
}

async function getActiveLocations() {
  const { data } = await supabase
    .from("listings")
    .select("location")
    .eq("is_active", true);

  const unique = Array.from(
    new Set((data || []).map((item) => item.location).filter(Boolean) as string[])
  );
  return unique;
}

function ListingSection({
  title,
  boats,
  priceType,
  bgColor,
  linkHref,
}: {
  title: string;
  boats: any[];
  priceType: "hourly" | "daily" | "stay";
  bgColor: string;
  linkHref: string;
}) {
  if (boats.length === 0) return null;

  return (
    <section className={`py-10 ${bgColor}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
          <Link href={linkHref}>
            <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
              Tümünü Gör <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
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
  const [hourlyListings, dailyListings, stayListings, locations] = await Promise.all([
    getHourlyListings(),
    getDailyListings(),
    getStayListings(),
    getActiveLocations(),
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HERO SECTION */}
      <section className="relative bg-white">
        <div className="absolute inset-0 h-[52vh] min-h-[420px] max-h-[620px]">
          <div className="absolute inset-0 rounded-b-3xl overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: 'url("/hero.png")' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/30 to-slate-900/70" />
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-center h-[52vh] min-h-[420px] max-h-[620px] px-4">
          <div className="text-center w-full max-w-4xl mx-auto space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight">
                Hayalindeki Yatı Bul
              </h1>
              <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
                İstanbul, Bodrum ve Türkiye&apos;nin en güzel koylarında unutulmaz bir deniz deneyimi
              </p>
            </div>

            <SearchBar locations={locations} variant="hero" />
          </div>
        </div>
      </section>

      <ListingSection
        title="Saatlik Kiralık Yatlar"
        boats={hourlyListings}
        priceType="hourly"
        bgColor="bg-white"
        linkHref="/yachts?type=hourly"
      />

      <ListingSection
        title="Günlük Kiralık Yatlar"
        boats={dailyListings}
        priceType="daily"
        bgColor="bg-slate-50"
        linkHref="/yachts?type=daily"
      />

      <ListingSection
        title="Konaklamalı Yatlar"
        boats={stayListings}
        priceType="stay"
        bgColor="bg-white"
        linkHref="/yachts?type=stay"
      />

      {hourlyListings.length === 0 && dailyListings.length === 0 && stayListings.length === 0 && (
        <section className="py-20 text-center">
          <p className="text-gray-500 text-lg">Henüz aktif tekne bulunmamaktadır.</p>
        </section>
      )}

      <section className="py-20 bg-slate-900 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Aradığınızı Bulamadınız mı?</h2>
          <p className="text-slate-300 mb-8 max-w-xl mx-auto">
            Tüm yat seçeneklerimizi inceleyin veya size özel teklifler için bizimle iletişime geçin.
          </p>
          <Link href="/yachts">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
              Tüm Yatları Keşfet <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
