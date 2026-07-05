import { useCallback, useEffect, useState } from 'react'
import { getSalesReport } from '../services/reportService.js'
import { exportCsv } from '../utils/exportCsv.js'
import { formatCurrency } from '../utils/formatCurrency.js'

export default function AdminReports() {
  const [filters, setFilters] = useState({ from: '', to: '', status: '', paymentStatus: '' })
  const [report, setReport] = useState(null)

  const loadReport = useCallback(async (nextFilters = filters) => {
    setReport(await getSalesReport(nextFilters))
  }, [filters])

  useEffect(() => { loadReport() }, [loadReport])

  function updateFilter(event) {
    const next = { ...filters, [event.target.name]: event.target.value }
    setFilters(next)
    loadReport(next)
  }

  function exportReport() {
    exportCsv('laporan-ipatea.csv', report.orders.map((order) => ({ kode: order.order_code, buyer: order.buyer_name, tanggal: order.created_at, total: order.total_price, pembayaran: order.payment_status, status: order.status })))
  }

  if (!report) return <p>Memuat laporan...</p>

  return (
    <div>
      <div className="section-heading"><span className="eyebrow">Laporan Penjualan</span><h1>Analisis transaksi cash</h1></div>
      <section className="panel filters">
        <input type="date" name="from" value={filters.from} onChange={updateFilter} />
        <input type="date" name="to" value={filters.to} onChange={updateFilter} />
        <select name="status" value={filters.status} onChange={updateFilter}><option value="">Semua status</option><option>Pesanan Masuk</option><option>Diproses</option><option>Siap Diambil</option><option>Selesai</option><option>Dibatalkan</option></select>
        <select name="paymentStatus" value={filters.paymentStatus} onChange={updateFilter}><option value="">Semua pembayaran</option><option>Belum Dibayar</option><option>Sudah Dibayar</option></select>
        <button onClick={exportReport}>Export CSV</button>
        <button className="secondary" onClick={() => window.print()}>Print Laporan</button>
      </section>
      <div className="stats-grid">
        <Stat label="Total pesanan" value={report.totalOrders} />
        <Stat label="Total pendapatan" value={formatCurrency(report.totalRevenue)} />
        <Stat label="Selesai" value={report.doneOrders} />
        <Stat label="Dibatalkan" value={report.cancelledOrders} />
        <Stat label="Cash diterima" value={formatCurrency(report.cashReceived)} />
        <Stat label="Rata-rata" value={formatCurrency(report.averageTransaction)} />
        <Stat label="Stok keluar" value={report.stockOut} />
        <Stat label="Produk terlaris" value={report.topProducts[0]?.name || '-'} />
      </div>
      <section className="panel table-wrap print-area">
        <h2>Riwayat transaksi</h2>
        <table><thead><tr><th>Kode</th><th>Buyer</th><th>Tanggal</th><th>Item</th><th>Total</th><th>Pembayaran</th><th>Status</th></tr></thead><tbody>{report.orders.map((order) => <tr key={order.id}><td>{order.order_code}</td><td>{order.buyer_name}</td><td>{new Date(order.created_at).toLocaleDateString('id-ID')}</td><td>{order.order_items?.map((item) => `${item.product_name} x${item.quantity}`).join(', ')}</td><td>{formatCurrency(order.total_price)}</td><td>{order.payment_status}</td><td>{order.status}</td></tr>)}</tbody></table>
      </section>
    </div>
  )
}

function Stat({ label, value }) {
  return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div>
}
