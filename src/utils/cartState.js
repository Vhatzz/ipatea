import { useState } from 'react'

export function useCart() {
  const [cart, setCartState] = useState(() => JSON.parse(localStorage.getItem('ipatea-cart') || '[]'))
  function setCart(next) {
    setCartState((current) => {
      const value = typeof next === 'function' ? next(current) : next
      localStorage.setItem('ipatea-cart', JSON.stringify(value))
      return value
    })
  }
  return [cart, setCart]
}

export function updateQty(setCart, id, delta) {
  setCart((current) => current.map((item) => {
    if (item.id !== id) return item
    const quantity = Math.max(1, Math.min(item.stock, item.quantity + delta))
    return { ...item, quantity }
  }))
}

export function removeItem(setCart, id) {
  setCart((current) => current.filter((item) => item.id !== id))
}
