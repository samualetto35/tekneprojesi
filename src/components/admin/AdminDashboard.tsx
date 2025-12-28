"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Package,
  CheckCircle,
  MessageSquare,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Get authenticated Supabase client
async function getAuthenticatedClient() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('sb-access-token') : null;
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('sb-refresh-token') : null;
  
  if (accessToken && refreshToken) {
    try {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } catch (error) {
      console.error('Session set error:', error);
    }
  }
  
  return supabase;
}

interface AdminDashboardProps {
  totalListings: number;
  activeListings: number;
  totalLeads: number;
  listings: any[];
  leadCountsByListing?: Record<
    string,
    { new: number; contacted: number; confirmed: number; cancelled: number; completed: number; total: number }
  >;
}

export default function AdminDashboard({
  totalListings,
  activeListings,
  totalLeads,
  listings,
  leadCountsByListing = {},
}: AdminDashboardProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleLogout = async () => {
    const supabase = await getAuthenticatedClient();
    await supabase.auth.signOut();
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
    await fetch('/api/auth/clear-session', { method: 'POST' });
    router.push("/admin/login");
    router.refresh();
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const supabase = await getAuthenticatedClient();
    const { error } = await supabase
      .from("listings")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (!error) {
      router.refresh();
    } else {
      alert("Hata: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ilanı silmek istediğinize emin misiniz?")) {
      return;
    }

    setDeletingId(id);
    const supabase = await getAuthenticatedClient();
    const { error } = await supabase.from("listings").delete().eq("id", id);

    setDeletingId(null);
    if (!error) {
      router.refresh();
    } else {
      alert("Hata: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-sm text-slate-500">İlan Yönetim Paneli</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/listings/new">
                <Button className="bg-slate-900 hover:bg-slate-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni İlan
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Çıkış
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam İlan</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalListings}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif İlan</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeListings}</div>
            </CardContent>
          </Card>
          <Link href="/admin/leads">
            <Card className="cursor-pointer hover:bg-slate-50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Lead</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLeads}</div>
                <p className="text-xs text-slate-500 mt-1">Tıklayarak görüntüle</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Listings Table */}
        <Card>
          <CardHeader>
            <CardTitle>İlanlar</CardTitle>
            <CardDescription>Tüm ilanları görüntüleyin ve yönetin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-medium text-slate-700">Başlık</th>
                    <th className="text-left p-3 text-sm font-medium text-slate-700">Lokasyon</th>
                    <th className="text-left p-3 text-sm font-medium text-slate-700">Kapasite</th>
                    <th className="text-left p-3 text-sm font-medium text-slate-700">Leads</th>
                    <th className="text-left p-3 text-sm font-medium text-slate-700">Durum</th>
                    <th className="text-left p-3 text-sm font-medium text-slate-700">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        Henüz ilan bulunmuyor. Yeni ilan eklemek için yukarıdaki butonu kullanın.
                      </td>
                    </tr>
                  ) : (
                    listings.map((listing) => {
                      const leadCounts = leadCountsByListing[listing.id] || {
                        new: 0,
                        contacted: 0,
                        confirmed: 0,
                        cancelled: 0,
                        completed: 0,
                        total: 0,
                      };

                      return (
                        <tr key={listing.id} className="border-b hover:bg-slate-50">
                          <td className="p-3">
                            <div className="font-medium">{listing.title || "Başlıksız"}</div>
                          </td>
                          <td className="p-3 text-sm text-slate-600">{listing.location || "-"}</td>
                          <td className="p-3 text-sm">{listing.capacity || 0} kişi</td>
                          <td className="p-3">
                            {leadCounts.total > 0 ? (
                              <Link href={`/admin/leads?listing_id=${listing.id}`}>
                                <div className="flex flex-col gap-1 cursor-pointer hover:underline">
                                  <div className="text-sm font-medium text-slate-900">
                                    Toplam: {leadCounts.total}
                                  </div>
                                  <div className="flex flex-wrap gap-1 text-xs">
                                    {leadCounts.new > 0 && (
                                      <Badge className="bg-blue-600 text-white">
                                        Yeni: {leadCounts.new}
                                      </Badge>
                                    )}
                                    {leadCounts.confirmed > 0 && (
                                      <Badge className="bg-green-600 text-white">
                                        Onay: {leadCounts.confirmed}
                                      </Badge>
                                    )}
                                    {leadCounts.contacted > 0 && (
                                      <Badge className="bg-yellow-600 text-white">
                                        İletişim: {leadCounts.contacted}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={listing.is_active ? "default" : "secondary"}
                              className={listing.is_active ? "bg-green-600" : ""}
                            >
                              {listing.is_active ? "Aktif" : "Pasif"}
                            </Badge>
                          </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(listing.id, listing.is_active)}
                              title={listing.is_active ? "Pasif Yap" : "Aktif Yap"}
                            >
                              {listing.is_active ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                            <Link href={`/admin/listings/${listing.id}/edit`}>
                              <Button variant="ghost" size="sm" title="Düzenle">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(listing.id)}
                              disabled={deletingId === listing.id}
                              title="Sil"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
      </div>
    </div>
  );
}

