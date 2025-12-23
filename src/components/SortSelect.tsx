"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "popular", label: "Popüler" },
  { value: "price_asc", label: "Fiyat (Artan)" },
  { value: "price_desc", label: "Fiyat (Azalan)" },
  { value: "capacity_desc", label: "Kapasite" },
];

interface SortSelectProps {
  defaultValue?: string;
}

export default function SortSelect({ defaultValue = "popular" }: SortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = useMemo(() => defaultValue || "popular", [defaultValue]);

  const handleChange = (next: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (next === "popular") {
      params.delete("sort");
    } else {
      params.set("sort", next);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <select
      value={current}
      onChange={(e) => handleChange(e.target.value)}
      className="h-10 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

