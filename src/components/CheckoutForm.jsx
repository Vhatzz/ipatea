import { useState } from 'react'
import Cart from './Cart.jsx'

export default function CheckoutForm({ items, onSubmit, onIncrement, onDecrement, onRemove, loading }) {
  const [form, setForm] = useState({ buyerName: '', buyerPhone: '', note: '' })

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function submit(event) {
    event.preventDefault()
    onSubmit(form)
  }

  return (
    <div className="checkout-grid">
      <form className="panel form" onSubmit={submit}>
        <h2>Data Pemesan</h2>
        <label>Nama buyer<input name="buyerName" value={form.buyerName} onChange={updateField} required /></label>
        <label>Nomor HP<input name="buyerPhone" value={form.buyerPhone} onChange={updateField} required /></label>
        <label>Catatan<textarea name="note" value={form.note} onChange={updateField} rows="4" /></label>
        <label>Metode pembayaran<input value="Cash" readOnly /></label>
        <button disabled={loading || !items.length}>{loading ? 'Menyimpan...' : 'Buat Pesanan'}</button>
      </form>
      <Cart items={items} onIncrement={onIncrement} onDecrement={onDecrement} onRemove={onRemove} showCheckout={false} />
    </div>
  )
}
