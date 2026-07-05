import { getOrders } from './orderService.js'

export async function getSalesReport(filters = {}) {
  const orders = await getOrders()
  const filtered = orders.filter((order) => {
    const createdAt = new Date(order.created_at)
    const from = filters.from ? new Date(filters.from) : null
    const to = filters.to ? new Date(`${filters.to}T23:59:59`) : null
    if (from && createdAt < from) return false
    if (to && createdAt > to) return false
    if (filters.status && order.status !== filters.status) return false
    if (filters.paymentStatus && order.payment_status !== filters.paymentStatus) return false
    return true
  })

  const paidOrDone = filtered.filter((order) => order.payment_status === 'Sudah Dibayar' || order.status === 'Selesai')
  const products = new Map()
  filtered.forEach((order) => {
    order.order_items?.forEach((item) => {
      const current = products.get(item.product_name) || { name: item.product_name, quantity: 0, revenue: 0 }
      current.quantity += item.quantity
      current.revenue += item.subtotal
      products.set(item.product_name, current)
    })
  })

  const totalRevenue = paidOrDone.reduce((sum, order) => sum + order.total_price, 0)
  const topProducts = [...products.values()].sort((a, b) => b.quantity - a.quantity)
  const highestRevenueProducts = [...products.values()].sort((a, b) => b.revenue - a.revenue)

  return {
    orders: filtered,
    totalOrders: filtered.length,
    totalRevenue,
    doneOrders: filtered.filter((order) => order.status === 'Selesai').length,
    cancelledOrders: filtered.filter((order) => order.status === 'Dibatalkan').length,
    cashReceived: paidOrDone.reduce((sum, order) => sum + Number(order.amount_paid || 0), 0),
    averageTransaction: filtered.length ? Math.round(totalRevenue / filtered.length) : 0,
    stockOut: filtered.reduce((sum, order) => sum + (order.order_items || []).reduce((itemSum, item) => itemSum + item.quantity, 0), 0),
    topProducts,
    highestRevenueProducts,
  }
}
