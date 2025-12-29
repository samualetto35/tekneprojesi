import { supabase } from "@/lib/supabase";
import { BoatCard } from "@/components/BoatCard";
import SearchBar from "@/components/SearchBar";
import ScrollToTopOnMount from "@/components/ScrollToTopOnMount";
import SortSelect from "@/components/SortSelect";
import { FiltersButton } from "@/components/FiltersPanel";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Moon } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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

type SearchParams =
  | {
      [key: string]: string | string[] | undefined;
    }
  | undefined;

type SortKey = "popular" | "price_asc" | "price_desc" | "capacity_desc";

async function getListings(filters: { location?: string; type?: string }) {
  const { location, type } = filters;

  let query = supabase
    .from("listings")
    .select("*")
    .eq("is_active", true);

  if (location) {
    query = query.eq("location", location);
  }

  const typeColumnMap: Record<string, string> = {
    hourly: "is_hourly_active",
    daily: "is_daily_active",
    stay: "is_stay_active",
  };
  const priceColumnMap: Record<string, string> = {
    hourly: "price_hourly",
    daily: "price_daily",
    stay: "price_stay_per_night",
  };

  if (type && typeColumnMap[type]) {
    query = query.eq(typeColumnMap[type], true);
  }

  const { data } = await query;
  const normalized = data || [];

  if (type && typeColumnMap[type]) {
    return normalized.filter((item) => {
      const priceField = priceColumnMap[type];
      const rawPrice = item?.[priceField];
      const priceValue = typeof rawPrice === "number" ? rawPrice : Number(rawPrice || 0);

      // Extra guard: only keep listings that are truly active for the chosen type and have a price
      return Boolean(item?.[typeColumnMap[type]]) && priceValue > 0;
    });
  }

  return normalized;
}

function sortListings(listings: any[], sortKey: SortKey, priceType: "hourly" | "daily" | "stay") {
  const withPrice = listings.map((item) => {
    const priceFieldMap: Record<typeof priceType, string> = {
      hourly: "price_hourly",
      daily: "price_daily",
      stay: "price_stay_per_night",
    };
    const raw = item?.[priceFieldMap[priceType]];
    const priceVal = typeof raw === "number" ? raw : Number(raw || 0);
    return { ...item, __price: priceVal };
  });

  switch (sortKey) {
    case "price_asc":
      return [...withPrice].sort((a, b) => a.__price - b.__price);
    case "price_desc":
      return [...withPrice].sort((a, b) => b.__price - a.__price);
    case "capacity_desc":
      return [...withPrice].sort((a, b) => (b.capacity || 0) - (a.capacity || 0));
    default:
      return listings;
  }
}

