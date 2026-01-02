"use client";

import { useState, useEffect } from "react";
import { X, Clock, Calendar, Moon, SlidersHorizontal, Ship, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type CharterType = "hourly" | "daily" | "stay";
type PriceType = "hourly" | "daily" | "stay";

export interface FilterState {
  type: CharterType | "";
  minPrice: string;
  maxPrice: string;
  hasCaptain: boolean | null;
  minCapacity: string;
  maxCapacity: string;
  boatType: string;
  minLength: string;
  maxLength: string;
  minWidth: string;
  maxWidth: string;
  minModelYear: string;
  maxModelYear: string;
  selectedAmenities: string[];
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
      boatType: "",
      minLength: "",
      maxLength: "",
      minWidth: "",
      maxWidth: "",
      minModelYear: "",
      maxModelYear: "",
      selectedAmenities: [],
    }
  );
  const [amenities, setAmenities] = useState<any[]>([]);
  const [boatTypes, setBoatTypes] = useState<string[]>([]);

  // Load amenities and boat types
  useEffect(() => {
    const loadData = async () => {
      // Load amenities
      const { data: amenitiesData } = await supabase
        .from('amenities')
        .select('*')
        .order('name');
      if (amenitiesData) setAmenities(amenitiesData);

      // Extract unique boat types from listings
      const types = Array.from(new Set(
        listings
          .map(item => item.boat_type)
          .filter(Boolean)
      )).sort();
      setBoatTypes(types);
    };
    loadData();
  }, [listings]);

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
      const price = item[priceField] || 0;
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
    // Preserve the type filter as it's mandatory
    const clearedFilters: FilterState = {
      type: filters.type, // Keep the current type filter
      minPrice: "",
      maxPrice: "",
      hasCaptain: null,
      minCapacity: "",
      maxCapacity: "",
      boatType: "",
      minLength: "",
      maxLength: "",
      minWidth: "",
      maxWidth: "",
      minModelYear: "",
      maxModelYear: "",
      selectedAmenities: [],
    };
    setFilters(clearedFilters);
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const hasActiveFilters = () => {
    // Check if any filter besides type is active (type is mandatory, so we don't count it)
    return (
      filters.minPrice !== "" ||
      filters.maxPrice !== "" ||
      filters.hasCaptain !== null ||
      filters.minCapacity !== "" ||
      filters.maxCapacity !== "" ||
      filters.boatType !== "" ||
      filters.minLength !== "" ||
      filters.maxLength !== "" ||
      filters.minWidth !== "" ||
      filters.maxWidth !== "" ||
      filters.minModelYear !== "" ||
      filters.maxModelYear !== "" ||
      filters.selectedAmenities.length > 0
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

              {/* Tekne Türü */}
              {boatTypes.length > 0 && (
                <div>
                  <Label className="text-sm text-slate-700 mb-2 block">Tekne Türü</Label>
                  <Select
                    value={filters.boatType}
                    onValueChange={(value) => setFilters({ ...filters, boatType: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tümü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tümü</SelectItem>
                      {boatTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Uzunluk */}
              <div>
                <Label className="text-sm text-slate-700 mb-2 block">Uzunluk (metre)</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      id="minLength"
                      type="number"
                      step="0.1"
                      placeholder="Min"
                      value={filters.minLength}
                      onChange={(e) => setFilters({ ...filters, minLength: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <span className="text-slate-400">-</span>
                  <div className="flex-1">
                    <Input
                      id="maxLength"
                      type="number"
                      step="0.1"
                      placeholder="Max"
                      value={filters.maxLength}
                      onChange={(e) => setFilters({ ...filters, maxLength: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Genişlik */}
              <div>
                <Label className="text-sm text-slate-700 mb-2 block">Genişlik (metre)</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      id="minWidth"
                      type="number"
                      step="0.1"
                      placeholder="Min"
                      value={filters.minWidth}
                      onChange={(e) => setFilters({ ...filters, minWidth: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <span className="text-slate-400">-</span>
                  <div className="flex-1">
                    <Input
                      id="maxWidth"
                      type="number"
                      step="0.1"
                      placeholder="Max"
                      value={filters.maxWidth}
                      onChange={(e) => setFilters({ ...filters, maxWidth: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Model Yılı */}
              <div>
                <Label className="text-sm text-slate-700 mb-2 block">Model Yılı</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      id="minModelYear"
                      type="number"
                      placeholder="Min"
                      value={filters.minModelYear}
                      onChange={(e) => setFilters({ ...filters, minModelYear: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <span className="text-slate-400">-</span>
                  <div className="flex-1">
                    <Input
                      id="maxModelYear"
                      type="number"
                      placeholder="Max"
                      value={filters.maxModelYear}
                      onChange={(e) => setFilters({ ...filters, maxModelYear: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* İmkanlar */}
              {amenities.length > 0 && (
                <div>
                  <Label className="text-sm text-slate-700 mb-2 block">İmkanlar</Label>
                  <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-3">
                    {amenities.map((amenity) => (
                      <div key={amenity.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`amenity-${amenity.id}`}
                          checked={filters.selectedAmenities.includes(amenity.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters({
                                ...filters,
                                selectedAmenities: [...filters.selectedAmenities, amenity.id],
                              });
                            } else {
                              setFilters({
                                ...filters,
                                selectedAmenities: filters.selectedAmenities.filter(id => id !== amenity.id),
                              });
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300"
                        />
                        <Label htmlFor={`amenity-${amenity.id}`} className="text-sm cursor-pointer">
                          {amenity.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

              {/* Tekne Türü */}
              {boatTypes.length > 0 && (
                <div>
                  <Label className="text-sm text-slate-700 mb-2 block">Tekne Türü</Label>
                  <Select
                    value={filters.boatType}
                    onValueChange={(value) => setFilters({ ...filters, boatType: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tümü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tümü</SelectItem>
                      {boatTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Uzunluk */}
              <div>
                <Label className="text-sm text-slate-700 mb-2 block">Uzunluk (metre)</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      id="minLengthDesktop"
                      type="number"
                      step="0.1"
                      placeholder="Min"
                      value={filters.minLength}
                      onChange={(e) => setFilters({ ...filters, minLength: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <span className="text-slate-400">-</span>
                  <div className="flex-1">
                    <Input
                      id="maxLengthDesktop"
                      type="number"
                      step="0.1"
                      placeholder="Max"
                      value={filters.maxLength}
                      onChange={(e) => setFilters({ ...filters, maxLength: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Genişlik */}
              <div>
                <Label className="text-sm text-slate-700 mb-2 block">Genişlik (metre)</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      id="minWidthDesktop"
                      type="number"
                      step="0.1"
                      placeholder="Min"
                      value={filters.minWidth}
                      onChange={(e) => setFilters({ ...filters, minWidth: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <span className="text-slate-400">-</span>
                  <div className="flex-1">
                    <Input
                      id="maxWidthDesktop"
                      type="number"
                      step="0.1"
                      placeholder="Max"
                      value={filters.maxWidth}
                      onChange={(e) => setFilters({ ...filters, maxWidth: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Model Yılı */}
              <div>
                <Label className="text-sm text-slate-700 mb-2 block">Model Yılı</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      id="minModelYearDesktop"
                      type="number"
                      placeholder="Min"
                      value={filters.minModelYear}
                      onChange={(e) => setFilters({ ...filters, minModelYear: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <span className="text-slate-400">-</span>
                  <div className="flex-1">
                    <Input
                      id="maxModelYearDesktop"
                      type="number"
                      placeholder="Max"
                      value={filters.maxModelYear}
                      onChange={(e) => setFilters({ ...filters, maxModelYear: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* İmkanlar */}
              {amenities.length > 0 && (
                <div>
                  <Label className="text-sm text-slate-700 mb-2 block">İmkanlar</Label>
                  <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-3">
                    {amenities.map((amenity) => (
                      <div key={amenity.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`amenity-desktop-${amenity.id}`}
                          checked={filters.selectedAmenities.includes(amenity.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters({
                                ...filters,
                                selectedAmenities: [...filters.selectedAmenities, amenity.id],
                              });
                            } else {
                              setFilters({
                                ...filters,
                                selectedAmenities: filters.selectedAmenities.filter(id => id !== amenity.id),
                              });
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300"
                        />
                        <Label htmlFor={`amenity-desktop-${amenity.id}`} className="text-sm cursor-pointer">
                          {amenity.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

// Filter listings based on filter state (client-side only, amenities filter handled separately)
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
    const price = item[priceField] || 0;
    const priceValue = typeof price === "number" ? price : Number(price || 0);
    if (filters.minPrice && priceValue < Number(filters.minPrice)) return false;
    if (filters.maxPrice && priceValue > Number(filters.maxPrice)) return false;

    // Captain filter
    if (filters.hasCaptain !== null && item.has_captain !== filters.hasCaptain) return false;

    // Capacity filter
    const capacity = item.capacity || 0;
    if (filters.minCapacity && capacity < Number(filters.minCapacity)) return false;
    if (filters.maxCapacity && capacity > Number(filters.maxCapacity)) return false;

    // Boat type filter
    if (filters.boatType && item.boat_type !== filters.boatType) return false;

    // Length filter
    const length = item.length_metres || 0;
    const lengthValue = typeof length === "number" ? length : Number(length || 0);
    if (filters.minLength && lengthValue < Number(filters.minLength)) return false;
    if (filters.maxLength && lengthValue > Number(filters.maxLength)) return false;

    // Width filter
    const width = item.width_metres || 0;
    const widthValue = typeof width === "number" ? width : Number(width || 0);
    if (filters.minWidth && widthValue < Number(filters.minWidth)) return false;
    if (filters.maxWidth && widthValue > Number(filters.maxWidth)) return false;

    // Model year filter
    const modelYear = item.model_year || 0;
    const modelYearValue = typeof modelYear === "number" ? modelYear : Number(modelYear || 0);
    if (filters.minModelYear && modelYearValue < Number(filters.minModelYear)) return false;
    if (filters.maxModelYear && modelYearValue > Number(filters.maxModelYear)) return false;

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
    if (filters.boatType) params.set("boatType", filters.boatType);
    else params.delete("boatType");
    if (filters.minLength) params.set("minLength", filters.minLength);
    else params.delete("minLength");
    if (filters.maxLength) params.set("maxLength", filters.maxLength);
    else params.delete("maxLength");
    if (filters.minWidth) params.set("minWidth", filters.minWidth);
    else params.delete("minWidth");
    if (filters.maxWidth) params.set("maxWidth", filters.maxWidth);
    else params.delete("maxWidth");
    if (filters.minModelYear) params.set("minModelYear", filters.minModelYear);
    else params.delete("minModelYear");
    if (filters.maxModelYear) params.set("maxModelYear", filters.maxModelYear);
    else params.delete("maxModelYear");
    if (filters.selectedAmenities.length > 0) params.set("amenities", filters.selectedAmenities.join(","));
    else params.delete("amenities");
    
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
        boatType: initialFilters.boatType || "",
        minLength: initialFilters.minLength || "",
        maxLength: initialFilters.maxLength || "",
        minWidth: initialFilters.minWidth || "",
        maxWidth: initialFilters.maxWidth || "",
        minModelYear: initialFilters.minModelYear || "",
        maxModelYear: initialFilters.maxModelYear || "",
        selectedAmenities: initialFilters.selectedAmenities || [],
      });
    }
  }, [initialFilters]);

  // Calculate filtered count based on current filters (for preview in modal)
  const filteredListings = filterListings(listings, currentFilters, priceType);
  const [filteredCount, setFilteredCount] = useState(filteredListings.length);
  
  useEffect(() => {
    const calculateFilteredCount = async () => {
      let filtered = filterListings(listings, currentFilters, priceType);
      
      // Apply amenities filter if needed
      if (currentFilters.selectedAmenities.length > 0) {
        const { data: listingsWithAmenities } = await supabase
          .from('listing_amenities')
          .select('listing_id')
          .in('amenity_id', currentFilters.selectedAmenities);
        
        if (listingsWithAmenities) {
          const listingIdsWithAmenities = new Set(listingsWithAmenities.map(la => la.listing_id));
          filtered = filtered.filter(item => listingIdsWithAmenities.has(item.id));
        }
      }
      
      setFilteredCount(filtered.length);
    };
    calculateFilteredCount();
  }, [listings, currentFilters, priceType]);

  // Check if any filter besides type is active (for red dot indicator)
  const hasNonTypeFilters = () => {
    return (
      currentFilters.minPrice !== "" ||
      currentFilters.maxPrice !== "" ||
      currentFilters.hasCaptain !== null ||
      currentFilters.minCapacity !== "" ||
      currentFilters.maxCapacity !== "" ||
      currentFilters.boatType !== "" ||
      currentFilters.minLength !== "" ||
      currentFilters.maxLength !== "" ||
      currentFilters.minWidth !== "" ||
      currentFilters.maxWidth !== "" ||
      currentFilters.minModelYear !== "" ||
      currentFilters.maxModelYear !== "" ||
      currentFilters.selectedAmenities.length > 0
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span>Filtreler</span>
        {hasNonTypeFilters() && (
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
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

// Clear Filters Button Component (for use in empty state)
export function ClearFiltersButton({ 
  type,
  location
}: { 
  type?: string;
  location?: string;
}) {
  const handleClearFilters = () => {
    // Build URL params - keep only type and location, remove all other filters
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (location) params.set("location", location);
    
    window.location.href = `/yachts?${params.toString()}`;
  };

  return (
    <Button
      variant="outline"
      onClick={handleClearFilters}
      className="mt-4 border-slate-300 text-slate-700 hover:bg-slate-50"
    >
      Seçimleri Kaldır
    </Button>
  );
}
