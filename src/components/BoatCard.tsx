"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

type PriceType = "hourly" | "daily" | "stay";

interface BoatCardProps {
  boat: any;
  priceType: PriceType;
}

export function BoatCard({ boat, priceType }: BoatCardProps) {
  const getPrice = () => {
    switch (priceType) {
      case "hourly":
        return boat.price_hourly || 0;
      case "daily":
        return boat.price_daily || 0;
      case "stay":
        return boat.price_stay_per_night || 0;
    }
  };

  const getPriceLabel = () => {
    switch (priceType) {
      case "hourly":
        return "/ saat";
      case "daily":
        return "/ gün";
      case "stay":
        return "/ gece";
    }
  };

  return (
    <Link href={`/listings/${boat.id}?type=${priceType}`} className="block">
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group pt-0 cursor-pointer hover:-translate-y-1 border-0 shadow-md h-full gap-0 py-0">
        <div className="h-40 md:h-56 bg-slate-200 relative overflow-hidden">
          <img
            src={boat.image_urls?.[0] || "https://via.placeholder.com/400"}
            alt={boat.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <Badge className="absolute top-2 right-2 md:top-4 md:right-4 bg-black/70 backdrop-blur-sm text-xs">
            {boat.capacity} Kişilik
          </Badge>
        </div>

        <CardHeader className="pb-2 px-3 md:px-4 pt-3 md:pt-4">
          <CardTitle className="text-base md:text-lg truncate">{boat.title}</CardTitle>
          <div className="flex items-center text-slate-500 text-xs md:text-sm mt-1">
            <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1" /> {boat.location}
          </div>
        </CardHeader>

        <CardFooter className="flex justify-between items-center border-t pt-3 md:pt-3.5 px-3 md:px-4 pb-3 md:pb-3.5 bg-slate-50/50">
          <div>
            <span className="text-lg md:text-xl font-bold text-slate-900">
              {new Intl.NumberFormat("tr-TR", {
                style: "currency",
                currency: boat.currency || "TRY",
              }).format(getPrice())}
            </span>
            <span className="text-xs text-slate-500 ml-1">{getPriceLabel()}</span>
          </div>
          <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-xs md:text-sm px-3 md:px-4">
            İncele
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
