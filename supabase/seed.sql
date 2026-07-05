insert into public.admin_profiles (id, full_name, role)
values ('3161223b-6884-4a18-a5f4-88e71db5793c', 'Admin IPATEA', 'admin')
on conflict (id) do update set full_name = excluded.full_name, role = excluded.role;

insert into products (id, name, price, category, description, image_url, image_path, stock, is_available, is_active)
values
  ('11111111-1111-4111-8111-111111111111', 'Original Tea', 8000, 'Classic Tea', 'Teh hitam segar dengan rasa original yang ringan.', '/placeholder-product.svg', null, 35, true, true),
  ('22222222-2222-4222-8222-222222222222', 'Milk Tea', 12000, 'Milk Tea', 'Teh susu creamy dengan manis seimbang.', '/placeholder-product.svg', null, 28, true, true),
  ('33333333-3333-4333-8333-333333333333', 'Lemon Tea', 10000, 'Fruit Tea', 'Teh lemon segar dengan aroma citrus.', '/placeholder-product.svg', null, 24, true, true),
  ('44444444-4444-4444-8444-444444444444', 'Matcha Tea', 15000, 'Premium Tea', 'Matcha lembut dengan karakter earthy khas Jepang.', '/placeholder-product.svg', null, 18, true, true),
  ('55555555-5555-4555-8555-555555555555', 'Thai Tea', 14000, 'Milk Tea', 'Thai tea wangi dengan susu creamy.', '/placeholder-product.svg', null, 22, true, true),
  ('66666666-6666-4666-8666-666666666666', 'Brown Sugar Milk Tea', 16000, 'Signature', 'Milk tea dengan brown sugar dan rasa karamel.', '/placeholder-product.svg', null, 16, true, true)
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  category = excluded.category,
  description = excluded.description,
  image_url = excluded.image_url,
  stock = excluded.stock,
  is_available = excluded.is_available,
  is_active = excluded.is_active,
  updated_at = now();

insert into orders (id, order_code, buyer_name, buyer_phone, note, total_price, payment_method, payment_status, amount_paid, change_amount, status, lookup_token_hash)
values
  ('77777777-7777-4777-8777-777777777777', 'IPATEA-DEMO-0001', 'Rina Demo', '081234567890', 'Kurangi es untuk Milk Tea.', 32000, 'Cash', 'Sudah Dibayar', 35000, 3000, 'Selesai', hash_lookup_token('demo-token-0001')),
  ('88888888-8888-4888-8888-888888888888', 'IPATEA-DEMO-0002', 'Budi Demo', '089876543210', 'Ambil jam 4 sore.', 25000, 'Cash', 'Belum Dibayar', 0, 0, 'Pesanan Masuk', hash_lookup_token('demo-token-0002'))
on conflict (id) do update set
  buyer_name = excluded.buyer_name,
  buyer_phone = excluded.buyer_phone,
  note = excluded.note,
  total_price = excluded.total_price,
  payment_method = excluded.payment_method,
  payment_status = excluded.payment_status,
  amount_paid = excluded.amount_paid,
  change_amount = excluded.change_amount,
  status = excluded.status,
  lookup_token_hash = excluded.lookup_token_hash,
  updated_at = now();

delete from order_items where order_id in ('77777777-7777-4777-8777-777777777777', '88888888-8888-4888-8888-888888888888');

insert into order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
values
  ('77777777-7777-4777-8777-777777777777', '11111111-1111-4111-8111-111111111111', 'Original Tea', 8000, 1, 8000),
  ('77777777-7777-4777-8777-777777777777', '22222222-2222-4222-8222-222222222222', 'Milk Tea', 12000, 2, 24000),
  ('88888888-8888-4888-8888-888888888888', '33333333-3333-4333-8333-333333333333', 'Lemon Tea', 10000, 1, 10000),
  ('88888888-8888-4888-8888-888888888888', '44444444-4444-4444-8444-444444444444', 'Matcha Tea', 15000, 1, 15000);

delete from stock_movements where reference_order_id in ('77777777-7777-4777-8777-777777777777', '88888888-8888-4888-8888-888888888888') or note like 'Seed stok awal%';

insert into stock_movements (product_id, movement_type, quantity, stock_before, stock_after, reference_order_id, note)
values
  ('11111111-1111-4111-8111-111111111111', 'STOCK_IN', 35, 0, 35, null, 'Seed stok awal Original Tea'),
  ('22222222-2222-4222-8222-222222222222', 'STOCK_IN', 28, 0, 28, null, 'Seed stok awal Milk Tea'),
  ('33333333-3333-4333-8333-333333333333', 'STOCK_IN', 24, 0, 24, null, 'Seed stok awal Lemon Tea'),
  ('44444444-4444-4444-8444-444444444444', 'STOCK_IN', 18, 0, 18, null, 'Seed stok awal Matcha Tea'),
  ('55555555-5555-4555-8555-555555555555', 'STOCK_IN', 22, 0, 22, null, 'Seed stok awal Thai Tea'),
  ('66666666-6666-4666-8666-666666666666', 'STOCK_IN', 16, 0, 16, null, 'Seed stok awal Brown Sugar Milk Tea'),
  ('11111111-1111-4111-8111-111111111111', 'ORDER_CREATED', -1, 36, 35, '77777777-7777-4777-8777-777777777777', 'Pesanan IPATEA-DEMO-0001'),
  ('22222222-2222-4222-8222-222222222222', 'ORDER_CREATED', -2, 30, 28, '77777777-7777-4777-8777-777777777777', 'Pesanan IPATEA-DEMO-0001'),
  ('33333333-3333-4333-8333-333333333333', 'ORDER_CREATED', -1, 25, 24, '88888888-8888-4888-8888-888888888888', 'Pesanan IPATEA-DEMO-0002'),
  ('44444444-4444-4444-8444-444444444444', 'ORDER_CREATED', -1, 19, 18, '88888888-8888-4888-8888-888888888888', 'Pesanan IPATEA-DEMO-0002');
