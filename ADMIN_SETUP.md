# Admin Dashboard Kurulum ve Kullanım

## Özellikler

✅ **Güvenli Giriş Sistemi**: Supabase Auth ile email/password girişi
✅ **Dashboard**: İstatistikler ve ilan listesi
✅ **İlan Yönetimi**: Ekleme, düzenleme, silme, aktif/pasif yapma
✅ **Resim Yükleme**: Çoklu resim yükleme desteği
✅ **Kapsamlı Form**: Tüm ilan bilgilerini kolayca yönetme

## Hızlı Kurulum

### 1. Supabase Storage Bucket

1. Supabase Dashboard > Storage
2. "New bucket" > Bucket adı: `images`
3. **Public bucket olarak işaretleyin**
4. Oluşturun

### 2. RLS Politikaları (En Kolay Yöntem)

**Supabase SQL Editor'da şu dosyayı çalıştırın:**
- `SUPABASE_RLS_POLICIES.sql` dosyasındaki tüm SQL komutlarını kopyalayın
- Supabase Dashboard > SQL Editor'a gidin
- Yeni bir query oluşturun
- SQL komutlarını yapıştırın ve çalıştırın

Bu, tüm gerekli RLS politikalarını otomatik olarak oluşturacaktır.

### 3. İlk Admin Kullanıcı

1. Supabase Dashboard > Authentication > Users
2. "Add user" > Email ve password girin
3. Kullanıcıyı oluşturun

**Not**: Email confirmation için Settings > Auth > Email Auth > Confirm email'ı kapatabilirsiniz (test için).

### 4. Erişim

- Admin Panel: `https://yourdomain.com/admin`
- Login: `https://yourdomain.com/admin/login`

## Manuel RLS Kurulumu (Alternatif)

Eğer SQL Editor kullanmak istemiyorsanız:

### Listings Tablosu Politikaları

Supabase Dashboard > Database > Tables > `listings` > Policies:

1. **INSERT Policy**:
   - Name: `Allow authenticated users to insert listings`
   - Operation: `INSERT`
   - Roles: `authenticated`
   - WITH CHECK: `auth.role() = 'authenticated'`

2. **UPDATE Policy**:
   - Name: `Allow authenticated users to update listings`
   - Operation: `UPDATE`
   - Roles: `authenticated`
   - USING: `auth.role() = 'authenticated'`
   - WITH CHECK: `auth.role() = 'authenticated'`

3. **DELETE Policy**:
   - Name: `Allow authenticated users to delete listings`
   - Operation: `DELETE`
   - Roles: `authenticated`
   - USING: `auth.role() = 'authenticated'`

4. **SELECT Policy**:
   - Name: `Allow public to view listings`
   - Operation: `SELECT`
   - Roles: `public`
   - USING: `true`

### Storage Politikaları

Supabase Dashboard > Storage > `images` bucket > Policies:

1. **INSERT Policy**:
   - Name: `Allow authenticated users to upload images`
   - Operation: `INSERT`
   - Roles: `authenticated`
   - WITH CHECK: `bucket_id = 'images' AND auth.role() = 'authenticated'`

2. **SELECT Policy**:
   - Name: `Allow public to view images`
   - Operation: `SELECT`
   - Roles: `public`
   - USING: `bucket_id = 'images'`

## Database Şeması

Listings tablosunda şu kolonlar bulunmalıdır:

- `id` (uuid, primary key)
- `title` (text)
- `location` (text)
- `description` (text, nullable)
- `capacity` (integer)
- `currency` (text, default: 'TRY')
- `price` (numeric)
- `price_hourly` (numeric, nullable)
- `price_daily` (numeric, nullable)
- `price_stay_per_night` (numeric, nullable)
- `min_hours` (integer, default: 2)
- `min_stay_days` (integer, default: 3)
- `is_active` (boolean, default: true)
- `is_hourly_active` (boolean, default: false)
- `is_daily_active` (boolean, default: false)
- `is_stay_active` (boolean, default: false)
- `owner_name` (text, nullable)
- `owner_phone` (text, nullable)
- `commission_rate` (numeric, nullable)
- `image_urls` (text[], nullable) - JSON array of image URLs
- `created_at` (timestamp, default: now())
- `updated_at` (timestamp, default: now())

## Kullanım

### Dashboard (`/admin`)
- İstatistikler: Toplam ilan, aktif ilan, toplam lead
- İlan listesi: Tüm ilanları görüntüleme ve yönetme
- Hızlı işlemler: Aktif/Pasif toggle, Düzenle, Sil

### Yeni İlan (`/admin/listings/new`)
- Temel bilgiler, özellikler, fiyatlandırma
- Durumlar, iletişim bilgileri
- Çoklu resim yükleme

### İlan Düzenleme (`/admin/listings/[id]/edit`)
- Mevcut ilan bilgilerini güncelleme
- Resim ekleme/çıkarma

## Sorun Giderme

### "policy already exists" Hatası

Eğer aynı isimde policy varsa:
1. SQL Editor'da `DROP POLICY IF EXISTS "policy_name" ON public.listings;` çalıştırın
2. Veya Supabase Dashboard'dan mevcut policy'yi silin
3. Yeni policy'yi oluşturun

### "new row violates row-level security policy" Hatası

RLS politikalarının düzgün yapılandırıldığından emin olun:
1. `SUPABASE_RLS_POLICIES.sql` dosyasını SQL Editor'da çalıştırın
2. Authentication > Users'da giriş yaptığınız kullanıcının olduğunu kontrol edin
3. Storage bucket'ının public olduğunu kontrol edin

### Resim Yükleme Hatası

1. Storage bucket'ının oluşturulduğundan ve public olduğundan emin olun
2. Storage INSERT policy'sinin authenticated kullanıcılar için olduğunu kontrol edin
3. Giriş yapmış olduğunuzdan emin olun
