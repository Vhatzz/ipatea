import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Receipt from '../components/Receipt.jsx'
import { getOrderById, updateOrderStatus, updatePayment } from '../services/orderService.js'
import { formatCurrency } from '../utils/formatCurrency.js'
import { printReceipt } from '../utils/printReceipt.js'

const statuses = ['Pesanan Masuk', 'Diproses', 'Siap Diambil', 'Selesai', 'Dibatalkan']

export default function AdminOrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [amountPaid, setAmountPaid] = useState('')
  const [message, setMessage] = useState('')

  const loadOrder = useCallback(async () => {
    const data = await getOrderById(id)
    setOrder(data)
    setAmountPaid(data.amount_paid || '')
  }, [id])

  useEffect(() => { loadOrder() }, [loadOrder])

  async function changeStatus(status) {
    try {
      await updateOrderStatus(order, status)
      setMessage('Status pesanan diperbarui.')
      await loadOrder()
    } catch (err) {
      setMessage(err.message)
    }
  }

  async function savePayment() {
    try {
      await updatePayment(order.id, amountPaid, order.total_price)
      setMessage('Pembayaran cash tersimpan.')
      await loadOrder()
    } catch (err) {
      setMessage(err.message)
    }
  }

  if (!order) return <p>Memuat pesanan...</p>

  return (
    <div>
      <div className="section-heading"><span className="eyebrow">Detail Pesanan</span><h1>{order.order_code}</h1></div>
      {message && <p className="alert">{message}</p>}
      <div className="admin-grid">
        <section className="panel">
          <h2>Informasi pesanan</h2>
          <p>Buyer: <strong>{order.buyer_name}</strong> ({order.buyer_phone})</p>
          <p>Catatan: {order.note || '-'}</p>
          <p>Total: <strong>{formatCurrency(order.total_price)}</strong></p>
          <div className="table-wrap"><table><tbody>{order.order_items?.map((item) => <tr key={item.id}><td>{item.product_name}</td><td>{item.quantity} x {formatCurrency(item.product_price)}</td><td>{formatCurrency(item.subtotal)}</td></tr>)}</tbody></table></div>
          <label>Status pesanan<select value={order.status} onChange={(event) => changeStatus(event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          <div className="payment-box">
            <label>Uang diterima<input type="number" min="0" value={amountPaid} onChange={(event) => setAmountPaid(event.target.value)} /></label>
            <p>Kembalian: {formatCurrency(Math.max(0, Number(amountPaid || 0) - order.total_price))}</p>
            <button onClick={savePayment}>Tandai Sudah Dibayar</button>
          </div>
          <button className="secondary" onClick={printReceipt}>Cetak Struk</button>
        </section>
        <Receipt order={order} />
      </div>
    </div>
  )
}
