# IPATEA

Website UMKM / mini POS minuman teh berbasis React + Vite dan Supabase sesuai `PRD.md`.

## Setup
- Jalankan `npm install`.
- Copy `.env.example` ke `.env`, lalu isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dari Supabase.
- Jalankan SQL di `supabase/schema.sql` pada Supabase SQL Editor.
- Buat admin melalui Supabase Auth, lalu login lewat `/admin/login`.

## Commands
- `npm run dev` untuk development.
- `npm run build` untuk build produksi.
- `npm run preview` untuk preview hasil build.
- `npm run lint` untuk lint.

## Netlify
- Build command: `npm run build`.
- Publish directory: `dist`.
- Simpan env vars di Netlify Environment Variables, jangan commit `.env`.

## Fitur Utama
- Buyer: landing page, menu produk, keranjang, checkout cash, kode pesanan.
- Admin: login Supabase Auth, dashboard realtime, CRUD produk, upload gambar, manajemen stok, order status, pembayaran cash, cetak struk, laporan, export CSV.
