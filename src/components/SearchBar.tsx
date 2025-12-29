"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Clock, Calendar, Moon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimpleSelect } from "@/components/ui/simple-select";
import { SearchableSelect } from "@/components/ui/searchable-select";

type CharterType = "hourly" | "daily" | "stay";

const CHARTER_TYPES: { value: CharterType; label: string; icon: typeof Search }[] = [
  { value: "hourly", label: "Saatlik", icon: Clock },
  { value: "daily", label: "Günübirlik", icon: Calendar },
  { value: "stay", label: "Konaklamalı", icon: Moon },
];

interface SearchBarProps {
  locations: string[];
  defaultLocation?: string;
  defaultType?: CharterType | "";
  variant?: "hero" | "default";
  fullWidthOnDesktop?: boolean;
  size?: "default" | "compact";
}

export default function SearchBar({
  locations,
  defaultLocation = "",
  defaultType = "hourly",
  variant = "hero",
  fullWidthOnDesktop = false,
  size = "default",
}: SearchBarProps) {
  const router = useRouter();
  const [location, setLocation] = useState(defaultLocation);
  const [charterType, setCharterType] = useState<CharterType>(
    (defaultType || "hourly") as CharterType
  );

  useEffect(() => {
    setLocation(defaultLocation);
  }, [defaultLocation]);

  useEffect(() => {
    setCharterType((defaultType || "hourly") as CharterType);
  }, [defaultType]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    params.set("type", charterType);

    router.push(`/yachts?${params.toString()}`);
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
  const isCompact = size === "compact" && !isHero;

  const wrapperStyle = isHero
    ? "bg-white/15 backdrop-blur-xl border border-white/25 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.45)]"
    : "bg-white/90 backdrop-blur-sm border border-slate-200/70";

  const inputStyle = isHero
    ? "bg-white/10 border-white/20 text-white placeholder-white/80 focus:ring-white/50"
    : "bg-white border-slate-200 text-slate-800 focus:ring-blue-200";

  const iconStyle = isHero ? "text-white/80" : "text-slate-400";

  const outerPadding = isHero
    ? "p-2.5"
    : isCompact
    ? "p-1"
    : "p-1.5 md:p-2";

  const controlHeights = isCompact ? "h-8 md:h-9" : "h-9 md:h-10";
  const controlFontSize = isCompact ? "text-xs md:text-sm" : "text-sm md:text-base";
  const controlPadding = isCompact
    ? "pl-7 md:pl-9 pr-5 md:pr-7"
    : "pl-8 md:pl-10 pr-6 md:pr-8";
  const buttonHeights = isCompact ? "h-8 md:h-9" : "h-9 md:h-10";
  const buttonFontSize = isCompact ? "text-xs md:text-sm" : "text-sm md:text-base";

  const outerWidthClass = fullWidthOnDesktop
    ? "w-full max-w-full md:max-w-5xl lg:max-w-6xl mx-auto"
    : "w-full max-w-4xl mx-auto";

  return (
    <div className={`${outerWidthClass} relative z-10`}>
      <div
        className={`${wrapperStyle} rounded-full ${outerPadding} flex flex-row flex-nowrap items-center gap-1`}
      >
        <div className="flex-1 min-w-0 relative">
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${iconStyle} z-10 pointer-events-none`}>
            <MapPin className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <SearchableSelect
            value={location}
            onChange={setLocation}
            options={locationOptions}
            className="w-full"
            buttonClassName={`${controlHeights} ${controlPadding} rounded-full border font-medium ${controlFontSize} ${inputStyle} ${isHero ? "bg-white/10" : ""} pl-8 md:pl-10`}
            searchPlaceholder="Lokasyon ara..."
          />
        </div>

        <div className="flex-1 min-w-0 relative">
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${iconStyle} z-10 pointer-events-none`}>
            {charterType === "hourly" ? (
              <Clock className="w-4 h-4 md:w-5 md:h-5" />
            ) : charterType === "daily" ? (
              <Calendar className="w-4 h-4 md:w-5 md:h-5" />
            ) : (
              <Moon className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </div>
          <SimpleSelect
            value={charterType}
            onChange={(val) => setCharterType(val as CharterType)}
            options={CHARTER_TYPES.map(({ value, label }) => ({ value, label }))}
            className="w-full"
            buttonClassName={`${controlHeights} ${controlPadding} rounded-full border font-medium ${controlFontSize} ${inputStyle} ${isHero ? "bg-white/10" : ""} pl-8 md:pl-10`}
            renderLabel={(opt) => {
              const meta = CHARTER_TYPES.find((t) => t.value === opt.value);
              if (!meta) return opt.label;
              const Icon = meta.icon;
              return (
                <span className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 md:w-4 md:h-4" />
                  <span>{opt.label}</span>
                </span>
              );
            }}
          />
        </div>

        <Button
          onClick={handleSearch}
          className={`${buttonHeights} px-3 md:px-4 rounded-full font-semibold ${buttonFontSize} transition-all hover:scale-[1.02] active:scale-[0.98] ${
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
