"use client";

import { X, Phone, Mail, MapPin, Calendar, Users, Package, DollarSign, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Lead {
  id: string;
  listing_id: string;
  customer_name: string;
  customer_phone: string;
  requested_charter_type: string;
  start_timestamp: string;
  end_timestamp?: string;
  guest_count?: number;
  extra_notes?: string;
  status: string;
  admin_status_note?: string;
  created_at: string;
  listings?: {
    id: string;
    title: string;
    location: string;
    capacity?: number;
    captain_name?: string;
    captain_phone?: string;
    captain_email?: string;
    currency?: string;
    price_hourly?: number;
    price_daily?: number;
    price_stay_per_night?: number;
    commission_rate?: number;
    min_hours?: number;
    min_stay_days?: number;
  };
}

interface LeadDetailModalProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: "Yeni", color: "bg-blue-600" },
  contacted: { label: "İletişime Geçildi", color: "bg-yellow-600" },
  confirmed: { label: "Onaylandı", color: "bg-green-600" },
  cancelled: { label: "İptal", color: "bg-red-600" },
  completed: { label: "Tamamlandı", color: "bg-slate-600" },
};

const charterTypeLabels: Record<string, string> = {
  hourly: "Saatlik",
  daily: "Günübirlik",
  stay: "Konaklamalı",
};

function calculatePrice(lead: Lead): {
  basePrice: number;
  totalPrice: number;
  commission: number;
  commissionAmount: number;
  finalPrice: number;
} {
  if (!lead.listings) {
    return { basePrice: 0, totalPrice: 0, commission: 0, commissionAmount: 0, finalPrice: 0 };
  }

  const listing = lead.listings;
  const currency = listing.currency || "TRY";
  const commissionRate = listing.commission_rate || 0;
  
  let basePrice = 0;
  let totalPrice = 0;

  if (lead.requested_charter_type === "hourly" && listing.price_hourly) {
    const startDate = new Date(lead.start_timestamp);
    const endDate = lead.end_timestamp ? new Date(lead.end_timestamp) : new Date(startDate.getTime() + (listing.min_hours || 2) * 60 * 60 * 1000);
    const hours = Math.max((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60), listing.min_hours || 2);
    basePrice = listing.price_hourly;
    totalPrice = Math.ceil(hours) * basePrice;
  } else if (lead.requested_charter_type === "daily" && listing.price_daily) {
    basePrice = listing.price_daily;
    totalPrice = basePrice;
  } else if (lead.requested_charter_type === "stay" && listing.price_stay_per_night) {
    const startDate = new Date(lead.start_timestamp);
    const endDate = lead.end_timestamp ? new Date(lead.end_timestamp) : new Date(startDate.getTime() + (listing.min_stay_days || 3) * 24 * 60 * 60 * 1000);
    const days = Math.max(Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)), listing.min_stay_days || 3);
    basePrice = listing.price_stay_per_night;
    totalPrice = days * basePrice;
  }

  const commissionAmount = Math.round((totalPrice * commissionRate) / 100);
  const finalPrice = totalPrice - commissionAmount;

  return {
    basePrice,
    totalPrice,
    commission: commissionRate,
    commissionAmount,
    finalPrice,
  };
}

function formatCurrency(amount: number, currency: string = "TRY"): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LeadDetailModal({ lead, open, onClose }: LeadDetailModalProps) {
  if (!lead) return null;

  const priceInfo = calculatePrice(lead);
  const listing = lead.listings;
  const currency = listing?.currency || "TRY";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Lead Detayları</span>
            <Badge
              className={statusLabels[lead.status]?.color || "bg-slate-600"}
            >
              {statusLabels[lead.status]?.label || lead.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Tüm lead bilgileri ve hesaplamalar
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Müşteri Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Müşteri Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-slate-500 mb-1">Ad Soyad</div>
                <div className="font-medium">{lead.customer_name}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  Telefon
                </div>
                <div className="font-medium">{lead.customer_phone}</div>
              </div>
              {lead.guest_count && (
                <div>
                  <div className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Misafir Sayısı
                  </div>
                  <div className="font-medium">{lead.guest_count} kişi</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* İlan Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">İlan Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  İlan
                </div>
                <div className="font-medium">{listing?.title || "Bilinmeyen İlan"}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Lokasyon
                </div>
                <div className="font-medium">{listing?.location || "-"}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Kapasite</div>
                <div className="font-medium">{listing?.capacity || "-"} kişi</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Kiralama Türü</div>
                <div className="font-medium">
                  {charterTypeLabels[lead.requested_charter_type] || lead.requested_charter_type}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kaptan Bilgileri */}
          {listing?.captain_name && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kaptan Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-slate-500 mb-1">Ad Soyad</div>
                  <div className="font-medium">{listing.captain_name}</div>
                </div>
                {listing.captain_phone && (
                  <div>
                    <div className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Telefon
                    </div>
                    <div className="font-medium">{listing.captain_phone}</div>
                  </div>
                )}
                {listing.captain_email && (
                  <div>
                    <div className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      E-posta
                    </div>
                    <div className="font-medium">{listing.captain_email}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tarih Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tarih Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Başlangıç
                </div>
                <div className="font-medium">{formatDate(lead.start_timestamp)}</div>
              </div>
              {lead.end_timestamp && (
                <div>
                  <div className="text-sm text-slate-500 mb-1">Bitiş</div>
                  <div className="font-medium">{formatDate(lead.end_timestamp)}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-slate-500 mb-1">Oluşturulma</div>
                <div className="font-medium text-sm">{formatDate(lead.created_at)}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fiyat ve Komisyon Bilgileri */}
        {priceInfo.totalPrice > 0 && (
          <Card className="mt-4 border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Fiyat ve Komisyon Hesaplaması
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-600 mb-1">Birim Fiyat</div>
                  <div className="text-xl font-bold">
                    {formatCurrency(priceInfo.basePrice, currency)}
                    {lead.requested_charter_type === "hourly" && " / saat"}
                    {lead.requested_charter_type === "stay" && " / gece"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Toplam Tutar</div>
                  <div className="text-xl font-bold text-blue-600">
                    {formatCurrency(priceInfo.totalPrice, currency)}
                  </div>
                </div>
                {priceInfo.commission > 0 && (
                  <>
                    <div>
                      <div className="text-sm text-slate-600 mb-1 flex items-center gap-1">
                        <Percent className="w-4 h-4" />
                        Komisyon Oranı
                      </div>
                      <div className="text-lg font-semibold">{priceInfo.commission}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600 mb-1">Komisyon Tutarı</div>
                      <div className="text-lg font-semibold text-red-600">
                        - {formatCurrency(priceInfo.commissionAmount, currency)}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">Net Tutar (Kaptana Ödenecek)</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(priceInfo.finalPrice, currency)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notlar */}
        {(lead.extra_notes || lead.admin_status_note) && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Notlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.extra_notes && (
                <div>
                  <div className="text-sm text-slate-500 mb-2">Müşteri Notları</div>
                  <div className="p-3 bg-slate-50 rounded-md whitespace-pre-wrap text-sm">
                    {lead.extra_notes}
                  </div>
                </div>
              )}
              {lead.admin_status_note && (
                <div>
                  <div className="text-sm text-slate-500 mb-2">Admin Notları</div>
                  <div className="p-3 bg-blue-50 rounded-md whitespace-pre-wrap text-sm">
                    {lead.admin_status_note}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}

