"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  Calendar,
  Users,
  FileText,
  Filter,
  X,
  Search,
  Eye,
  DollarSign,
  User,
  Grid3x3,
  List,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LeadDetailModal from "./LeadDetailModal";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getAuthenticatedClient() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const accessToken =
    typeof window !== "undefined" ? localStorage.getItem("sb-access-token") : null;
  const refreshToken =
    typeof window !== "undefined" ? localStorage.getItem("sb-refresh-token") : null;

  if (accessToken && refreshToken) {
    try {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } catch (error) {
      console.error("Session set error:", error);
    }
  }

  return supabase;
}

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

interface LeadsListProps {
  leads: Lead[];
  listings: Array<{ id: string; title: string; location: string }>;
  statusCounts: Record<string, number>;
  currentStatus?: string;
  currentListingId?: string;
  currentSort?: string;
  currentSearch?: string;
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

function calculateLeadPrice(lead: Lead): number {
  if (!lead.listings) return 0;

  const listing = lead.listings;
  let totalPrice = 0;

  if (lead.requested_charter_type === "hourly" && listing.price_hourly) {
    const startDate = new Date(lead.start_timestamp);
    const endDate = lead.end_timestamp ? new Date(lead.end_timestamp) : new Date(startDate.getTime() + (listing.min_hours || 2) * 60 * 60 * 1000);
    const hours = Math.max((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60), listing.min_hours || 2);
    totalPrice = Math.ceil(hours) * listing.price_hourly;
  } else if (lead.requested_charter_type === "daily" && listing.price_daily) {
    totalPrice = listing.price_daily;
  } else if (lead.requested_charter_type === "stay" && listing.price_stay_per_night) {
    const startDate = new Date(lead.start_timestamp);
    const endDate = lead.end_timestamp ? new Date(lead.end_timestamp) : new Date(startDate.getTime() + (listing.min_stay_days || 3) * 24 * 60 * 60 * 1000);
    const days = Math.max(Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)), listing.min_stay_days || 3);
    totalPrice = days * listing.price_stay_per_night;
  }

  return totalPrice;
}

