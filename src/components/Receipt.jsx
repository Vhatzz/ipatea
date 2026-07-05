import { formatCurrency } from '../utils/formatCurrency.js'

export default function Receipt({ order }) {
  if (!order) return null
  return (
    <section className="receipt print-area">
      <h2>IPATEA</h2>
      <p>Fresh Tea, Fresh Mood.</p>
      <hr />
      <p>Kode: {order.order_code}</p>
      <p>Tanggal: {new Date(order.created_at).toLocaleString('id-ID')}</p>
      <p>Buyer: {order.buyer_name}</p>
      <hr />
      {order.order_items?.map((item) => (
        <div className="receipt-row" key={item.id}>
          <span>{item.product_name}</span>
          <span>{item.quantity} x {item.product_price}</span>
        </div>
      ))}
      <hr />
      <div className="receipt-row"><strong>Total</strong><strong>{formatCurrency(order.total_price)}</strong></div>
      <div className="receipt-row"><span>Cash</span><span>{formatCurrency(order.amount_paid)}</span></div>
      <div className="receipt-row"><span>Kembali</span><span>{formatCurrency(order.change_amount)}</span></div>
      <hr />
      <p>Terima kasih</p>
    </section>
  )
}
