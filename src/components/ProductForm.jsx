import { useState } from 'react'

const emptyProduct = { name: '', price: '', category: 'Tea', description: '', stock: 0, is_available: true, is_active: true }

export default function ProductForm({ product, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(() => product || emptyProduct)
  const [imageFile, setImageFile] = useState(null)

  function updateField(event) {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  function submit(event) {
    event.preventDefault()
    onSubmit(form, imageFile)
  }

  return (
    <form className="panel form" onSubmit={submit}>
      <h2>{form.id ? 'Edit Produk' : 'Tambah Produk'}</h2>
      <label>Nama produk<input name="name" value={form.name} onChange={updateField} required /></label>
      <label>Harga<input name="price" type="number" min="0" value={form.price} onChange={updateField} required /></label>
      <label>Kategori<input name="category" value={form.category} onChange={updateField} required /></label>
      <label>Deskripsi<textarea name="description" value={form.description || ''} onChange={updateField} rows="3" /></label>
      <label>Stok<input name="stock" type="number" min="0" value={form.stock} onChange={updateField} required /></label>
      <label>Gambar produk<input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files[0])} /></label>
      <label className="check"><input type="checkbox" name="is_available" checked={form.is_available} onChange={updateField} /> Tersedia</label>
      <label className="check"><input type="checkbox" name="is_active" checked={form.is_active} onChange={updateField} /> Aktif</label>
      <div className="actions">
        <button disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</button>
        {form.id && <button type="button" className="ghost" onClick={onCancel}>Batal</button>}
      </div>
    </form>
  )
}
