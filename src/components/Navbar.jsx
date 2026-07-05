import { Link, NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <header className="site-header">
      <Link className="brand" to="/">IPATEA</Link>
      <nav>
        <NavLink to="/">Beranda</NavLink>
        <NavLink to="/menu">Menu</NavLink>
        <NavLink to="/checkout">Checkout</NavLink>
        <NavLink to="/admin/login">Admin</NavLink>
      </nav>
    </header>
  )
}
