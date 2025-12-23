"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SimpleSelect } from "@/components/ui/simple-select";

const OPTIONS = [
  { value: "popular", label: "Popüler" },
  { value: "price_asc", label: "Fiyat (Artan)" },
  { value: "price_desc", label: "Fiyat (Azalan)" },
  { value: "capacity_desc", label: "Kapasite" },
];

interface SortSelectProps {
  defaultValue?: string;
  className?: string;
}

export default function SortSelect({ defaultValue = "popular", className = "" }: SortSelectProps) {
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
    <SimpleSelect
      value={current}
      onChange={handleChange}
      options={OPTIONS}
      className={className}
      buttonClassName="h-8 rounded-2xl md:rounded-xl border border-slate-200 bg-white px-2.5 text-[11px] sm:text-xs font-semibold text-slate-700 shadow-sm"
    />
  );
}

