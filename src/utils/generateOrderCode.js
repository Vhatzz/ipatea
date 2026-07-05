export function generateOrderCode() {
  const date = new Date()
  const stamp = date.toISOString().slice(2, 10).replace(/-/g, '')
  const random = Math.floor(1000 + Math.random() * 9000)
  return `IPATEA-${stamp}-${random}`
}
