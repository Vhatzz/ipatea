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
  lookup_token_hash text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table orders add column if not exists lookup_token_hash text;

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

create table if not exists rate_limits (
  key text not null,
  action text not null,
  window_start timestamp with time zone not null default now(),
  count integer not null default 0,
  primary key (key, action)
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

create or replace function public.hash_lookup_token(token text)
returns text
language sql
immutable
as $$
  select encode(extensions.digest(token, 'sha256'), 'hex');
$$;

create or replace function public.create_order_atomic(
  p_buyer_name text,
  p_buyer_phone text,
  p_note text,
  p_items jsonb,
  p_client_key text default 'unknown'
)
returns table(order_id uuid, order_code text, lookup_token text, total_price integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_order_code text := 'IPATEA-' || to_char(now(), 'YYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0');
  v_lookup_token text := encode(extensions.gen_random_bytes(24), 'hex');
  v_total integer := 0;
  v_item jsonb;
  v_product products%rowtype;
  v_quantity integer;
  v_stock_after integer;
  v_window timestamp with time zone;
  v_count integer;
begin
  if length(trim(coalesce(p_buyer_name, ''))) < 2 then
    raise exception 'Nama buyer wajib diisi.';
  end if;

  if length(trim(coalesce(p_buyer_phone, ''))) < 8 then
    raise exception 'Nomor HP tidak valid.';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang masih kosong.';
  end if;

  insert into rate_limits (key, action, window_start, count)
  values (left(coalesce(p_client_key, 'unknown'), 200), 'create_order', now(), 1)
  on conflict (key, action) do update set
    window_start = case when rate_limits.window_start < now() - interval '10 minutes' then now() else rate_limits.window_start end,
    count = case when rate_limits.window_start < now() - interval '10 minutes' then 1 else rate_limits.count + 1 end
  returning window_start, count into v_window, v_count;

  if v_window >= now() - interval '10 minutes' and v_count > 10 then
    raise exception 'Terlalu banyak pesanan. Coba lagi beberapa menit.';
  end if;

  insert into orders (id, order_code, buyer_name, buyer_phone, note, total_price, payment_method, payment_status, status, lookup_token_hash)
  values (v_order_id, v_order_code, trim(p_buyer_name), trim(p_buyer_phone), nullif(trim(coalesce(p_note, '')), ''), 0, 'Cash', 'Belum Dibayar', 'Pesanan Masuk', hash_lookup_token(v_lookup_token));

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := nullif((v_item ->> 'quantity')::integer, 0);
    if v_quantity is null or v_quantity < 1 or v_quantity > 99 then
      raise exception 'Jumlah item tidak valid.';
    end if;

    select * into v_product
    from products
    where id = (v_item ->> 'product_id')::uuid
    and is_active = true
    and is_available = true
    for update;

    if not found then
      raise exception 'Produk tidak tersedia.';
    end if;

    if v_product.stock < v_quantity then
      raise exception 'Stok % hanya %.', v_product.name, v_product.stock;
    end if;

    v_stock_after := v_product.stock - v_quantity;
    v_total := v_total + (v_product.price * v_quantity);

    insert into order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
    values (v_order_id, v_product.id, v_product.name, v_product.price, v_quantity, v_product.price * v_quantity);

    update products
    set stock = v_stock_after, updated_at = now()
    where id = v_product.id;

    insert into stock_movements (product_id, movement_type, quantity, stock_before, stock_after, reference_order_id, note)
    values (v_product.id, 'ORDER_CREATED', -v_quantity, v_product.stock, v_stock_after, v_order_id, 'Pesanan ' || v_order_code);
  end loop;

  update orders set total_price = v_total, updated_at = now() where id = v_order_id;

  return query select v_order_id, v_order_code, v_lookup_token, v_total;
end;
$$;

create or replace function public.get_order_by_lookup(p_order_code text, p_lookup_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select to_jsonb(o) || jsonb_build_object(
    'order_items', coalesce((
      select jsonb_agg(to_jsonb(oi) order by oi.created_at asc)
      from order_items oi
      where oi.order_id = o.id
    ), '[]'::jsonb)
  )
  from orders o
  where o.order_code = p_order_code
  and o.lookup_token_hash = hash_lookup_token(p_lookup_token)
  limit 1;
$$;

alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table stock_movements enable row level security;
alter table admin_profiles enable row level security;
alter table rate_limits enable row level security;

drop policy if exists "Public read active products" on products;
drop policy if exists "Public update product stock" on products;
drop policy if exists "Admin manage products" on products;
create policy "Public read active products" on products for select using (is_active = true or is_admin());
create policy "Admin manage products" on products for all using (is_admin()) with check (is_admin());

drop policy if exists "Public create orders" on orders;
drop policy if exists "Public read orders by code" on orders;
drop policy if exists "Admin read update orders" on orders;
create policy "Admin manage orders" on orders for all using (is_admin()) with check (is_admin());

drop policy if exists "Public create order items" on order_items;
drop policy if exists "Public read order items" on order_items;
drop policy if exists "Admin read order items" on order_items;
create policy "Admin manage order items" on order_items for all using (is_admin()) with check (is_admin());

drop policy if exists "Public create stock movements" on stock_movements;
drop policy if exists "Admin manage stock movements" on stock_movements;
create policy "Admin manage stock movements" on stock_movements for all using (is_admin()) with check (is_admin());

drop policy if exists "Admin manage profiles" on admin_profiles;
create policy "Admin manage profiles" on admin_profiles for all using (is_admin()) with check (is_admin());

drop policy if exists "Service role manage rate limits" on rate_limits;
create policy "Service role manage rate limits" on rate_limits for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "Admin upload product images" on storage.objects;
drop policy if exists "Public read product images" on storage.objects;
create policy "Admin upload product images" on storage.objects for insert with check (bucket_id = 'product-images' and is_admin());
create policy "Admin update product images" on storage.objects for update using (bucket_id = 'product-images' and is_admin()) with check (bucket_id = 'product-images' and is_admin());
create policy "Admin delete product images" on storage.objects for delete using (bucket_id = 'product-images' and is_admin());
create policy "Public read product images" on storage.objects for select using (bucket_id = 'product-images');

revoke all on function public.create_order_atomic(text, text, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.create_order_atomic(text, text, text, jsonb, text) to service_role;

revoke all on function public.get_order_by_lookup(text, text) from public;
grant execute on function public.get_order_by_lookup(text, text) to anon, authenticated;

do $$
begin
  alter publication supabase_realtime add table products;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table orders;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table stock_movements;
exception when duplicate_object then null;
end $$;
