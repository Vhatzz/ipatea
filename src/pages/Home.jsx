import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'
import { getActiveProducts } from '../services/productService.js'
import { useCart } from '../utils/cartState.js'

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [, setCart] = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    getActiveProducts().then((data) => setFeatured(data.slice(0, 3))).catch(console.error)
  }, [])

  function addFeaturedProduct(product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return current
        return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1, stock: product.stock } : item)
      }
      return [...current, { ...product, quantity: 1 }]
    })
    navigate('/checkout')
  }

  return (
    <main>
      <section className="hero">
        <div>
          <span className="eyebrow">Fresh Tea, Fresh Mood.</span>
          <h1>Teh segar IPATEA untuk mood yang lebih ringan.</h1>
          <p>Pesan minuman teh favorit langsung dari website, bayar cash saat ambil, dan pantau pesanan dengan kode unik.</p>
          <div className="actions">
            <Link className="button" to="/menu">Lihat Menu</Link>
            <Link className="button secondary" to="/menu">Pesan Sekarang</Link>
          </div>
        </div>
        <div className="hero-card">
          <strong>IPATEA</strong>
          <span>Cloud mini POS untuk UMKM minuman teh</span>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <span className="eyebrow">Produk unggulan</span>
          <h2>Menu segar hari ini</h2>
        </div>
        <div className="product-grid">
          {featured.map((product) => <ProductCard key={product.id} product={product} onAdd={addFeaturedProduct} />)}
          {!featured.length && <p className="muted">Produk akan tampil setelah admin menambahkan menu di Supabase.</p>}
        </div>
      </section>

      <section className="section about">
        <h2>Tentang IPATEA</h2>
        <p>IPATEA membantu UMKM teh menerima pesanan online, mengelola stok, mencatat pembayaran cash, dan mencetak struk dari browser.</p>
      </section>
    </main>
  )
}
