import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import OrderStatusBadge from '../components/OrderStatusBadge.jsx'
import { getOrders } from '../services/orderService.js'
import { supabase } from '../services/supabaseClient.js'
import { formatCurrency } from '../utils/formatCurrency.js'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])

  const loadOrders = useCallback(async () => {
    setOrders(await getOrders())
  }, [])

  useEffect(() => {
    loadOrders()
    const channel = supabase.channel('orders-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadOrders).subscribe()
    return () => supabase.removeChannel(channel)
  }, [loadOrders])

  return (
    <div>
      <div className="section-heading"><span className="eyebrow">Pesanan Admin</span><h1>Kelola pesanan masuk</h1></div>
      <section className="panel table-wrap"><table><thead><tr><th>Kode</th><th>Buyer</th><th>Total</th><th>Bayar</th><th>Status</th><th>Waktu</th><th></th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td>{order.order_code}</td><td>{order.buyer_name}</td><td>{formatCurrency(order.total_price)}</td><td>{order.payment_status}</td><td><OrderStatusBadge status={order.status} /></td><td>{new Date(order.created_at).toLocaleString('id-ID')}</td><td><Link to={`/admin/orders/${order.id}`}>Detail</Link></td></tr>)}</tbody></table></section>
    </div>
  )
}
