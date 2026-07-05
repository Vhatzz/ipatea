export default function OrderStatusBadge({ status }) {
  const key = String(status || '').toLowerCase().replaceAll(' ', '-')
  return <span className={`status status--${key}`}>{status}</span>
}
