import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import OrderStatusBadge from '../components/OrderStatusBadge.jsx'
import { getOrders } from '../services/orderService.js'
import { getProducts } from '../services/productService.js'
import { supabase } from '../services/supabaseClient.js'
import { formatCurrency } from '../utils/formatCurrency.js'

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null)

  const loadSummary = useCallback(async () => {
    const [products, orders] = await Promise.all([getProducts(), getOrders()])
    const today = new Date().toDateString()
    const ordersToday = orders.filter((order) => new Date(order.created_at).toDateString() === today)
    const productSales = new Map()
    orders.forEach((order) => order.order_items?.forEach((item) => productSales.set(item.product_name, (productSales.get(item.product_name) || 0) + item.quantity)))
    setSummary({
      totalMenu: products.length,
      totalStock: products.reduce((sum, product) => sum + Number(product.stock || 0), 0),
      ordersToday: ordersToday.length,
      masuk: orders.filter((order) => order.status === 'Pesanan Masuk').length,
      diproses: orders.filter((order) => order.status === 'Diproses').length,
      selesai: orders.filter((order) => order.status === 'Selesai').length,
      revenueToday: ordersToday.filter((order) => order.payment_status === 'Sudah Dibayar' || order.status === 'Selesai').reduce((sum, order) => sum + order.total_price, 0),
      topProduct: [...productSales.entries()].sort((a, b) => b[1] - a[1])[0],
      latestOrders: orders.slice(0, 5),
    })
  }, [])

  useEffect(() => {
    loadSummary()
    const channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadSummary)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, loadSummary)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [loadSummary])

  if (!summary) return <p>Memuat dashboard...</p>

  return (
    <div>
      <div className="section-heading"><span className="eyebrow">Dashboard</span><h1>Ringkasan operasional</h1></div>
      <div className="stats-grid">
        <Stat label="Total menu" value={summary.totalMenu} />
        <Stat label="Total stok" value={summary.totalStock} />
        <Stat label="Pesanan hari ini" value={summary.ordersToday} />
        <Stat label="Pesanan masuk" value={summary.masuk} />
        <Stat label="Diproses" value={summary.diproses} />
        <Stat label="Selesai" value={summary.selesai} />
        <Stat label="Pendapatan hari ini" value={formatCurrency(summary.revenueToday)} />
        <Stat label="Produk terlaris" value={summary.topProduct ? `${summary.topProduct[0]} (${summary.topProduct[1]})` : '-'} />
      </div>
      <section className="panel">
        <h2>Pesanan terbaru</h2>
        <div className="table-wrap"><table><tbody>{summary.latestOrders.map((order) => <tr key={order.id}><td>{order.order_code}</td><td>{order.buyer_name}</td><td>{formatCurrency(order.total_price)}</td><td><OrderStatusBadge status={order.status} /></td><td><Link to={`/admin/orders/${order.id}`}>Detail</Link></td></tr>)}</tbody></table></div>
      </section>
    </div>
  )
}

function Stat({ label, value }) {
  return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div>
}
