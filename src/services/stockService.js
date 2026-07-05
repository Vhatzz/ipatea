import { supabase } from './supabaseClient.js'

export async function getStockMovements(productId) {
  let query = supabase
    .from('stock_movements')
    .select('*, products(name)')
    .order('created_at', { ascending: false })
    .limit(100)
  if (productId) query = query.eq('product_id', productId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function adjustStock(product, quantity, note) {
  const amount = Number(quantity || 0)
  if (!amount) throw new Error('Jumlah stok harus diisi.')
  const stockBefore = Number(product.stock || 0)
  const stockAfter = stockBefore + amount
  if (stockAfter < 0) throw new Error('Stok tidak boleh kurang dari 0.')

  const { error: updateError } = await supabase
    .from('products')
    .update({ stock: stockAfter, updated_at: new Date().toISOString() })
    .eq('id', product.id)
  if (updateError) throw updateError

  const movementType = amount > 0 ? 'STOCK_IN' : 'STOCK_OUT'
  const { error } = await supabase.from('stock_movements').insert({
    product_id: product.id,
    movement_type: movementType,
    quantity: amount,
    stock_before: stockBefore,
    stock_after: stockAfter,
    note: note || 'Penyesuaian stok manual',
  })
  if (error) throw error
}
