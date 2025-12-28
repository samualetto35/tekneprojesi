"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Save,
  Phone,
  Calendar,
  Users,
  FileText,
  Package,
  MapPin,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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
    capacity: number;
  };
}

interface LeadDetailProps {
  lead: Lead;
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

export default function LeadDetail({ lead: initialLead }: LeadDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lead, setLead] = useState(initialLead);
  const [formData, setFormData] = useState({
    status: lead.status,
    admin_status_note: lead.admin_status_note || "",
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase
        .from("leads")
        .update({
          status: formData.status,
          admin_status_note: formData.admin_status_note || null,
        })
        .eq("id", lead.id);

      if (error) throw error;

      setLead((prev) => ({
        ...prev,
        status: formData.status,
        admin_status_note: formData.admin_status_note,
      }));

      setLoading(false);
      alert("Lead güncellendi!");
      router.refresh();
    } catch (error: any) {
      alert("Hata: " + error.message);
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/leads">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Lead Detayı</h1>
                <p className="text-sm text-slate-500">Lead bilgilerini görüntüleyin ve düzenleyin</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Müşteri Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle>Müşteri Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Müşteri Adı</Label>
                    <div className="mt-1 p-2 bg-slate-50 rounded-md">{lead.customer_name}</div>
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Telefon
                    </Label>
                    <div className="mt-1 p-2 bg-slate-50 rounded-md">{lead.customer_phone}</div>
                  </div>
                </div>
                {lead.guest_count && (
                  <div>
                    <Label className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Misafir Sayısı
                    </Label>
                    <div className="mt-1 p-2 bg-slate-50 rounded-md">
                      {lead.guest_count} kişi
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* İlan Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle>İlan Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lead.listings && (
                  <>
                    <div>
                      <Label className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        İlan
                      </Label>
                      <div className="mt-1 p-2 bg-slate-50 rounded-md">
                        {lead.listings.title}
                      </div>
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Lokasyon
                      </Label>
                      <div className="mt-1 p-2 bg-slate-50 rounded-md">
                        {lead.listings.location}
                      </div>
                    </div>
                    <div>
                      <Label>Kapasite</Label>
                      <div className="mt-1 p-2 bg-slate-50 rounded-md">
                        {lead.listings.capacity} kişi
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Rezervasyon Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle>Rezervasyon Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Kiralama Türü
                  </Label>
                  <div className="mt-1 p-2 bg-slate-50 rounded-md">
                    {charterTypeLabels[lead.requested_charter_type] ||
                      lead.requested_charter_type}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Başlangıç Tarihi/Saati</Label>
                    <div className="mt-1 p-2 bg-slate-50 rounded-md">
                      {formatDate(lead.start_timestamp)}
                    </div>
                  </div>
                  {lead.end_timestamp && (
                    <div>
                      <Label>Bitiş Tarihi/Saati</Label>
                      <div className="mt-1 p-2 bg-slate-50 rounded-md">
                        {formatDate(lead.end_timestamp)}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Oluşturulma Tarihi</Label>
                  <div className="mt-1 p-2 bg-slate-50 rounded-md">
                    {formatDate(lead.created_at)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notlar */}
            {lead.extra_notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Müşteri Notları
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-slate-50 rounded-md whitespace-pre-wrap">
                    {lead.extra_notes}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin Yönetimi */}
            <Card>
              <CardHeader>
                <CardTitle>Yönetim</CardTitle>
                <CardDescription>Lead durumunu ve notlarını güncelleyin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Durum</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([status, { label }]) => (
                        <SelectItem key={status} value={status}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-slate-600">Mevcut durum:</span>
                    <Badge
                      className={statusLabels[lead.status]?.color || "bg-slate-600"}
                    >
                      {statusLabels[lead.status]?.label || lead.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Admin Notu</Label>
                  <Textarea
                    value={formData.admin_status_note}
                    onChange={(e) => handleInputChange("admin_status_note", e.target.value)}
                    placeholder="Lead ile ilgili notlarınızı buraya yazabilirsiniz..."
                    rows={4}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}

