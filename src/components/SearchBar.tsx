"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Clock, Calendar, Moon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type CharterType = "" | "hourly" | "daily" | "stay";

const CHARTER_TYPES: { value: CharterType; label: string; icon: typeof Search }[] = [
  { value: "", label: "Tüm Türler", icon: Search },
  { value: "hourly", label: "Saatlik", icon: Clock },
  { value: "daily", label: "Günlük", icon: Calendar },
  { value: "stay", label: "Konaklamalı", icon: Moon },
];

interface SearchBarProps {
  locations: string[];
  defaultLocation?: string;
  defaultType?: CharterType;
  variant?: "hero" | "default";
}

export default function SearchBar({
  locations,
  defaultLocation = "",
  defaultType = "",
  variant = "hero",
}: SearchBarProps) {
  const router = useRouter();
  const [location, setLocation] = useState(defaultLocation);
  const [charterType, setCharterType] = useState<CharterType>(defaultType);

  useEffect(() => {
    setLocation(defaultLocation);
  }, [defaultLocation]);

  useEffect(() => {
    setCharterType(defaultType);
  }, [defaultType]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (charterType) params.set("type", charterType);

    router.push(`/yachts${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const locationOptions = useMemo(
    () => [
      { value: "", label: "Tüm Lokasyonlar" },
      ...locations
        .filter(Boolean)
        .map((loc) => ({ value: loc, label: loc }))
        .sort((a, b) => a.label.localeCompare(b.label, "tr")),
    ],
    [locations]
  );

  const isHero = variant === "hero";

  const wrapperStyle = isHero
    ? "bg-white/15 backdrop-blur-xl border border-white/25 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.45)]"
    : "bg-white/90 backdrop-blur-sm border border-slate-200/70 shadow-lg";

  const inputStyle = isHero
    ? "bg-white/10 border-white/20 text-white placeholder-white/80 focus:ring-white/50"
    : "bg-white border-slate-200 text-slate-800 focus:ring-blue-200";

  const iconStyle = isHero ? "text-white/80" : "text-slate-400";

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        className={`${wrapperStyle} rounded-full p-2.5 flex flex-row flex-nowrap items-center gap-1.5`}
      >
        <div className="flex-1 min-w-0 relative">
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${iconStyle}`}>
            <MapPin className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={`w-full h-10 md:h-10 pl-9 md:pl-10 pr-7 md:pr-8 rounded-full border font-medium text-sm md:text-base focus:ring-2 focus:outline-none transition-all appearance-none cursor-pointer ${inputStyle} ${isHero ? "bg-white/10" : ""}`}
          >
            {locationOptions.map((loc) => (
              <option key={loc.value} value={loc.value}>
                {loc.label}
              </option>
            ))}
          </select>
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${iconStyle}`}>
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="flex-1 min-w-0 relative">
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${iconStyle}`}>
            {charterType === "hourly" ? (
              <Clock className="w-4 h-4 md:w-5 md:h-5" />
            ) : charterType === "daily" ? (
              <Calendar className="w-4 h-4 md:w-5 md:h-5" />
            ) : charterType === "stay" ? (
              <Moon className="w-4 h-4 md:w-5 md:h-5" />
            ) : (
              <Search className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </div>
          <select
            value={charterType}
            onChange={(e) => setCharterType(e.target.value as CharterType)}
            className={`w-full h-10 md:h-10 pl-9 md:pl-10 pr-7 md:pr-8 rounded-full border font-medium text-sm md:text-base focus:ring-2 focus:outline-none transition-all appearance-none cursor-pointer ${inputStyle} ${isHero ? "bg-white/10" : ""}`}
          >
            {CHARTER_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${iconStyle}`}>
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <Button
          onClick={handleSearch}
          className={`h-10 md:h-10 px-3 md:px-4 rounded-full font-semibold text-sm md:text-base transition-all hover:scale-[1.02] active:scale-[0.98] ${
            isHero
              ? "bg-white/90 text-slate-900 hover:bg-white"
              : "bg-slate-900 text-white hover:bg-slate-800"
          }`}
        >
          <Search className="w-5 h-5 mr-2" />
          <span className="hidden sm:inline">Ara</span>
        </Button>
      </div>
    </div>
  );
}
