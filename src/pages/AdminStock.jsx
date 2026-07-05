import { useCallback, useEffect, useState } from 'react'
import { getProducts } from '../services/productService.js'
import { adjustStock, getStockMovements } from '../services/stockService.js'
import { supabase } from '../services/supabaseClient.js'

export default function AdminStock() {
  const [products, setProducts] = useState([])
  const [movements, setMovements] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')

  const loadData = useCallback(async () => {
    const [productData, movementData] = await Promise.all([getProducts(), getStockMovements()])
    setProducts(productData)
    setMovements(movementData)
    if (!selectedId && productData[0]) setSelectedId(productData[0].id)
  }, [selectedId])

  useEffect(() => {
    loadData()
    const channel = supabase.channel('stock-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_movements' }, loadData)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [loadData])

  async function submit(event) {
    event.preventDefault()
    const product = products.find((item) => item.id === selectedId)
    try {
      await adjustStock(product, quantity, note)
      setQuantity('')
      setNote('')
      setMessage('Stok diperbarui.')
      await loadData()
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <div>
      <div className="section-heading"><span className="eyebrow">Manajemen Stok</span><h1>Tambah, kurangi, dan audit stok</h1></div>
      {message && <p className="alert">{message}</p>}
      <div className="admin-grid">
        <form className="panel form" onSubmit={submit}>
          <h2>Penyesuaian stok</h2>
          <label>Produk<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{products.map((product) => <option key={product.id} value={product.id}>{product.name} - stok {product.stock}</option>)}</select></label>
          <label>Jumlah<input type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Contoh: 10 atau -3" required /></label>
          <label>Catatan<textarea rows="3" value={note} onChange={(event) => setNote(event.target.value)} /></label>
          <button>Simpan perubahan stok</button>
        </form>
        <section className="panel table-wrap">
          <h2>Riwayat stok</h2>
          <table><thead><tr><th>Produk</th><th>Tipe</th><th>Qty</th><th>Sebelum</th><th>Sesudah</th><th>Catatan</th></tr></thead><tbody>{movements.map((movement) => <tr key={movement.id}><td>{movement.products?.name}</td><td>{movement.movement_type}</td><td>{movement.quantity}</td><td>{movement.stock_before}</td><td>{movement.stock_after}</td><td>{movement.note}</td></tr>)}</tbody></table>
        </section>
      </div>
    </div>
  )
}
