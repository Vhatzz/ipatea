import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { signInAdmin } from '../services/authService.js'

export default function AdminLogin({ session }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  if (session) return <Navigate to="/admin" replace />

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signInAdmin(email, password)
      navigate('/admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <form className="panel login-card" onSubmit={submit}>
        <span className="eyebrow">Admin IPATEA</span>
        <h1>Login Dashboard</h1>
        {error && <p className="alert error">{error}</p>}
        <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        <button disabled={loading}>{loading ? 'Masuk...' : 'Login'}</button>
      </form>
    </main>
  )
}
