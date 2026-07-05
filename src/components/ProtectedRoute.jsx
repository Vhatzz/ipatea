import { Navigate, Outlet } from 'react-router-dom'
import AdminLayout from './AdminLayout.jsx'

export default function ProtectedRoute({ session, loading }) {
  if (loading) return <div className="center-screen">Memeriksa sesi admin...</div>
  if (!session) return <Navigate to="/admin/login" replace />
  return <AdminLayout><Outlet /></AdminLayout>
}
