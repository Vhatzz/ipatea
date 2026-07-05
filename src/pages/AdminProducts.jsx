import { useEffect, useState } from 'react'
import ProductForm from '../components/ProductForm.jsx'
import { deleteProduct, getProducts, saveProduct } from '../services/productService.js'
import { supabase } from '../services/supabaseClient.js'
import { formatCurrency } from '../utils/formatCurrency.js'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadProducts()
    const channel = supabase.channel('admin-products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, loadProducts).subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function loadProducts() {
    setProducts(await getProducts())
  }

  async function submit(product, imageFile) {
    setLoading(true)
    setMessage('')
    try {
      await saveProduct(product, imageFile)
      setEditing(null)
      setMessage('Produk tersimpan.')
      await loadProducts()
    } catch (err) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function remove(id) {
    if (!confirm('Hapus produk ini?')) return
    await deleteProduct(id)
    await loadProducts()
  }

  return (
    <div>
      <div className="section-heading"><span className="eyebrow">CRUD Menu</span><h1>Kelola produk dan gambar</h1></div>
      {message && <p className="alert">{message}</p>}
      <div className="admin-grid">
        <ProductForm key={editing?.id || 'new-product'} product={editing} onSubmit={submit} onCancel={() => setEditing(null)} loading={loading} />
        <section className="panel">
          <h2>Daftar produk</h2>
          <div className="table-wrap"><table><thead><tr><th>Produk</th><th>Harga</th><th>Stok</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td>{product.name}</td><td>{formatCurrency(product.price)}</td><td>{product.stock}</td><td>{product.is_available ? 'Tersedia' : 'Tidak tersedia'}</td><td><button className="ghost" onClick={() => setEditing(product)}>Edit</button><button className="ghost danger" onClick={() => remove(product.id)}>Hapus</button></td></tr>)}</tbody></table></div>
        </section>
      </div>
    </div>
  )
}
