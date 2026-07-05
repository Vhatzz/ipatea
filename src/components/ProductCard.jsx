import { formatCurrency } from '../utils/formatCurrency.js'

export default function ProductCard({ product, onAdd }) {
  const unavailable = !product.is_available || product.stock <= 0
  return (
    <article className="product-card">
      <img src={product.image_url || '/placeholder-product.svg'} alt={product.name} />
      <div className="product-card__body">
        <span className="pill">{product.category}</span>
        <h3>{product.name}</h3>
        <p>{product.description || 'Teh segar khas IPATEA.'}</p>
        <div className="split">
          <strong>{formatCurrency(product.price)}</strong>
          <span className={unavailable ? 'danger' : 'muted'}>{unavailable ? 'Tidak tersedia' : `Stok ${product.stock}`}</span>
        </div>
        <button disabled={unavailable} onClick={() => onAdd(product)}>{unavailable ? 'Habis' : 'Tambah'}</button>
      </div>
    </article>
  )
}
