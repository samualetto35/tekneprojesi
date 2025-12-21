"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => router.back()}
      className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Geri
    </Button>
  );
}

