"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface HeaderProps {
  transparent?: boolean;
}

export default function Header({ transparent = false }: HeaderProps) {
  const pathname = usePathname();
  if (pathname?.startsWith("/listings/")) return null;

  const isHome = pathname === "/";
  const showTransparent = transparent || isHome;

  // Avoid fixed/sticky headers to keep content fully scrollable/clickable on mobile
  const bgClasses = showTransparent
    ? "absolute top-0 left-0 right-0 text-white"
    : "relative bg-white/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur border-b border-slate-200 text-slate-900";

  return (
    <header className={`z-30 transition-all duration-300 ${bgClasses}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className={showTransparent ? "text-white" : "text-slate-900"}>Tekneci</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
