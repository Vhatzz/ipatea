import { useEffect, useState } from 'react'
import Cart from '../components/Cart.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { getActiveProducts } from '../services/productService.js'
import { supabase } from '../services/supabaseClient.js'
import { removeItem, updateQty, useCart } from '../utils/cartState.js'

export default function Menu() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useCart()
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProducts() {
      try {
        setProducts(await getActiveProducts())
      } catch (err) {
        setError(err.message)
      }
    }

    loadProducts()
    const channel = supabase.channel('buyer-products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, loadProducts).subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  function addProduct(product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return current
        return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1, stock: product.stock } : item)
      }
      return [...current, { ...product, quantity: 1 }]
    })
  }

  return (
    <main className="page">
      <div className="section-heading">
        <span className="eyebrow">Menu Buyer</span>
        <h1>Pilih minuman teh favoritmu</h1>
      </div>
      {error && <p className="alert error">{error}</p>}
      <div className="shop-grid">
        <div className="product-grid">
          {products.map((product) => <ProductCard key={product.id} product={product} onAdd={addProduct} />)}
          {!products.length && <p className="muted">Belum ada produk aktif.</p>}
        </div>
        <Cart items={cart} onIncrement={(id) => updateQty(setCart, id, 1)} onDecrement={(id) => updateQty(setCart, id, -1)} onRemove={(id) => removeItem(setCart, id)} />
      </div>
    </main>
  )
}
