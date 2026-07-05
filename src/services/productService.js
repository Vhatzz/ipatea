import { supabase } from './supabaseClient.js'
import { uploadProductImage } from './storageService.js'

export async function getActiveProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getProducts() {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function saveProduct(product, imageFile) {
  const payload = {
    name: product.name,
    price: Number(product.price || 0),
    category: product.category,
    description: product.description || null,
    stock: Number(product.stock || 0),
    is_available: Boolean(product.is_available),
    is_active: Boolean(product.is_active),
    updated_at: new Date().toISOString(),
  }

  let saved
  if (product.id) {
    const { data, error } = await supabase.from('products').update(payload).eq('id', product.id).select().single()
    if (error) throw error
    saved = data
  } else {
    const { data, error } = await supabase.from('products').insert(payload).select().single()
    if (error) throw error
    saved = data
  }

  if (imageFile) {
    const image = await uploadProductImage(saved.id, imageFile)
    const { data, error } = await supabase
      .from('products')
      .update({ image_url: image.url, image_path: image.path, updated_at: new Date().toISOString() })
      .eq('id', saved.id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  return saved
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}
