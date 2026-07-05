import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { signOutAdmin } from '../services/authService.js'

export default function AdminLayout({ children }) {
  const navigate = useNavigate()

  async function logout() {
    navigate('/', { replace: true })
    try {
      await signOutAdmin()
    } catch (error) {
      console.error('Gagal logout admin:', error)
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <h1>IPATEA Admin</h1>
        <NavLink to="/admin" end>Dashboard</NavLink>
        <NavLink to="/admin/products">Produk</NavLink>
        <NavLink to="/admin/orders">Pesanan</NavLink>
        <NavLink to="/admin/stock">Stok</NavLink>
        <NavLink to="/admin/reports">Laporan</NavLink>
        <button className="ghost" onClick={logout}>Logout</button>
      </aside>
      <main className="admin-content">{children || <Outlet />}</main>
    </div>
  )
}
