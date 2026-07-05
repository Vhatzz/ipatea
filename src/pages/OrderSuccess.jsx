import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import OrderStatusBadge from '../components/OrderStatusBadge.jsx'
import { getOrderByLookup } from '../services/orderService.js'
import { formatCurrency } from '../utils/formatCurrency.js'

export default function OrderSuccess() {
  const { orderCode } = useParams()
  const [searchParams] = useSearchParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    getOrderByLookup(orderCode, token)
      .then((data) => {
        if (!data) setError('Pesanan tidak ditemukan atau token tidak valid.')
        setOrder(data)
      })
      .catch((err) => setError(err.message))
  }, [orderCode, searchParams])

  return (
    <main className="page narrow">
      <section className="panel success-panel">
        <span className="eyebrow">Pesanan berhasil</span>
        <h1>{orderCode}</h1>
        {error && <p className="alert error">{error}</p>}
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
