"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, X, ArrowLeft } from "lucide-react";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Get authenticated Supabase client
async function getAuthenticatedClient() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Get tokens from localStorage (set during login)
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

interface ListingFormProps {
  listing?: any;
}

export default function ListingForm({ listing }: ListingFormProps) {
  const router = useRouter();
  const isEdit = !!listing;
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: listing?.title || "",
    location: listing?.location || "",
    description: listing?.description || "",
    capacity: listing?.capacity || "",
    currency: listing?.currency || "TRY",
    price_hourly: listing?.price_hourly || "",
    price_daily: listing?.price_daily || "",
    price_stay_per_night: listing?.price_stay_per_night || "",
    min_hours: listing?.min_hours || 2,
    min_stay_days: listing?.min_stay_days || 3,
    is_active: listing?.is_active ?? true,
    is_hourly_active: listing?.is_hourly_active ?? false,
    is_daily_active: listing?.is_daily_active ?? false,
    is_stay_active: listing?.is_stay_active ?? false,
    captain_name: listing?.captain_name || "",
    captain_phone: listing?.captain_phone || "",
    captain_email: listing?.captain_email || "",
    commission_rate: listing?.commission_rate || "",
  });

  const [images, setImages] = useState<string[]>(listing?.image_urls || []);
  const [uploadingImages, setUploadingImages] = useState<string[]>([]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const supabase = await getAuthenticatedClient();

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `listings/${fileName}`;

        setUploadingImages((prev) => [...prev, filePath]);

        const { data, error } = await supabase.storage
          .from("images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from("images").getPublicUrl(filePath);

        setUploadingImages((prev) => prev.filter((p) => p !== filePath));
        return publicUrl;
      });

      const newImages = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...newImages]);
    } catch (error: any) {
      alert("Resim yükleme hatası: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = await getAuthenticatedClient();
      
      // Remove undefined/null values and empty strings for optional fields
      const dataToSubmit: any = {
        title: formData.title,
        location: formData.location,
        description: formData.description || null,
        capacity: parseInt(formData.capacity.toString()) || 0,
        currency: formData.currency || "TRY",
        price_hourly: formData.price_hourly ? parseInt(formData.price_hourly.toString()) : null,
        price_daily: formData.price_daily ? parseInt(formData.price_daily.toString()) : null,
        price_stay_per_night: formData.price_stay_per_night ? parseInt(formData.price_stay_per_night.toString()) : null,
        min_hours: parseInt(formData.min_hours.toString()) || 2,
        min_stay_days: parseInt(formData.min_stay_days.toString()) || null,
        is_active: formData.is_active ?? true,
        is_hourly_active: formData.is_hourly_active ?? false,
        is_daily_active: formData.is_daily_active ?? false,
        is_stay_active: formData.is_stay_active ?? false,
        captain_name: formData.captain_name || null,
        captain_phone: formData.captain_phone || null,
        captain_email: formData.captain_email || null,
        commission_rate: formData.commission_rate ? parseInt(formData.commission_rate.toString()) : null,
        image_urls: images.length > 0 ? images : null,
      };

      if (isEdit) {
        const { error } = await supabase
          .from("listings")
          .update(dataToSubmit)
          .eq("id", listing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("listings").insert([dataToSubmit]);
        if (error) throw error;
      }

      router.push("/admin");
      router.refresh();
    } catch (error: any) {
      alert("Hata: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {isEdit ? "İlan Düzenle" : "Yeni İlan Ekle"}
              </h1>
              <p className="text-sm text-slate-500">
                {isEdit ? "İlan bilgilerini güncelleyin" : "Yeni bir ilan oluşturun"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Temel Bilgiler */}
          <Card>
            <CardHeader>
              <CardTitle>Temel Bilgiler</CardTitle>
              <CardDescription>İlanın temel bilgilerini girin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Başlık *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Lokasyon *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>

          {/* Özellikler */}
          <Card>
            <CardHeader>
              <CardTitle>Özellikler</CardTitle>
              <CardDescription>Tekne özelliklerini belirleyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Kapasite (Kişi) *</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange("capacity", e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Fiyatlandırma */}
          <Card>
            <CardHeader>
              <CardTitle>Fiyatlandırma</CardTitle>
              <CardDescription>Kiralama türlerine göre fiyatları belirleyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Para Birimi</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => handleInputChange("currency", e.target.value)}
                  placeholder="TRY, USD, EUR"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_hourly">Saatlik Fiyat</Label>
                  <Input
                    id="price_hourly"
                    type="number"
                    value={formData.price_hourly}
                    onChange={(e) => handleInputChange("price_hourly", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_daily">Günlük Fiyat</Label>
                  <Input
                    id="price_daily"
                    type="number"
                    value={formData.price_daily}
                    onChange={(e) => handleInputChange("price_daily", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_stay_per_night">Konaklamalı (Gece)</Label>
                  <Input
                    id="price_stay_per_night"
                    type="number"
                    value={formData.price_stay_per_night}
                    onChange={(e) => handleInputChange("price_stay_per_night", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_hours">Minimum Saat (Saatlik)</Label>
                  <Input
                    id="min_hours"
                    type="number"
                    value={formData.min_hours}
                    onChange={(e) => handleInputChange("min_hours", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_stay_days">Minimum Gün (Konaklamalı)</Label>
                  <Input
                    id="min_stay_days"
                    type="number"
                    value={formData.min_stay_days}
                    onChange={(e) => handleInputChange("min_stay_days", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Durumlar */}
          <Card>
            <CardHeader>
              <CardTitle>Durumlar</CardTitle>
              <CardDescription>İlan ve kiralama türlerinin durumunu belirleyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>İlan Aktif</Label>
                  <p className="text-sm text-slate-500">İlan görünür mü?</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Saatlik Kiralama Aktif</Label>
                </div>
                <Switch
                  checked={formData.is_hourly_active}
                  onCheckedChange={(checked) => handleInputChange("is_hourly_active", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Günlük Kiralama Aktif</Label>
                </div>
                <Switch
                  checked={formData.is_daily_active}
                  onCheckedChange={(checked) => handleInputChange("is_daily_active", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Konaklamalı Kiralama Aktif</Label>
                </div>
                <Switch
                  checked={formData.is_stay_active}
                  onCheckedChange={(checked) => handleInputChange("is_stay_active", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* İletişim Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle>Kaptan Bilgileri</CardTitle>
              <CardDescription>Kaptan iletişim bilgilerini girin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="captain_name">Kaptan Adı</Label>
                <Input
                  id="captain_name"
                  value={formData.captain_name}
                  onChange={(e) => handleInputChange("captain_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="captain_phone">Kaptan Telefon</Label>
                <Input
                  id="captain_phone"
                  value={formData.captain_phone}
                  onChange={(e) => handleInputChange("captain_phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="captain_email">Kaptan E-posta</Label>
                <Input
                  id="captain_email"
                  type="email"
                  value={formData.captain_email}
                  onChange={(e) => handleInputChange("captain_email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commission_rate">Komisyon Oranı (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  value={formData.commission_rate}
                  onChange={(e) => handleInputChange("commission_rate", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Resimler */}
          <Card>
            <CardHeader>
              <CardTitle>Resimler</CardTitle>
              <CardDescription>İlan için resim yükleyin (birden fazla seçebilirsiniz)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label
                  htmlFor="image-upload"
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Yükleniyor..." : "Resim Yükle"}
                </Label>
                <input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Resim ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link href="/admin">
              <Button type="button" variant="outline">
                İptal
              </Button>
            </Link>
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : isEdit ? (
                "Güncelle"
              ) : (
                "Oluştur"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

