"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LayoutDashboard, 
  Ship, 
  Users, 
  Plus, 
  Pencil, 
  Trash2, 
  Eye,
  Phone,
  TrendingUp,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

// Types
interface Listing {
  id: string;
  title: string;
  description: string;
  location: string;
  capacity: number;
  currency: string;
  image_urls: string[];
  is_active: boolean;
  has_captain: boolean;
  captain_name: string;
  captain_phone: string;
  commission_rate: number;
  // Pricing
  is_hourly_active: boolean;
  price_hourly: number;
  min_hours: number;
  is_daily_active: boolean;
  price_daily: number;
  is_stay_active: boolean;
  price_stay_per_night: number;
  min_stay_days: number;
  created_at: string;
}

interface Lead {
  id: string;
  listing_id: string;
  customer_name: string;
  customer_phone: string;
  requested_charter_type: string;
  start_timestamp: string;
  end_timestamp: string | null;
  guest_count: number;
  status: string;
  created_at: string;
  listings?: { title: string };
}

interface DashboardStats {
  totalListings: number;
  activeListings: number;
  totalLeads: number;
  newLeads: number;
  confirmedLeads: number;
  potentialRevenue: number;
}

// Empty listing template
const emptyListing: Partial<Listing> = {
  title: "",
  description: "",
  location: "İstanbul",
  capacity: 10,
  currency: "TRY",
  image_urls: [],
  is_active: true,
  has_captain: true,
  captain_name: "",
  captain_phone: "",
  commission_rate: 15,
  is_hourly_active: false,
  price_hourly: 0,
  min_hours: 2,
  is_daily_active: true,
  price_daily: 0,
  is_stay_active: false,
  price_stay_per_night: 0,
  min_stay_days: 3,
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [listings, setListings] = useState<Listing[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalListings: 0,
    activeListings: 0,
    totalLeads: 0,
    newLeads: 0,
    confirmedLeads: 0,
    potentialRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Dialog states
  const [listingDialogOpen, setListingDialogOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Partial<Listing>>(emptyListing);
  const [isEditing, setIsEditing] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    
    // Fetch listings
    const { data: listingsData } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });
    
    // Fetch leads with listing info
    const { data: leadsData } = await supabase
      .from("leads")
      .select("*, listings(title)")
      .order("created_at", { ascending: false });

    const fetchedListings = listingsData || [];
    const fetchedLeads = leadsData || [];

    setListings(fetchedListings);
    setLeads(fetchedLeads);

    // Calculate stats
    const activeListings = fetchedListings.filter(l => l.is_active).length;
    const newLeads = fetchedLeads.filter(l => l.status === "new").length;
    const confirmedLeads = fetchedLeads.filter(l => l.status === "confirmed").length;
    
    // Potential revenue from confirmed leads (simplified)
    const potentialRevenue = fetchedLeads
      .filter(l => l.status === "confirmed")
      .reduce((sum, lead) => {
        const listing = fetchedListings.find(l => l.id === lead.listing_id);
        if (!listing) return sum;
        switch (lead.requested_charter_type) {
          case "hourly": return sum + (listing.price_hourly || 0) * 4;
          case "daily": return sum + (listing.price_daily || 0);
          case "stay": return sum + (listing.price_stay_per_night || 0) * 3;
          default: return sum;
        }
      }, 0);

    setStats({
      totalListings: fetchedListings.length,
      activeListings,
      totalLeads: fetchedLeads.length,
      newLeads,
      confirmedLeads,
      potentialRevenue,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Format currency
  const formatCurrency = (amount: number, currency = "TRY") => {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(amount);
  };

  // Listing CRUD operations
  const handleSaveListing = async () => {
    setSaving(true);
    
    const listingData = {
      ...editingListing,
      image_urls: editingListing.image_urls || [],
    };

    if (isEditing && editingListing.id) {
      await supabase
        .from("listings")
        .update(listingData)
        .eq("id", editingListing.id);
    } else {
      await supabase.from("listings").insert(listingData);
    }

    setSaving(false);
    setListingDialogOpen(false);
    setEditingListing(emptyListing);
    setIsEditing(false);
    fetchData();
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm("Bu ilanı silmek istediğinize emin misiniz?")) return;
    await supabase.from("listings").delete().eq("id", id);
    fetchData();
  };

  const handleEditListing = (listing: Listing) => {
    setEditingListing(listing);
    setIsEditing(true);
    setListingDialogOpen(true);
  };

  const handleNewListing = () => {
    setEditingListing(emptyListing);
    setIsEditing(false);
    setListingDialogOpen(true);
  };

  // Lead status update
  const handleLeadStatusChange = async (leadId: string, newStatus: string) => {
    await supabase.from("leads").update({ status: newStatus }).eq("id", leadId);
    fetchData();
  };

  // Add image URL
  const addImageUrl = () => {
    if (imageUrlInput.trim()) {
      setEditingListing({
        ...editingListing,
        image_urls: [...(editingListing.image_urls || []), imageUrlInput.trim()],
      });
      setImageUrlInput("");
    }
  };

  // Remove image URL
  const removeImageUrl = (index: number) => {
    const newUrls = [...(editingListing.image_urls || [])];
    newUrls.splice(index, 1);
    setEditingListing({ ...editingListing, image_urls: newUrls });
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-500"><AlertCircle className="w-3 h-3 mr-1" /> Yeni</Badge>;
      case "contacted":
        return <Badge className="bg-yellow-500"><Phone className="w-3 h-3 mr-1" /> İletişime Geçildi</Badge>;
      case "confirmed":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Onaylandı</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> İptal</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Charter type label
  const getCharterTypeLabel = (type: string) => {
    switch (type) {
      case "hourly": return "Saatlik";
      case "daily": return "Günlük";
      case "stay": return "Konaklamalı";
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-900 mx-auto mb-4" />
          <p className="text-slate-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-slate-900 text-white py-4 px-6 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ship className="w-8 h-8" />
            <h1 className="text-xl font-bold">Yat Kiralama Admin</h1>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="text-slate-900">
            <RefreshCw className="w-4 h-4 mr-2" /> Yenile
          </Button>
        </div>
      </header>

      <div className="container mx-auto py-6 px-4">
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-white shadow">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="listings" className="gap-2">
              <Ship className="w-4 h-4" /> İlanlar ({listings.length})
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-2">
              <Users className="w-4 h-4" /> Talepler ({leads.length})
              {stats.newLeads > 0 && (
                <Badge className="ml-1 bg-red-500">{stats.newLeads}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ========== DASHBOARD TAB ========== */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* KPI Cards */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
                    <Ship className="w-4 h-4" /> Toplam İlan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.totalListings}</p>
                  <p className="text-sm text-green-600">{stats.activeListings} aktif</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Toplam Talep
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.totalLeads}</p>
                  <p className="text-sm text-blue-600">{stats.newLeads} yeni bekliyor</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Onaylanan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.confirmedLeads}</p>
                  <p className="text-sm text-slate-500">rezervasyon</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Potansiyel Gelir
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{formatCurrency(stats.potentialRevenue)}</p>
                  <p className="text-sm text-slate-500">onaylı rezervasyonlardan</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Leads */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" /> Son Talepler
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leads.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">Henüz talep yok.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Müşteri</TableHead>
                        <TableHead>Tekne</TableHead>
                        <TableHead>Tür</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Durum</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.slice(0, 5).map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{lead.customer_name}</p>
                              <p className="text-sm text-slate-500">{lead.customer_phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>{lead.listings?.title || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getCharterTypeLabel(lead.requested_charter_type)}</Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(lead.start_timestamp), "dd MMM yyyy", { locale: tr })}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={lead.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== LISTINGS TAB ========== */}
          <TabsContent value="listings">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">İlan Yönetimi</h2>
              <Dialog open={listingDialogOpen} onOpenChange={setListingDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleNewListing} className="bg-blue-900 hover:bg-blue-800">
                    <Plus className="w-4 h-4 mr-2" /> Yeni İlan Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{isEditing ? "İlanı Düzenle" : "Yeni İlan Ekle"}</DialogTitle>
                  </DialogHeader>
                  
                  <div className="grid gap-6 py-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label>İlan Başlığı *</Label>
                        <Input 
                          value={editingListing.title || ""} 
                          onChange={(e) => setEditingListing({...editingListing, title: e.target.value})}
                          placeholder="Örn: Lüks Motor Yat - 15 Metre"
                        />
                      </div>
                      <div>
                        <Label>Lokasyon</Label>
                        <Select 
                          value={editingListing.location || "İstanbul"} 
                          onValueChange={(v) => setEditingListing({...editingListing, location: v})}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="İstanbul">İstanbul</SelectItem>
                            <SelectItem value="Bodrum">Bodrum</SelectItem>
                            <SelectItem value="Fethiye">Fethiye</SelectItem>
                            <SelectItem value="Marmaris">Marmaris</SelectItem>
                            <SelectItem value="Göcek">Göcek</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Kapasite (Kişi)</Label>
                        <Input 
                          type="number"
                          value={editingListing.capacity || 10} 
                          onChange={(e) => setEditingListing({...editingListing, capacity: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Açıklama</Label>
                        <Textarea 
                          value={editingListing.description || ""} 
                          onChange={(e) => setEditingListing({...editingListing, description: e.target.value})}
                          placeholder="Tekne hakkında detaylı bilgi..."
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Images */}
                    <div>
                      <Label>Görseller (URL)</Label>
                      <div className="flex gap-2 mt-1">
                        <Input 
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                        />
                        <Button type="button" onClick={addImageUrl} variant="outline">Ekle</Button>
                      </div>
                      {(editingListing.image_urls?.length || 0) > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {editingListing.image_urls?.map((url, idx) => (
                            <div key={idx} className="relative group">
                              <img src={url} alt="" className="w-20 h-20 object-cover rounded border" />
                              <button 
                                onClick={() => removeImageUrl(idx)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pricing Section */}
                    <div className="border rounded-lg p-4 bg-slate-50">
                      <h3 className="font-semibold mb-4">Fiyatlandırma</h3>
                      
                      <div className="space-y-4">
                        {/* Hourly */}
                        <div className="flex items-center justify-between p-3 bg-white rounded border">
                          <div className="flex items-center gap-3">
                            <Switch 
                              checked={editingListing.is_hourly_active || false}
                              onCheckedChange={(v) => setEditingListing({...editingListing, is_hourly_active: v})}
                            />
                            <span>Saatlik Kiralama</span>
                          </div>
                          {editingListing.is_hourly_active && (
                            <div className="flex items-center gap-2">
                              <Input 
                                type="number" 
                                className="w-28"
                                value={editingListing.price_hourly || 0}
                                onChange={(e) => setEditingListing({...editingListing, price_hourly: parseInt(e.target.value)})}
                              />
                              <span className="text-sm text-slate-500">₺/saat</span>
                              <Input 
                                type="number" 
                                className="w-16"
                                value={editingListing.min_hours || 2}
                                onChange={(e) => setEditingListing({...editingListing, min_hours: parseInt(e.target.value)})}
                              />
                              <span className="text-sm text-slate-500">min saat</span>
                            </div>
                          )}
                        </div>

                        {/* Daily */}
                        <div className="flex items-center justify-between p-3 bg-white rounded border">
                          <div className="flex items-center gap-3">
                            <Switch 
                              checked={editingListing.is_daily_active || false}
                              onCheckedChange={(v) => setEditingListing({...editingListing, is_daily_active: v})}
                            />
                            <span>Günlük Kiralama</span>
                          </div>
                          {editingListing.is_daily_active && (
                            <div className="flex items-center gap-2">
                              <Input 
                                type="number" 
                                className="w-28"
                                value={editingListing.price_daily || 0}
                                onChange={(e) => setEditingListing({...editingListing, price_daily: parseInt(e.target.value)})}
                              />
                              <span className="text-sm text-slate-500">₺/gün</span>
                            </div>
                          )}
                        </div>

                        {/* Stay */}
                        <div className="flex items-center justify-between p-3 bg-white rounded border">
                          <div className="flex items-center gap-3">
                            <Switch 
                              checked={editingListing.is_stay_active || false}
                              onCheckedChange={(v) => setEditingListing({...editingListing, is_stay_active: v})}
                            />
                            <span>Konaklamalı</span>
                          </div>
                          {editingListing.is_stay_active && (
                            <div className="flex items-center gap-2">
                              <Input 
                                type="number" 
                                className="w-28"
                                value={editingListing.price_stay_per_night || 0}
                                onChange={(e) => setEditingListing({...editingListing, price_stay_per_night: parseInt(e.target.value)})}
                              />
                              <span className="text-sm text-slate-500">₺/gece</span>
                              <Input 
                                type="number" 
                                className="w-16"
                                value={editingListing.min_stay_days || 3}
                                onChange={(e) => setEditingListing({...editingListing, min_stay_days: parseInt(e.target.value)})}
                              />
                              <span className="text-sm text-slate-500">min gece</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Captain Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Kaptan Adı</Label>
                        <Input 
                          value={editingListing.captain_name || ""} 
                          onChange={(e) => setEditingListing({...editingListing, captain_name: e.target.value})}
                          placeholder="Kaptan Ali"
                        />
                      </div>
                      <div>
                        <Label>Kaptan Telefon</Label>
                        <Input 
                          value={editingListing.captain_phone || ""} 
                          onChange={(e) => setEditingListing({...editingListing, captain_phone: e.target.value})}
                          placeholder="05XX XXX XX XX"
                        />
                      </div>
                      <div>
                        <Label>Komisyon Oranı (%)</Label>
                        <Input 
                          type="number"
                          value={editingListing.commission_rate || 15} 
                          onChange={(e) => setEditingListing({...editingListing, commission_rate: parseInt(e.target.value)})}
                        />
                      </div>
                      <div>
                        <Label>Para Birimi</Label>
                        <Select 
                          value={editingListing.currency || "TRY"} 
                          onValueChange={(v) => setEditingListing({...editingListing, currency: v})}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TRY">TRY (₺)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Switches */}
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={editingListing.is_active || false}
                          onCheckedChange={(v) => setEditingListing({...editingListing, is_active: v})}
                        />
                        <Label>İlan Aktif</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={editingListing.has_captain || false}
                          onCheckedChange={(v) => setEditingListing({...editingListing, has_captain: v})}
                        />
                        <Label>Kaptanlı</Label>
                      </div>
                    </div>

                    <Button onClick={handleSaveListing} disabled={saving} className="w-full bg-blue-900 hover:bg-blue-800">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {isEditing ? "Güncelle" : "Kaydet"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Listings Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Görsel</TableHead>
                      <TableHead>Başlık</TableHead>
                      <TableHead>Lokasyon</TableHead>
                      <TableHead>Kapasite</TableHead>
                      <TableHead>Fiyatlar</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                          Henüz ilan eklenmemiş.
                        </TableCell>
                      </TableRow>
                    ) : (
                      listings.map((listing) => (
                        <TableRow key={listing.id}>
                          <TableCell>
                            {listing.image_urls?.[0] ? (
                              <img src={listing.image_urls[0]} alt="" className="w-12 h-12 object-cover rounded" />
                            ) : (
                              <div className="w-12 h-12 bg-slate-200 rounded flex items-center justify-center">
                                <Ship className="w-6 h-6 text-slate-400" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{listing.title}</TableCell>
                          <TableCell>{listing.location}</TableCell>
                          <TableCell>{listing.capacity} kişi</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {listing.is_hourly_active && (
                                <Badge variant="outline" className="text-xs">
                                  {formatCurrency(listing.price_hourly, listing.currency)}/saat
                                </Badge>
                              )}
                              {listing.is_daily_active && (
                                <Badge variant="outline" className="text-xs">
                                  {formatCurrency(listing.price_daily, listing.currency)}/gün
                                </Badge>
                              )}
                              {listing.is_stay_active && (
                                <Badge variant="outline" className="text-xs">
                                  {formatCurrency(listing.price_stay_per_night, listing.currency)}/gece
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {listing.is_active ? (
                              <Badge className="bg-green-500">Aktif</Badge>
                            ) : (
                              <Badge variant="secondary">Pasif</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => window.open(`/listings/${listing.id}`, "_blank")}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleEditListing(listing)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteListing(listing.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== LEADS TAB ========== */}
          <TabsContent value="leads">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Talep Yönetimi</h2>
              <div className="flex gap-2">
                <Badge className="bg-blue-500">{stats.newLeads} Yeni</Badge>
                <Badge className="bg-yellow-500">{leads.filter(l => l.status === "contacted").length} İletişimde</Badge>
                <Badge className="bg-green-500">{stats.confirmedLeads} Onaylı</Badge>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Tekne</TableHead>
                      <TableHead>Kiralama Türü</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Kişi</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Talep Tarihi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                          Henüz talep yok.
                        </TableCell>
                      </TableRow>
                    ) : (
                      leads.map((lead) => (
                        <TableRow key={lead.id} className={lead.status === "new" ? "bg-blue-50" : ""}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{lead.customer_name}</p>
                              <a href={`tel:${lead.customer_phone}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {lead.customer_phone}
                              </a>
                            </div>
                          </TableCell>
                          <TableCell>{lead.listings?.title || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getCharterTypeLabel(lead.requested_charter_type)}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{format(new Date(lead.start_timestamp), "dd MMM yyyy", { locale: tr })}</p>
                              {lead.end_timestamp && (
                                <p className="text-slate-500">
                                  → {format(new Date(lead.end_timestamp), "dd MMM yyyy", { locale: tr })}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{lead.guest_count} kişi</TableCell>
                          <TableCell>
                            <Select 
                              value={lead.status} 
                              onValueChange={(v) => handleLeadStatusChange(lead.id, v)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">🔵 Yeni</SelectItem>
                                <SelectItem value="contacted">🟡 İletişime Geçildi</SelectItem>
                                <SelectItem value="confirmed">🟢 Onaylandı</SelectItem>
                                <SelectItem value="cancelled">🔴 İptal</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {format(new Date(lead.created_at), "dd MMM yyyy HH:mm", { locale: tr })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

