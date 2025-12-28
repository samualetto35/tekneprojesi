"use client";

import { useEffect, useRef, useState, type ReactNode, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { SimpleOption } from "./simple-select";

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SimpleOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  renderLabel?: (option: SimpleOption, selected: boolean) => ReactNode;
  searchPlaceholder?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Seçiniz",
  className,
  buttonClassName,
  menuClassName,
  renderLabel,
  searchPlaceholder = "Ara...",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [triggerWidth, setTriggerWidth] = useState<number | undefined>(undefined);
  const ref = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const selected = options.find((opt) => opt.value === value);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase().trim();
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) {
        setOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Get trigger width and position menu properly (avoid overflow)
  useEffect(() => {
    const updateWidth = () => {
      if (ref.current) {
        const width = ref.current.getBoundingClientRect().width;
        setTriggerWidth(width);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    if (open && ref.current && menuRef.current) {
      const rect = ref.current.getBoundingClientRect();
      const menu = menuRef.current;
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Reset classes
      menu.classList.remove("bottom-full", "mb-1", "mt-1");
      
      // Check if there's enough space below, otherwise show above
      if (spaceBelow < 350 && spaceAbove > spaceBelow) {
        menu.classList.add("bottom-full", "mb-1");
      } else {
        menu.classList.add("mt-1");
      }
    }
  }, [open]);

  const handleSelect = (next: string) => {
    onChange(next);
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center justify-between rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors",
          buttonClassName
        )}
      >
        <span className={cn("truncate text-left", !selected && "text-slate-400")}>
          {selected
            ? renderLabel
              ? renderLabel(selected, true)
              : selected.label
            : placeholder}
        </span>
        <svg
          className="ml-2 h-3.5 w-3.5 text-slate-400 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          className={cn(
            "absolute z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl",
            menuClassName
          )}
          style={{
            width: triggerWidth ? `${Math.max(triggerWidth, 280)}px` : "100%",
            minWidth: "280px",
            maxWidth: "calc(100vw - 2rem)",
          }}
        >
          {/* Search Input */}
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200 p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setOpen(false);
                    setSearchQuery("");
                  }
                }}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-[calc(100vh-250px)] py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                Sonuç bulunamadı
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "block w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors",
                      isSelected && "bg-blue-50 text-blue-900 font-semibold"
                    )}
                  >
                    {renderLabel ? renderLabel(opt, isSelected) : opt.label}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
