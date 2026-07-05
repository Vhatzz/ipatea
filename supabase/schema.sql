create extension if not exists pgcrypto;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price integer not null check (price >= 0),
  category text not null,
  description text,
  image_url text,
  image_path text,
  stock integer not null default 0 check (stock >= 0),
  is_available boolean default true,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique not null,
  buyer_name text not null,
  buyer_phone text not null,
  note text,
  total_price integer not null check (total_price >= 0),
  payment_method text not null default 'Cash',
  payment_status text not null default 'Belum Dibayar',
  amount_paid integer default 0 check (amount_paid >= 0),
  change_amount integer default 0 check (change_amount >= 0),
  status text not null default 'Pesanan Masuk',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  product_name text not null,
  product_price integer not null,
  quantity integer not null check (quantity > 0),
  subtotal integer not null check (subtotal >= 0),
  created_at timestamp with time zone default now()
);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  movement_type text not null,
  quantity integer not null,
  stock_before integer not null,
  stock_after integer not null,
  reference_order_id uuid references orders(id),
  note text,
  created_at timestamp with time zone default now()
);

create table if not exists admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin',
  created_at timestamp with time zone default now()
);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table stock_movements enable row level security;
alter table admin_profiles enable row level security;

drop policy if exists "Public read active products" on products;
create policy "Public read active products" on products for select using (is_active = true or auth.role() = 'authenticated');

drop policy if exists "Public update product stock" on products;
create policy "Public update product stock" on products for update using (is_active = true) with check (stock >= 0);

drop policy if exists "Admin manage products" on products;
create policy "Admin manage products" on products for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Public create orders" on orders;
create policy "Public create orders" on orders for insert with check (payment_method = 'Cash');

drop policy if exists "Public read orders by code" on orders;
create policy "Public read orders by code" on orders for select using (true);

drop policy if exists "Admin read update orders" on orders;
create policy "Admin read update orders" on orders for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Public create order items" on order_items;
create policy "Public create order items" on order_items for insert with check (true);

drop policy if exists "Public read order items" on order_items;
create policy "Public read order items" on order_items for select using (true);

drop policy if exists "Admin read order items" on order_items;
create policy "Admin read order items" on order_items for select using (auth.role() = 'authenticated');

drop policy if exists "Public create stock movements" on stock_movements;
create policy "Public create stock movements" on stock_movements for insert with check (true);

drop policy if exists "Admin manage stock movements" on stock_movements;
create policy "Admin manage stock movements" on stock_movements for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Admin upload product images" on storage.objects;
create policy "Admin upload product images" on storage.objects for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images" on storage.objects for select using (bucket_id = 'product-images');

alter publication supabase_realtime add table products;
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table stock_movements;
