import { supabase } from './supabaseClient.js'

const ORDER_SELECT = '*, order_items(*)'

export async function createOrder({ buyerName, buyerPhone, note, items }) {
  if (!items.length) throw new Error('Keranjang masih kosong.')
  const response = await fetch('/.netlify/functions/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerName,
      buyerPhone,
      note,
      items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || 'Pesanan gagal dibuat.')
  }

  return payload
}

export async function getOrders() {
  const { data, error } = await supabase.from('orders').select(ORDER_SELECT).order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getOrderById(id) {
  const { data, error } = await supabase.from('orders').select(ORDER_SELECT).eq('id', id).single()
  if (error) throw error
  return data
}

export async function getOrderByCode(orderCode) {
  const { data, error } = await supabase.from('orders').select(ORDER_SELECT).eq('order_code', orderCode).maybeSingle()
  if (error) throw error
  return data
}

export async function getOrderByLookup(orderCode, lookupToken) {
  if (!lookupToken) return null
  const { data, error } = await supabase.rpc('get_order_by_lookup', {
    p_order_code: orderCode,
    p_lookup_token: lookupToken,
  })
  if (error) throw error
  return data
}

export async function updateOrderStatus(order, status) {
  if (status === 'Dibatalkan' && order.status !== 'Dibatalkan') {
    await restoreOrderStock(order)
  }
  const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', order.id)
  if (error) throw error
}

export async function updatePayment(orderId, amountPaid, totalPrice) {
  const amount = Number(amountPaid || 0)
  if (amount < totalPrice) throw new Error('Uang diterima kurang dari total pembayaran.')
  const { error } = await supabase
    .from('orders')
    .update({
      amount_paid: amount,
      change_amount: amount - totalPrice,
      payment_status: 'Sudah Dibayar',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
  if (error) throw error
}

async function restoreOrderStock(order) {
  for (const item of order.order_items || []) {
    const { data: product, error: productError } = await supabase.from('products').select('*').eq('id', item.product_id).single()
    if (productError) throw productError
    const stockAfter = product.stock + item.quantity
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: stockAfter, updated_at: new Date().toISOString() })
      .eq('id', product.id)
    if (updateError) throw updateError

    const { error } = await supabase.from('stock_movements').insert({
      product_id: product.id,
      movement_type: 'ORDER_CANCELLED',
      quantity: item.quantity,
      stock_before: product.stock,
      stock_after: stockAfter,
      reference_order_id: order.id,
      note: `Pembatalan ${order.order_code}`,
    })
    if (error) throw error
  }
}
