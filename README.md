# IPATEA

IPATEA adalah website UMKM / mini POS untuk bisnis minuman teh. Aplikasi ini menyediakan alur pemesanan buyer, dashboard admin, manajemen produk, stok realtime, laporan penjualan, pembayaran cash, dan cetak struk melalui browser.

## Live Deployment
- Frontend: Netlify
- Build command: `npm run build`
- Publish directory: `dist`

## Tech Stack
- React + Vite
- React Router
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime
- Netlify Functions
- Plain CSS responsive styling

## Fitur
- Landing page dan menu produk untuk buyer.
- Keranjang dan checkout cash.
- Checkout aman melalui Netlify Function.
- Validasi harga, stok, order item, dan stock movement di PostgreSQL function atomik.
- Token lookup untuk halaman sukses pesanan buyer.
- Login admin menggunakan Supabase Auth.
- Role admin tervalidasi melalui `admin_profiles`.
- CRUD produk dan upload gambar ke Supabase Storage.
- Validasi file gambar: JPG, PNG, WEBP, maksimal 2MB.
- Dashboard admin, pesanan realtime, detail pesanan, pembayaran cash, cetak struk.
- Manajemen stok dan riwayat `stock_movements`.
- Laporan penjualan, filter, print, dan export CSV.

## Struktur Penting
```text
src/                  React app
src/components/       Komponen UI reusable
src/pages/            Halaman buyer dan admin
src/services/         Integrasi Supabase dan API app
src/utils/            Utility format, CSV, print, error reporting
netlify/functions/    Server-side checkout function
supabase/schema.sql   Schema, RLS, RPC, policy, storage config
supabase/seed.sql     Data dummy dan admin profile demo
docs/operations.md    Catatan operasional production
```

## Environment Variables
Frontend Vite:
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_CONTEXT7_API_KEY=
```

Server-only Netlify Function:
```env
SUPABASE_SERVICE_ROLE_KEY=
```

Jangan gunakan prefix `VITE_` untuk `SUPABASE_SERVICE_ROLE_KEY`, karena key tersebut tidak boleh masuk ke browser bundle.

## Setup Lokal
1. Install dependency:
```bash
npm install
```

2. Copy `.env.example` ke `.env`, lalu isi env Supabase.

3. Jalankan schema di Supabase SQL Editor:
```sql
-- supabase/schema.sql
```

4. Buat user admin di Supabase Auth.

5. Sesuaikan UID admin di `supabase/seed.sql` jika diperlukan, lalu jalankan seed:
```sql
-- supabase/seed.sql
```

6. Jalankan dev server:
```bash
npm run dev
```

## Scripts
```bash
npm run dev      # Vite development server
npm run build    # Production build
npm run preview  # Preview hasil build
npm run lint     # ESLint
```

## Deploy Netlify
1. Import repository GitHub ke Netlify.
2. Set build command ke `npm run build`.
3. Set publish directory ke `dist`.
4. Tambahkan environment variables di Netlify dashboard.
5. Pastikan `SUPABASE_SERVICE_ROLE_KEY` hanya disimpan sebagai server-side env di Netlify.
6. Deploy site.

## Database dan Security
- Public hanya boleh membaca produk aktif.
- Buyer tidak menulis langsung ke tabel `orders`, `order_items`, `products`, atau `stock_movements`.
- Checkout buyer melewati `netlify/functions/create-order.js`.
- Netlify Function memanggil RPC `create_order_atomic` memakai service role key.
- RPC menghitung harga dari database, memvalidasi stok, mengurangi stok, dan mencatat stock movement dalam satu transaksi.
- Admin access memakai `admin_profiles.role = 'admin'`.
- Order success buyer memakai `order_code` plus `lookup_token`.

## Operational Notes
Lihat `docs/operations.md` untuk rate limiting, monitoring error, alert kuota, backup, uji restore, Core Web Vitals, dan pengukuran latency query.

## Catatan
- Pembayaran hanya cash.
- Tidak ada payment gateway.
- Tidak ada integrasi WhatsApp ordering.
- Cetak struk menggunakan `window.print()`.
