import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { fcfa } from '../../lib/utils'
import { SIZES, VERSIONS } from '../../lib/config'

const empty = { name: '', team: '', category: 'club', season: '', version: 'Fan', description: '', price: '', active: true, images: [], sizes: [] }

export default function AdminProducts() {
  const [list, setList] = useState([])
  const [editing, setEditing] = useState(null)
  const load = () => supabase.from('products').select('*, product_sizes(size, stock)').order('created_at', { ascending: false }).then(({ data }) => setList(data || []))
  useEffect(() => { load() }, [])

  const toggle = async (p) => { await supabase.from('products').update({ active: !p.active }).eq('id', p.id); load() }
  const del = async (p) => { if (confirm(`Supprimer « ${p.name} » définitivement ?`)) { await supabase.from('products').delete().eq('id', p.id); load() } }

  if (editing) return <ProductForm initial={editing} onClose={() => { setEditing(null); load() }} />
  return (
    <div>
      <div className="flex justify-between items-center mb-4"><h1 className="text-4xl">Produits ({list.length})</h1><button className="btn btn-gold" onClick={() => setEditing(empty)}>Ajouter un maillot</button></div>
      {list.length === 0 && <p className="border border-dashed border-white/20 p-8 text-center text-white/70">Aucun maillot pour l’instant. Le catalogue public reste vide tant que vous n’en ajoutez pas.</p>}
      <ul className="divide-y divide-white/10">
        {list.map((p) => (
          <li key={p.id} className="py-3 flex gap-3 items-center flex-wrap">
            <div className="w-14 h-16 bg-ink shrink-0">{p.images[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}</div>
            <div className="flex-1 min-w-48"><p className="font-semibold">{p.name} {!p.active && <span className="text-xs text-white/50">(désactivé)</span>}</p>
              <p className="text-sm text-white/60">{p.team} · {p.version} · {fcfa(p.price)} · Stock : {p.product_sizes.map((s) => `${s.size}:${s.stock}`).join(' ') || 'aucune taille'}</p></div>
            <button className="btn btn-line !py-1.5" onClick={() => setEditing({ ...p, season: p.season || '', description: p.description || '', sizes: p.product_sizes })}>Modifier</button>
            <button className="btn btn-line !py-1.5" onClick={() => toggle(p)}>{p.active ? 'Désactiver' : 'Activer'}</button>
            <button className="btn btn-line !py-1.5 hover:!border-red-400 hover:!text-red-400" onClick={() => del(p)}>Supprimer</button>
          </li>))}
      </ul>
    </div>
  )
}

function ProductForm({ initial, onClose }) {
  const [f, setF] = useState(initial)
  const [files, setFiles] = useState([])
  const [custom, setCustom] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const isNew = !initial.id
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const hasSize = (s) => f.sizes.some((x) => x.size === s)
  const toggleSize = (s) => setF({ ...f, sizes: hasSize(s) ? f.sizes.filter((x) => x.size !== s) : [...f.sizes, { size: s, stock: 0 }] })
  const setStock = (s, v) => setF({ ...f, sizes: f.sizes.map((x) => x.size === s ? { ...x, stock: Math.max(0, parseInt(v) || 0) } : x) })

  async function save(e) {
    e.preventDefault(); setError('')
    const price = parseInt(f.price, 10)
    if (!Number.isFinite(price) || price < 0) return setError('Saisissez un prix valide en FCFA.')
    setBusy(true)
    try {
      const urls = [...f.images]
      for (const file of files) {
        const path = `${crypto.randomUUID()}.${file.name.split('.').pop().toLowerCase()}`
        const { error } = await supabase.storage.from('product-images').upload(path, file, { cacheControl: '31536000' })
        if (error) throw error
        urls.push(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl)
      }
      const row = { name: f.name.trim(), team: f.team.trim(), category: f.category, season: f.season.trim() || null, version: f.version, description: f.description.trim() || null, price, active: f.active, images: urls }
      let id = initial.id
      if (isNew) { const { data, error } = await supabase.from('products').insert(row).select('id').single(); if (error) throw error; id = data.id }
      else { const { error } = await supabase.from('products').update(row).eq('id', id); if (error) throw error }
      const keep = f.sizes.map((s) => s.size)
      const { error: de } = await supabase.from('product_sizes').delete().eq('product_id', id).not('size', 'in', `(${keep.map((s) => `"${s}"`).join(',') || '""'})`)
      if (de) throw de
      if (f.sizes.length) { const { error } = await supabase.from('product_sizes').upsert(f.sizes.map((s) => ({ product_id: id, size: s.size, stock: s.stock }))); if (error) throw error }
      onClose()
    } catch (err) { setError(err.message); setBusy(false) }
  }

  return (
    <form onSubmit={save} className="max-w-2xl space-y-4">
      <h1 className="text-4xl">{isNew ? 'Nouveau maillot' : 'Modifier le maillot'}</h1>
      <div><label className="label">Nom du maillot</label><input className="input" required value={f.name} onChange={set('name')} placeholder="ex : Maillot domicile" /></div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className="label">Club ou sélection</label><input className="input" required value={f.team} onChange={set('team')} /></div>
        <div><label className="label">Catégorie</label><select className="input" value={f.category} onChange={set('category')}><option value="club">Club</option><option value="national">Sélection nationale</option></select></div>
        <div><label className="label">Saison</label><input className="input" value={f.season} onChange={set('season')} placeholder="ex : 2025/26" /></div>
        <div><label className="label">Version</label><select className="input" value={f.version} onChange={set('version')}>{[...new Set([...VERSIONS, f.version])].map((v) => <option key={v}>{v}</option>)}</select></div>
      </div>
      <div><label className="label">Prix (FCFA)</label><input className="input" type="number" min="0" step="1" required value={f.price} onChange={set('price')} /></div>
      <div><label className="label">Description</label><textarea className="input" rows="4" value={f.description} onChange={set('description')} /></div>

      <div><p className="label">Tailles et stock</p>
        <div className="flex flex-wrap gap-2">{[...new Set([...SIZES, ...f.sizes.map((s) => s.size)])].map((s) => (
          <button type="button" key={s} onClick={() => toggleSize(s)} className={`px-3 py-1.5 border ${hasSize(s) ? 'bg-gold text-black border-gold' : 'border-white/30'}`}>{s}</button>))}</div>
        <div className="flex gap-2 mt-2"><input className="input !w-40" placeholder="Autre taille (ex : 12 ans)" value={custom} onChange={(e) => setCustom(e.target.value)} />
          <button type="button" className="btn btn-line !py-2" onClick={() => { const s = custom.trim(); if (s && !hasSize(s)) setF({ ...f, sizes: [...f.sizes, { size: s, stock: 0 }] }); setCustom('') }}>Ajouter</button></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">{f.sizes.map((s) => (
          <label key={s.size} className="flex items-center gap-2"><span className="w-12">{s.size}</span><input type="number" min="0" className="input !py-1.5" value={s.stock} onChange={(e) => setStock(s.size, e.target.value)} aria-label={`Stock ${s.size}`} /></label>))}</div>
      </div>

      <div><p className="label">Photos</p>
        <div className="flex flex-wrap gap-2 mb-2">{f.images.map((u) => (
          <div key={u} className="relative w-20 h-24"><img src={u} alt="" className="w-full h-full object-cover" />
            <button type="button" className="absolute top-0 right-0 bg-black/80 px-1.5" aria-label="Retirer la photo" onClick={() => setF({ ...f, images: f.images.filter((x) => x !== u) })}>×</button></div>))}</div>
        <input type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files])} className="text-sm" />
        {files.length > 0 && <p className="text-sm text-white/60 mt-1">{files.length} nouvelle(s) photo(s) à envoyer à l’enregistrement.</p>}
      </div>

      <label className="flex items-center gap-2"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Visible dans la boutique</label>
      {error && <p className="text-red-400" role="alert">{error}</p>}
      <div className="flex gap-3"><button className="btn btn-gold" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button><button type="button" className="btn btn-line" onClick={onClose}>Annuler</button></div>
    </form>
  )
}
