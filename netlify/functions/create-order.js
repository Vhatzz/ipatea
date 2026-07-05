import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const headers = {
  'Content-Type': 'application/json',
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return response(405, { error: 'Method not allowed.' })
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return response(500, { error: 'Konfigurasi server checkout belum lengkap.' })
  }

  try {
    const payload = JSON.parse(event.body || '{}')
    const buyerName = sanitizeText(payload.buyerName, 80)
    const buyerPhone = sanitizeText(payload.buyerPhone, 30)
    const note = sanitizeText(payload.note || '', 240)
    const items = validateItems(payload.items)

    if (buyerName.length < 2) throw new Error('Nama buyer wajib diisi.')
    if (!/^[0-9+\-\s()]{8,30}$/.test(buyerPhone)) throw new Error('Nomor HP tidak valid.')

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data, error } = await supabase.rpc('create_order_atomic', {
      p_buyer_name: buyerName,
      p_buyer_phone: buyerPhone,
      p_note: note,
      p_items: items,
      p_client_key: getClientKey(event),
    })

    if (error) throw error
    const order = Array.isArray(data) ? data[0] : data
    return response(200, order)
  } catch (error) {
    console.error('create-order failed:', error)
    return response(400, { error: error.message || 'Pesanan gagal dibuat.' })
  }
}

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('Keranjang masih kosong.')
  if (items.length > 20) throw new Error('Jumlah jenis produk terlalu banyak.')

  return items.map((item) => {
    const productId = String(item.product_id || item.id || '').trim()
    const quantity = Number(item.quantity)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productId)) {
      throw new Error('Produk tidak valid.')
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error('Jumlah item tidak valid.')
    return { product_id: productId, quantity }
  })
}

function sanitizeText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength)
}

function getClientKey(event) {
  const forwardedFor = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown'
  const ip = forwardedFor.split(',')[0].trim()
  const userAgent = event.headers['user-agent'] || 'unknown'
  return `${ip}:${userAgent.slice(0, 120)}`
}

function response(statusCode, body) {
  return { statusCode, headers, body: JSON.stringify(body) }
}
