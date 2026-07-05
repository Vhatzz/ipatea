import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CheckoutForm from '../components/CheckoutForm.jsx'
import { createOrder } from '../services/orderService.js'
import { removeItem, updateQty, useCart } from '../utils/cartState.js'

export default function Checkout() {
  const [cart, setCart] = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function submit(form) {
    setLoading(true)
    setError('')
    try {
      const order = await createOrder({ ...form, items: cart })
      setCart([])
      navigate(`/order-success/${order.order_code}?token=${encodeURIComponent(order.lookup_token)}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <div className="section-heading"><span className="eyebrow">Checkout</span><h1>Selesaikan pesanan cash</h1></div>
      {error && <p className="alert error">{error}</p>}
      <CheckoutForm items={cart} onSubmit={submit} onIncrement={(id) => updateQty(setCart, id, 1)} onDecrement={(id) => updateQty(setCart, id, -1)} onRemove={(id) => removeItem(setCart, id)} loading={loading} />
    </main>
  )
}
