import { Link } from 'react-router-dom'
import { formatCurrency } from '../utils/formatCurrency.js'

export default function Cart({ items, onIncrement, onDecrement, onRemove, showCheckout = true }) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  return (
    <aside className="panel cart-panel">
      <h2>Keranjang</h2>
      {!items.length && <p className="muted">Belum ada produk dipilih.</p>}
      {items.map((item) => (
        <div className="cart-item" key={item.id}>
          <div>
            <strong>{item.name}</strong>
            <p>{formatCurrency(item.price)} x {item.quantity}</p>
          </div>
          <div className="qty-control">
            <button onClick={() => onDecrement(item.id)}>-</button>
            <span>{item.quantity}</span>
            <button onClick={() => onIncrement(item.id)} disabled={item.quantity >= item.stock}>+</button>
            <button className="ghost danger" onClick={() => onRemove(item.id)}>Hapus</button>
          </div>
        </div>
      ))}
      <div className="cart-total">
        <span>Total</span>
        <strong>{formatCurrency(total)}</strong>
      </div>
      {showCheckout && <Link className="button full" to="/checkout">Checkout</Link>}
    </aside>
  )
}
