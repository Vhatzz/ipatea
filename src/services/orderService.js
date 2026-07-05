import { supabase } from './supabaseClient.js'
import { generateOrderCode } from '../utils/generateOrderCode.js'

const ORDER_SELECT = '*, order_items(*)'

export async function createOrder({ buyerName, buyerPhone, note, items }) {
  if (!items.length) throw new Error('Keranjang masih kosong.')

  const productIds = items.map((item) => item.id)
  const { data: products, error: productError } = await supabase.from('products').select('*').in('id', productIds)
  if (productError) throw productError

  const productMap = new Map(products.map((product) => [product.id, product]))
  for (const item of items) {
    const product = productMap.get(item.id)
    if (!product || !product.is_available || !product.is_active) throw new Error(`${item.name} tidak tersedia.`)
    if (item.quantity > product.stock) throw new Error(`Stok ${product.name} hanya ${product.stock}.`)
  }

  const totalPrice = items.reduce((total, item) => total + item.price * item.quantity, 0)
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_code: generateOrderCode(),
      buyer_name: buyerName,
      buyer_phone: buyerPhone,
      note: note || null,
      total_price: totalPrice,
      payment_method: 'Cash',
      payment_status: 'Belum Dibayar',
      status: 'Pesanan Masuk',
    })
    .select()
    .single()
  if (orderError) throw orderError

  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.id,
    product_name: item.name,
    product_price: item.price,
    quantity: item.quantity,
    subtotal: item.price * item.quantity,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) throw itemsError

  for (const item of items) {
    const product = productMap.get(item.id)
    const stockAfter = product.stock - item.quantity
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: stockAfter, updated_at: new Date().toISOString() })
      .eq('id', item.id)
    if (updateError) throw updateError

    const { error: movementError } = await supabase.from('stock_movements').insert({
      product_id: item.id,
      movement_type: 'ORDER_CREATED',
      quantity: -item.quantity,
      stock_before: product.stock,
      stock_after: stockAfter,
      reference_order_id: order.id,
      note: `Pesanan ${order.order_code}`,
    })
    if (movementError) throw movementError
  }

  return order
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
