"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import { supabase } from "@/lib/supabase";

interface HeaderProps {
  transparent?: boolean;
}

export default function Header({ transparent = false }: HeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [locations, setLocations] = useState<string[]>([]);

  if (pathname?.startsWith("/listings/")) return null;

  const isHome = pathname === "/";
  const isYachts = pathname?.startsWith("/yachts");
  const showTransparent = transparent || isHome;

  // Avoid fixed/sticky headers to keep content fully scrollable/clickable on mobile
  const bgClasses = showTransparent
    ? "absolute top-0 left-0 right-0 text-white"
    : "relative bg-white/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur border-b border-slate-200 text-slate-900";

  useEffect(() => {
    if (!isYachts) return;

    const loadLocations = async () => {
      const { data } = await supabase
        .from("listings")
        .select("location")
        .eq("is_active", true);

      const unique = Array.from(
        new Set((data || []).map((item: any) => item.location).filter(Boolean) as string[])
      );
      setLocations(unique);
    };

    loadLocations();
  }, [isYachts]);

  const defaultLocation = useMemo(() => {
    const loc = searchParams?.get("location");
    return typeof loc === "string" ? loc : "";
  }, [searchParams]);

  const defaultType = useMemo(() => {
    const typeRaw = searchParams?.get("type") || "";
    const normalized = typeRaw.toString().toLowerCase().trim();
    return normalized === "hourly" || normalized === "daily" || normalized === "stay"
      ? (normalized as "hourly" | "daily" | "stay")
      : "";
  }, [searchParams]);

  return (
    <header className={`z-30 transition-all duration-300 ${bgClasses}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="text-xl font-bold tracking-tight flex-shrink-0">
            <span className={showTransparent ? "text-white" : "text-slate-900"}>Tekneci</span>
          </Link>

          {isYachts && (
            <div className="hidden md:flex flex-1 justify-center">
              <SearchBar
                locations={locations}
                defaultLocation={defaultLocation}
                defaultType={defaultType as any}
                variant="default"
                size="compact"
              />
            </div>
          )}

          <div className={isYachts ? "hidden md:block w-10" : "w-0"} />
        </div>
      </div>
    </header>
  );
}
