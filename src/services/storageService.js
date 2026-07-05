import { supabase } from './supabaseClient.js'

const BUCKET = 'product-images'
const MAX_FILE_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp'])

export async function uploadProductImage(productId, file) {
  validateProductImage(file)
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
  const path = `products/${productId}/${Date.now()}-${safeName}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { path, url: data.publicUrl }
}

function validateProductImage(file) {
  if (!file) throw new Error('File gambar wajib dipilih.')
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error('Format gambar harus JPG, PNG, atau WEBP.')
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Ukuran gambar maksimal 2MB.')
  }
}