function formatCurrency(amount: number, currency: string = "TRY"): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function LeadsList({
  leads,
  listings,
  statusCounts,
  currentStatus,
  currentListingId,
  currentSort = "newest",
  currentSearch = "",
}: LeadsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentSearch);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "price" | "captain" | "date" | "type">("table");

  // Client-side sorting for price and captain
  const sortedLeads = useMemo(() => {
    let sorted = [...leads];
    
    if (currentSort === "price_asc") {
      sorted.sort((a, b) => calculateLeadPrice(a) - calculateLeadPrice(b));
    } else if (currentSort === "price_desc") {
      sorted.sort((a, b) => calculateLeadPrice(b) - calculateLeadPrice(a));
    } else if (currentSort === "captain_asc") {
      sorted.sort((a, b) => {
        const aName = a.listings?.captain_name || "";
        const bName = b.listings?.captain_name || "";
        return aName.localeCompare(bName, "tr");
      });
    } else if (currentSort === "captain_desc") {
      sorted.sort((a, b) => {
        const aName = a.listings?.captain_name || "";
        const bName = b.listings?.captain_name || "";
        return bName.localeCompare(aName, "tr");
      });
    }
    
    return sorted;
  }, [leads, currentSort]);

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status && status !== "all") {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    router.push(`/admin/leads?${params.toString()}`);
  };

  const handleListingFilter = (listingId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (listingId && listingId !== "all") {
      params.set("listing_id", listingId);
    } else {
      params.delete("listing_id");
    }
    router.push(`/admin/leads?${params.toString()}`);
  };

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort && sort !== "newest") {
      params.set("sort", sort);
    } else {
      params.delete("sort");
    }
    router.push(`/admin/leads?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchValue.trim()) {
      params.set("search", searchValue.trim());
    } else {
      params.delete("search");
    }
    router.push(`/admin/leads?${params.toString()}`);
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setUpdatingStatus(leadId);
    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", leadId);

      if (error) throw error;

      router.refresh();
    } catch (error: any) {
      alert("Hata: " + error.message);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const clearFilters = () => {
    setSearchValue("");
    router.push("/admin/leads");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Group leads by view mode
  const groupedLeads = useMemo(() => {
    if (viewMode === "price") {
      const grouped: Record<string, Lead[]> = {};
      sortedLeads.forEach((lead) => {
        const price = calculateLeadPrice(lead);
        const priceRange = price < 5000 ? "0-5K" : price < 10000 ? "5K-10K" : price < 20000 ? "10K-20K" : "20K+";
        if (!grouped[priceRange]) grouped[priceRange] = [];
        grouped[priceRange].push(lead);
      });
      return grouped;
    } else if (viewMode === "captain") {
      const grouped: Record<string, Lead[]> = {};
      sortedLeads.forEach((lead) => {
        const captain = lead.listings?.captain_name || "Kaptan Bilgisi Yok";
        if (!grouped[captain]) grouped[captain] = [];
        grouped[captain].push(lead);
      });
      return grouped;
    } else if (viewMode === "type") {
      const grouped: Record<string, Lead[]> = {};
      sortedLeads.forEach((lead) => {
        const type = charterTypeLabels[lead.requested_charter_type] || lead.requested_charter_type;
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(lead);
      });
      return grouped;
    } else if (viewMode === "date") {
      const grouped: Record<string, Lead[]> = {};
      sortedLeads.forEach((lead) => {
        const date = new Date(lead.start_timestamp);
        const dateKey = date.toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(lead);
      });
      return grouped;
    }
    return {};
  }, [sortedLeads, viewMode]);

  const displayLeads = viewMode === "table" ? sortedLeads : Object.values(groupedLeads).flat();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Leads Yönetimi</h1>
                <p className="text-sm text-slate-500">Tüm lead kayıtlarını görüntüleyin ve yönetin</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Status Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {Object.entries(statusLabels).map(([status, { label, color }]) => (
            <Card
              key={status}
              className={`cursor-pointer transition-all ${
                currentStatus === status ? "ring-2 ring-slate-900" : ""
              }`}
              onClick={() => handleStatusFilter(status)}
            >
              <CardContent className="p-4">
                <div className="text-sm text-slate-600 mb-1">{label}</div>
                <div className={`text-2xl font-bold ${color.replace("bg-", "text-")}`}>
                  {statusCounts[status] || 0}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtreler ve Arama
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  <List className="w-4 h-4 mr-2" />
                  Liste
                </Button>
                <Button
                  variant={viewMode === "price" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("price")}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Fiyat
                </Button>
                <Button
                  variant={viewMode === "captain" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("captain")}
                >
                  <User className="w-4 h-4 mr-2" />
                  Kaptan
                </Button>
                <Button
                  variant={viewMode === "date" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("date")}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Tarih
                </Button>
                <Button
                  variant={viewMode === "type" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("type")}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Tür
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Müşteri adı, telefon, kaptan adı/email, ilan adı veya lokasyon ara..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit">Ara</Button>
                {currentSearch && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSearchValue("");
                      const params = new URLSearchParams(searchParams.toString());
                      params.delete("search");
                      router.push(`/admin/leads?${params.toString()}`);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </form>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={currentStatus || "all"} onValueChange={handleStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm Statuslar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Statuslar</SelectItem>
                      {Object.entries(statusLabels).map(([status, { label }]) => (
                        <SelectItem key={status} value={status}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">İlan</label>
                  <Select
                    value={currentListingId || "all"}
                    onValueChange={handleListingFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm İlanlar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm İlanlar</SelectItem>
                      {listings.map((listing) => (
                        <SelectItem key={listing.id} value={listing.id}>
                          {listing.title} - {listing.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sıralama</label>
                  <Select value={currentSort} onValueChange={handleSortChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">En Yeni</SelectItem>
                      <SelectItem value="oldest">En Eski</SelectItem>
                      <SelectItem value="name_asc">İsim (A-Z)</SelectItem>
                      <SelectItem value="name_desc">İsim (Z-A)</SelectItem>
                      <SelectItem value="date_asc">Tarih (Eski-Yeni)</SelectItem>
                      <SelectItem value="date_desc">Tarih (Yeni-Eski)</SelectItem>
                      <SelectItem value="price_asc">Fiyat (Düşük-Yüksek)</SelectItem>
                      <SelectItem value="price_desc">Fiyat (Yüksek-Düşük)</SelectItem>
                      <SelectItem value="captain_asc">Kaptan (A-Z)</SelectItem>
                      <SelectItem value="captain_desc">Kaptan (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  {(currentStatus || currentListingId || currentSearch) && (
                    <Button variant="outline" onClick={clearFilters} className="w-full">
                      <X className="w-4 h-4 mr-2" />
                      Filtreleri Temizle
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads Display */}
        {viewMode === "table" ? (
          <Card>
            <CardHeader>
              <CardTitle>Lead Listesi</CardTitle>
              <CardDescription>
                {displayLeads.length} lead kaydı bulundu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-medium text-slate-700">Müşteri</th>
                      <th className="text-left p-3 text-sm font-medium text-slate-700">İlan</th>
                      <th className="text-left p-3 text-sm font-medium text-slate-700">Kaptan</th>
                      <th className="text-left p-3 text-sm font-medium text-slate-700">Tür</th>
                      <th className="text-left p-3 text-sm font-medium text-slate-700">Fiyat</th>
                      <th className="text-left p-3 text-sm font-medium text-slate-700">Tarih/Saat</th>
                      <th className="text-left p-3 text-sm font-medium text-slate-700">Status</th>
                      <th className="text-left p-3 text-sm font-medium text-slate-700">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayLeads.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          Lead bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      displayLeads.map((lead) => {
                        const price = calculateLeadPrice(lead);
                        const currency = lead.listings?.currency || "TRY";
                        return (
                          <tr key={lead.id} className="border-b hover:bg-slate-50">
                            <td className="p-3">
                              <div className="font-medium">{lead.customer_name}</div>
                              <div className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                {lead.customer_phone}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="text-sm font-medium">
                                {lead.listings?.title || "Bilinmeyen İlan"}
                              </div>
                              <div className="text-xs text-slate-500">
                                {lead.listings?.location || "-"}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="text-sm font-medium">
                                {lead.listings?.captain_name || "-"}
                              </div>
                              {lead.listings?.captain_email && (
                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {lead.listings.captain_email}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-sm">
                              {charterTypeLabels[lead.requested_charter_type] || lead.requested_charter_type}
                            </td>
                            <td className="p-3 text-sm font-medium">
                              {price > 0 ? formatCurrency(price, currency) : "-"}
                            </td>
                            <td className="p-3 text-sm">
                              <div>{formatDate(lead.start_timestamp)}</div>
                              {lead.end_timestamp && (
                                <div className="text-xs text-slate-500">
                                  Bitiş: {formatDate(lead.end_timestamp)}
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Select
                                  value={lead.status}
                                  onValueChange={(newStatus) => handleStatusChange(lead.id, newStatus)}
                                  disabled={updatingStatus === lead.id}
                                >
                                  <SelectTrigger className="w-auto border-0 shadow-none bg-transparent hover:bg-slate-100 p-1 h-auto">
                                    <SelectValue>
                                      <Badge
                                        className={
                                          statusLabels[lead.status]?.color || "bg-slate-600"
                                        }
                                      >
                                        {statusLabels[lead.status]?.label || lead.status}
                                      </Badge>
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(statusLabels).map(([status, { label, color }]) => (
                                      <SelectItem key={status} value={status}>
                                        <div className="flex items-center gap-2">
                                          <div className={`w-2 h-2 rounded-full ${color}`} />
                                          {label}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {updatingStatus === lead.id && (
                                  <span className="text-xs text-slate-500">Güncelleniyor...</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedLead(lead)}
                                  title="Detayları Görüntüle"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Link href={`/admin/leads/${lead.id}`}>
                                  <Button variant="ghost" size="sm" title="Düzenle">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedLeads).map(([groupKey, groupLeads]) => (
              <Card key={groupKey}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      {viewMode === "price" && `${groupKey} ${groupLeads[0]?.listings?.currency || "TRY"}`}
                      {viewMode === "captain" && `Kaptan: ${groupKey}`}
                      {viewMode === "date" && groupKey}
                      {viewMode === "type" && groupKey}
                    </span>
                    <Badge variant="secondary">{groupLeads.length} lead</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupLeads.map((lead) => {
                      const price = calculateLeadPrice(lead);
                      const currency = lead.listings?.currency || "TRY";
                      return (
                        <Card
                          key={lead.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="font-medium">{lead.customer_name}</div>
                                <Badge
                                  className={
                                    statusLabels[lead.status]?.color || "bg-slate-600"
                                  }
                                >
                                  {statusLabels[lead.status]?.label || lead.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-slate-600">
                                {lead.listings?.title || "Bilinmeyen İlan"}
                              </div>
                              {viewMode === "price" && (
                                <div className="text-lg font-bold text-blue-600">
                                  {formatCurrency(price, currency)}
                                </div>
                              )}
                              {viewMode === "captain" && lead.listings?.captain_name && (
                                <div className="text-sm">
                                  <div className="font-medium">Kaptan: {lead.listings.captain_name}</div>
                                  {lead.listings.captain_email && (
                                    <div className="text-xs text-slate-500">{lead.listings.captain_email}</div>
                                  )}
                                </div>
                              )}
                              {viewMode === "date" && (
                                <div className="text-sm text-slate-500">
                                  {formatDate(lead.start_timestamp)}
                                </div>
                              )}
                              {viewMode === "type" && (
                                <div className="text-sm">
                                  {charterTypeLabels[lead.requested_charter_type] || lead.requested_charter_type}
                                </div>
                              )}
                              <div className="flex items-center gap-2 pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedLead(lead);
                                  }}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Detay
                                </Button>
                                <Link href={`/admin/leads/${lead.id}`} onClick={(e) => e.stopPropagation()}>
                                  <Button variant="outline" size="sm">
                                    <Edit className="w-3 h-3 mr-1" />
                                    Düzenle
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <LeadDetailModal
        lead={selectedLead}
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
      />
    </div>
  );
}
