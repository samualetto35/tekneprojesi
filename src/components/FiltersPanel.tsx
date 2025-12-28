"use client";

import { useState, useEffect } from "react";
import { X, Clock, Calendar, Moon, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type CharterType = "hourly" | "daily" | "stay";
type PriceType = "hourly" | "daily" | "stay";

export interface FilterState {
  type: CharterType | "";
  minPrice: string;
  maxPrice: string;
  hasCaptain: boolean | null;
  minCapacity: string;
  maxCapacity: string;
}

interface FiltersPanelProps {
  listings: any[];
  priceType: PriceType;
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
  filteredCount: number;
  initialFilters?: FilterState;
}

export default function FiltersPanel({
  listings,
  priceType,
  onClose,
  onApplyFilters,
  filteredCount,
  initialFilters,
}: FiltersPanelProps) {
  const [filters, setFilters] = useState<FilterState>(
    initialFilters || {
      type: "",
      minPrice: "",
      maxPrice: "",
      hasCaptain: null,
      minCapacity: "",
      maxCapacity: "",
    }
  );

  // Update filters when initialFilters change
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  // Get price range from listings
  const priceFieldMap: Record<PriceType, string> = {
    hourly: "price_hourly",
    daily: "price_daily",
    stay: "price_stay_per_night",
  };
  const priceField = priceFieldMap[priceType];
  const prices = listings
    .map((item) => {
      const price = item[priceField] || (priceType === "daily" ? item.price : 0);
      return typeof price === "number" ? price : Number(price || 0);
    })
    .filter((p) => p > 0);
  const minPriceValue = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPriceValue = prices.length > 0 ? Math.max(...prices) : 10000;

  const capacities = listings
    .map((item) => item.capacity || 0)
    .filter((c) => c > 0);
  const minCapacityValue = capacities.length > 0 ? Math.min(...capacities) : 1;
  const maxCapacityValue = capacities.length > 0 ? Math.max(...capacities) : 50;

  const handleClearFilters = () => {
    const clearedFilters: FilterState = {
      type: "",
      minPrice: "",
      maxPrice: "",
      hasCaptain: null,
      minCapacity: "",
      maxCapacity: "",
    };
    setFilters(clearedFilters);
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const hasActiveFilters = () => {
    return (
      filters.type !== "" ||
      filters.minPrice !== "" ||
      filters.maxPrice !== "" ||
      filters.hasCaptain !== null ||
      filters.minCapacity !== "" ||
      filters.maxCapacity !== ""
    );
  };

  return (
    <>
      {/* Mobile Modal - Slide up from bottom */}
      <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-white transform transition-transform duration-300 ease-out translate-y-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Filtreler</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 pb-32">
          {/* Tekne Türü */}
          <div>
            <Label className="text-base font-medium text-slate-900 mb-3 block">
              Tekne Türü
            </Label>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setFilters({ ...filters, type: filters.type === "hourly" ? "" : "hourly" })}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all",
                  filters.type === "hourly"
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <Clock className={cn("w-5 h-5", filters.type === "hourly" ? "text-slate-900" : "text-slate-400")} />
                <span className={cn("font-medium", filters.type === "hourly" ? "text-slate-900" : "text-slate-600")}>
                  Saatlik
                </span>
              </button>
              <button
                onClick={() => setFilters({ ...filters, type: filters.type === "daily" ? "" : "daily" })}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all",
                  filters.type === "daily"
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <Calendar className={cn("w-5 h-5", filters.type === "daily" ? "text-slate-900" : "text-slate-400")} />
                <span className={cn("font-medium", filters.type === "daily" ? "text-slate-900" : "text-slate-600")}>
                  Günübirlik
                </span>
              </button>
              <button
                onClick={() => setFilters({ ...filters, type: filters.type === "stay" ? "" : "stay" })}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all",
                  filters.type === "stay"
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <Moon className={cn("w-5 h-5", filters.type === "stay" ? "text-slate-900" : "text-slate-400")} />
                <span className={cn("font-medium", filters.type === "stay" ? "text-slate-900" : "text-slate-600")}>
                  Konaklamalı
                </span>
              </button>
            </div>
          </div>

          {/* Fiyat Aralığı */}
          <div>
            <Label className="text-base font-medium text-slate-900 mb-3 block">
              Fiyat Aralığı
            </Label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label htmlFor="minPrice" className="text-xs text-slate-500 mb-1">
                  Min
                </Label>
                <Input
                  id="minPrice"
                  type="number"
                  placeholder={minPriceValue.toString()}
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="maxPrice" className="text-xs text-slate-500 mb-1">
                  Max
                </Label>
                <Input
                  id="maxPrice"
                  type="number"
                  placeholder={maxPriceValue.toString()}
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Özellikler */}
          <div>
            <Label className="text-base font-medium text-slate-900 mb-3 block">
              Özellikler
            </Label>
            <div className="space-y-3">
              {/* Kaptan */}
              <div>
                <Label className="text-sm text-slate-700 mb-2 block">Kaptan</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setFilters({
                        ...filters,
                        hasCaptain: filters.hasCaptain === true ? null : true,
                      })
                    }
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-lg border-2 transition-all",
                      filters.hasCaptain === true
                        ? "border-slate-900 bg-slate-50 text-slate-900 font-medium"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    )}
                  >
                    Kaptanlı
                  </button>
                  <button
                    onClick={() =>
                      setFilters({
                        ...filters,
                        hasCaptain: filters.hasCaptain === false ? null : false,
                      })
                    }
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-lg border-2 transition-all",
                      filters.hasCaptain === false
                        ? "border-slate-900 bg-slate-50 text-slate-900 font-medium"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    )}
                  >
                    Kaptansız
                  </button>
                </div>
              </div>

              {/* Kapasite */}
              <div>
                <Label className="text-sm text-slate-700 mb-2 block">Kapasite (Kişi)</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      id="minCapacity"
                      type="number"
                      placeholder={minCapacityValue.toString()}
                      value={filters.minCapacity}
                      onChange={(e) => setFilters({ ...filters, minCapacity: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <span className="text-slate-400">-</span>
                  <div className="flex-1">
                    <Input
                      id="maxCapacity"
                      type="number"
                      placeholder={maxCapacityValue.toString()}
                      value={filters.maxCapacity}
                      onChange={(e) => setFilters({ ...filters, maxCapacity: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-4 space-y-2 md:hidden shadow-lg">
          <Button
            variant="outline"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters()}
            className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Seçimleri Kaldır
          </Button>
          <Button
            onClick={handleApplyFilters}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white"
          >
            İlanları Göster ({filteredCount})
          </Button>
        </div>
      </div>

      {/* Desktop Sidebar - Slide from left */}
      <div className="hidden md:block fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-out translate-x-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-slate-900">Filtreler</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-8 pb-32">
          {/* Tekne Türü */}
          <div>
            <Label className="text-base font-medium text-slate-900 mb-3 block">
              Tekne Türü
            </Label>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setFilters({ ...filters, type: filters.type === "hourly" ? "" : "hourly" })}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all",
                  filters.type === "hourly"
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <Clock className={cn("w-5 h-5", filters.type === "hourly" ? "text-slate-900" : "text-slate-400")} />
                <span className={cn("font-medium", filters.type === "hourly" ? "text-slate-900" : "text-slate-600")}>
                  Saatlik
                </span>
              </button>
              <button
                onClick={() => setFilters({ ...filters, type: filters.type === "daily" ? "" : "daily" })}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all",
                  filters.type === "daily"
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <Calendar className={cn("w-5 h-5", filters.type === "daily" ? "text-slate-900" : "text-slate-400")} />
                <span className={cn("font-medium", filters.type === "daily" ? "text-slate-900" : "text-slate-600")}>
                  Günübirlik
                </span>
              </button>
              <button
                onClick={() => setFilters({ ...filters, type: filters.type === "stay" ? "" : "stay" })}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all",
                  filters.type === "stay"
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <Moon className={cn("w-5 h-5", filters.type === "stay" ? "text-slate-900" : "text-slate-400")} />
                <span className={cn("font-medium", filters.type === "stay" ? "text-slate-900" : "text-slate-600")}>
                  Konaklamalı
                </span>
              </button>
            </div>
          </div>

          {/* Fiyat Aralığı */}
          <div>
            <Label className="text-base font-medium text-slate-900 mb-3 block">
              Fiyat Aralığı
            </Label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label htmlFor="minPriceDesktop" className="text-xs text-slate-500 mb-1">
                  Min
                </Label>
                <Input
                  id="minPriceDesktop"
                  type="number"
                  placeholder={minPriceValue.toString()}
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="maxPriceDesktop" className="text-xs text-slate-500 mb-1">
                  Max
                </Label>
                <Input
                  id="maxPriceDesktop"
                  type="number"
                  placeholder={maxPriceValue.toString()}
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Özellikler */}
          <div>
            <Label className="text-base font-medium text-slate-900 mb-3 block">
              Özellikler
            </Label>
            <div className="space-y-3">
              {/* Kaptan */}
              <div>
                <Label className="text-sm text-slate-700 mb-2 block">Kaptan</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setFilters({
                        ...filters,
                        hasCaptain: filters.hasCaptain === true ? null : true,
                      })
                    }
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-lg border-2 transition-all",
                      filters.hasCaptain === true
                        ? "border-slate-900 bg-slate-50 text-slate-900 font-medium"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    )}
                  >
                    Kaptanlı
                  </button>
                  <button
                    onClick={() =>
                      setFilters({
                        ...filters,
                        hasCaptain: filters.hasCaptain === false ? null : false,
                      })
                    }
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-lg border-2 transition-all",
                      filters.hasCaptain === false
                        ? "border-slate-900 bg-slate-50 text-slate-900 font-medium"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    )}
                  >
                    Kaptansız
                  </button>
                </div>
              </div>

              {/* Kapasite */}
              <div>
                <Label className="text-sm text-slate-700 mb-2 block">Kapasite (Kişi)</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      id="minCapacityDesktop"
                      type="number"
                      placeholder={minCapacityValue.toString()}
                      value={filters.minCapacity}
                      onChange={(e) => setFilters({ ...filters, minCapacity: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <span className="text-slate-400">-</span>
                  <div className="flex-1">
                    <Input
                      id="maxCapacityDesktop"
                      type="number"
                      placeholder={maxCapacityValue.toString()}
                      value={filters.maxCapacity}
                      onChange={(e) => setFilters({ ...filters, maxCapacity: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 space-y-2 shadow-lg">
          <Button
            variant="outline"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters()}
            className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Seçimleri Kaldır
          </Button>
          <Button
            onClick={handleApplyFilters}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white"
          >
            İlanları Göster ({filteredCount})
          </Button>
        </div>
      </div>
    </>
  );
}

// Filter listings based on filter state
export function filterListings(listings: any[], filters: FilterState, priceType: PriceType): any[] {
  const priceFieldMap: Record<PriceType, string> = {
    hourly: "price_hourly",
    daily: "price_daily",
    stay: "price_stay_per_night",
  };
  const priceField = priceFieldMap[priceType];

  return listings.filter((item) => {
    // Type filter
    if (filters.type) {
      const typeMap: Record<string, string> = {
        hourly: "is_hourly_active",
        daily: "is_daily_active",
        stay: "is_stay_active",
      };
      if (!item[typeMap[filters.type]]) return false;
    }

    // Price filter
    const price = item[priceField] || (priceType === "daily" ? item.price : 0);
    const priceValue = typeof price === "number" ? price : Number(price || 0);
    if (filters.minPrice && priceValue < Number(filters.minPrice)) return false;
    if (filters.maxPrice && priceValue > Number(filters.maxPrice)) return false;

    // Captain filter
    if (filters.hasCaptain !== null && item.has_captain !== filters.hasCaptain) return false;

    // Capacity filter
    const capacity = item.capacity || 0;
    if (filters.minCapacity && capacity < Number(filters.minCapacity)) return false;
    if (filters.maxCapacity && capacity > Number(filters.maxCapacity)) return false;

    return true;
  });
}

// Filters Button Component
export function FiltersButton({ 
  listings, 
  priceType,
  currentFilters: initialFilters
}: { 
  listings: any[]; 
  priceType: PriceType;
  currentFilters?: Partial<FilterState>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    type: initialFilters?.type || "",
    minPrice: initialFilters?.minPrice || "",
    maxPrice: initialFilters?.maxPrice || "",
    hasCaptain: initialFilters?.hasCaptain ?? null,
    minCapacity: initialFilters?.minCapacity || "",
    maxCapacity: initialFilters?.maxCapacity || "",
  });

  const applyFilters = (filters: FilterState) => {
    setCurrentFilters(filters);
    setIsOpen(false);
    
    // Build URL params - keep existing params and add/update filter params
    const params = new URLSearchParams(window.location.search);
    if (filters.type) params.set("type", filters.type);
    else params.delete("type");
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    else params.delete("minPrice");
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    else params.delete("maxPrice");
    if (filters.hasCaptain !== null) params.set("hasCaptain", filters.hasCaptain.toString());
    else params.delete("hasCaptain");
    if (filters.minCapacity) params.set("minCapacity", filters.minCapacity);
    else params.delete("minCapacity");
    if (filters.maxCapacity) params.set("maxCapacity", filters.maxCapacity);
    else params.delete("maxCapacity");
    
    window.location.href = `/yachts?${params.toString()}`;
  };

  // Update filters when initialFilters change (from URL)
  useEffect(() => {
    if (initialFilters) {
      setCurrentFilters({
        type: initialFilters.type || "",
        minPrice: initialFilters.minPrice || "",
        maxPrice: initialFilters.maxPrice || "",
        hasCaptain: initialFilters.hasCaptain ?? null,
        minCapacity: initialFilters.minCapacity || "",
        maxCapacity: initialFilters.maxCapacity || "",
      });
    }
  }, [initialFilters?.type, initialFilters?.minPrice, initialFilters?.maxPrice, initialFilters?.hasCaptain, initialFilters?.minCapacity, initialFilters?.maxCapacity]);

  // Calculate filtered count based on current filters (for preview in modal)
  const filteredListings = filterListings(listings, currentFilters, priceType);
  const filteredCount = filteredListings.length;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span>Filtreler</span>
      </button>

      {isOpen && (
        <>
          {/* Overlay for desktop */}
          <div
            className="hidden md:block fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 opacity-100"
            onClick={() => setIsOpen(false)}
          />
          {/* Mobile overlay */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 opacity-100"
            onClick={() => setIsOpen(false)}
          />
          <FiltersPanel
            listings={listings}
            priceType={priceType}
            onClose={() => setIsOpen(false)}
            onApplyFilters={applyFilters}
            filteredCount={filteredCount}
            initialFilters={currentFilters}
          />
        </>
      )}
    </>
  );
}
