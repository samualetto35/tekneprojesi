"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SimpleOption {
  value: string;
  label: string;
}

interface SimpleSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SimpleOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  renderLabel?: (option: SimpleOption, selected: boolean) => ReactNode;
}

export function SimpleSelect({
  value,
  onChange,
  options,
  placeholder = "Seçiniz",
  className,
  buttonClassName,
  menuClassName,
  renderLabel,
}: SimpleSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const selected = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  const menuRef = useRef<HTMLDivElement | null>(null);
  const [triggerWidth, setTriggerWidth] = useState<number | undefined>(undefined);

  // Get trigger width
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

  // Position menu properly (avoid overflow)
  useEffect(() => {
    if (open && ref.current && menuRef.current) {
      const rect = ref.current.getBoundingClientRect();
      const menu = menuRef.current;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Reset classes and styles
      menu.classList.remove("bottom-full", "mb-1", "mt-1", "right-0", "left-0");
      menu.style.left = "";
      menu.style.right = "";
      
      // Check horizontal overflow - if menu would exceed viewport width, align to right
      const menuWidth = triggerWidth ? Math.max(triggerWidth, 280) : 280;
      if (rect.left + menuWidth > viewportWidth - 16) {
        menu.classList.add("right-0");
      } else {
        menu.classList.add("left-0");
      }
      
      // Check if there's enough space below, otherwise show above
      if (spaceBelow < 250 && spaceAbove > spaceBelow) {
        menu.classList.add("bottom-full", "mb-1");
      } else {
        menu.classList.add("mt-1");
      }
    }
  }, [open, triggerWidth]);

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
            "absolute z-[9999] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl max-h-[320px] overflow-y-auto",
            menuClassName
          )}
          style={{
            width: triggerWidth ? `${Math.max(triggerWidth, 280)}px` : "100%",
            minWidth: "280px",
            maxWidth: "calc(100vw - 2rem)",
          }}
        >
          {options.map((opt) => {
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
          })}
        </div>
      )}
    </div>
  );
}


