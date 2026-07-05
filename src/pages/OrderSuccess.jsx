import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import OrderStatusBadge from '../components/OrderStatusBadge.jsx'
import { getOrderByCode } from '../services/orderService.js'
import { formatCurrency } from '../utils/formatCurrency.js'

export default function OrderSuccess() {
  const { orderCode } = useParams()
  const [order, setOrder] = useState(null)

  useEffect(() => {
    getOrderByCode(orderCode).then(setOrder).catch(console.error)
  }, [orderCode])

  return (
    <main className="page narrow">
      <section className="panel success-panel">
        <span className="eyebrow">Pesanan berhasil</span>
        <h1>{orderCode}</h1>
        {order && <>
          <p>Total pembayaran: <strong>{formatCurrency(order.total_price)}</strong></p>
          <p>Status: <OrderStatusBadge status={order.status} /></p>
          <p>Bayar cash saat mengambil pesanan.</p>
        </>}
        <Link className="button" to="/menu">Pesan Lagi</Link>
      </section>
    </main>
  )
}