export default async function YachtsPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) || {};

  const locationFilter =
    typeof resolvedSearchParams?.location === "string" ? resolvedSearchParams?.location : "";
  const rentalTypeRaw =
    typeof resolvedSearchParams?.type === "string" ? resolvedSearchParams?.type : "";
  const rentalTypeNormalized =
    rentalTypeRaw?.toString()?.toLowerCase()?.trim() ?? "";
  const rentalType: "hourly" | "daily" | "stay" | "" =
    rentalTypeNormalized === "hourly" || rentalTypeNormalized === "daily" || rentalTypeNormalized === "stay"
      ? rentalTypeNormalized
      : "";
  const sortParamRaw = typeof resolvedSearchParams?.sort === "string" ? resolvedSearchParams.sort : "";
  const sortKey: SortKey =
    sortParamRaw === "price_asc" || sortParamRaw === "price_desc" || sortParamRaw === "capacity_desc"
      ? sortParamRaw
      : "popular";

  // Get filter params
  const minPrice = typeof resolvedSearchParams?.minPrice === "string" ? resolvedSearchParams.minPrice : "";
  const maxPrice = typeof resolvedSearchParams?.maxPrice === "string" ? resolvedSearchParams.maxPrice : "";
  const hasCaptain = typeof resolvedSearchParams?.hasCaptain === "string" 
    ? resolvedSearchParams.hasCaptain === "true" 
    : null;
  const minCapacity = typeof resolvedSearchParams?.minCapacity === "string" ? resolvedSearchParams.minCapacity : "";
  const maxCapacity = typeof resolvedSearchParams?.maxCapacity === "string" ? resolvedSearchParams.maxCapacity : "";

  const [listingsRaw, locations] = await Promise.all([
    getListings({ location: locationFilter, type: rentalType }),
    getActiveLocations(),
  ]);

  const priceType: "hourly" | "daily" | "stay" = rentalType || "daily";
  
  // Apply additional filters
  let filteredListings = listingsRaw;
  const priceFieldMap: Record<typeof priceType, string> = {
    hourly: "price_hourly",
    daily: "price_daily",
    stay: "price_stay_per_night",
  };
  const priceField = priceFieldMap[priceType];
  
  if (minPrice || maxPrice || hasCaptain !== null || minCapacity || maxCapacity) {
    filteredListings = listingsRaw.filter((item) => {
      // Price filter
      if (minPrice || maxPrice) {
        const price = item[priceField] || 0;
        const priceValue = typeof price === "number" ? price : Number(price || 0);
        if (minPrice && priceValue < Number(minPrice)) return false;
        if (maxPrice && priceValue > Number(maxPrice)) return false;
      }
      
      // Captain filter
      if (hasCaptain !== null && item.has_captain !== hasCaptain) return false;
      
      // Capacity filter
      const capacity = item.capacity || 0;
      if (minCapacity && capacity < Number(minCapacity)) return false;
      if (maxCapacity && capacity > Number(maxCapacity)) return false;
      
      return true;
    });
  }
  
  const listings = sortListings(filteredListings, sortKey, priceType);
  const listingsCount = listings.length;
  
  // Tür isimlerini Türkçe'ye çevir
  const typeLabels: Record<string, string> = {
    hourly: "Saatlik",
    daily: "Günlük",
    stay: "Konaklamalı"
  };
  const typeLabel = rentalType ? typeLabels[rentalType] : "";
  
  const titleText = `${locationFilter || "Türkiye"} için ${typeLabel ? typeLabel + " " : ""}Tekneler`;
  const breadcrumbText = locationFilter ? locationFilter : "Lokasyon Seçin";

  return (
    <main className="min-h-screen bg-slate-50">
      <ScrollToTopOnMount />
      <section className="bg-white border-b relative">
        <div className="container mx-auto px-4 pt-3 pb-5 md:pt-0 md:pb-5">
          {/* Desktop: search bar'ı header'ın içine taşınmış gibi göstermek için negatif margin.
              pointer-events ile sadece barın kendisi tıklanabilir, sol tarafta logo tıklamasını engellemez. */}
          <div className="hidden md:flex md:-mt-14 md:mb-1 relative z-40 pointer-events-none justify-center">
            <div className="pointer-events-auto w-full max-w-4xl">
              <SearchBar
                locations={locations}
                defaultLocation={locationFilter}
                defaultType={rentalType}
                variant="default"
                size="compact"
              />
            </div>
          </div>
          {/* Mobile: normal akışta kalsın */}
          <div className="md:hidden">
            <SearchBar
              locations={locations}
              defaultLocation={locationFilter}
              defaultType={rentalType}
              variant="default"
            />
          </div>
          <div className="mt-4 flex flex-row items-center gap-2">
            <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5h18" />
                <path d="M5 12h14" />
                <path d="M7 19h10" />
              </svg>
              <span>Harita</span>
            </button>
            <FiltersButton listings={listingsRaw} priceType={priceType} currentFilters={{ minPrice, maxPrice, hasCaptain, minCapacity, maxCapacity, type: rentalType }} />
            <button className="flex items-center gap-2 rounded-full border border-[#0096a3] bg-white px-3 py-2 text-sm font-medium text-[#007782] shadow-sm hover:bg-[#f1fbfc]">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V7" />
                <path d="M14 3h7v7" />
                <path d="M14 10 21 3" />
                <path d="M3 7l9 9" />
              </svg>
              <span>Aramayı Kaydet</span>
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <div className="text-sm text-slate-500">Tekneler &gt; {breadcrumbText}</div>
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{titleText}</h1>
              <div className="flex items-center justify-between gap-3 flex-nowrap">
                <p className="text-sm text-slate-500">{listingsCount} ilan</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm text-slate-500">Sırala:</span>
                  <SortSelect defaultValue={sortKey} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center text-slate-600">
            <p>Seçilen filtrelere uygun yat bulunamadı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((boat) => (
              <BoatCard key={boat.id} boat={boat} priceType={priceType} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
