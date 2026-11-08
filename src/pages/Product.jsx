import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { fcfa } from '../lib/utils'
import { SIZES } from '../lib/config'

export default function Product() {
  const { id } = useParams()
  const nav = useNavigate()
  const { add } = useCart()
  const [p, setP] = useState(null)
  const [state, setState] = useState('loading')
  const [img, setImg] = useState(0)
  const [size, setSize] = useState('')
  const [qty, setQty] = useState(1)

  useEffect(() => {
    if (!supabase) return setState('missing')
    supabase.from('products').select('*, product_sizes(size, stock)').eq('id', id).eq('active', true).maybeSingle()
      .then(({ data }) => { setP(data); setState(data ? 'ok' : 'missing') })
  }, [id])

  if (state === 'loading') return <p className="p-10 text-white/60">Chargement…</p>
  if (state === 'missing') return <div className="p-10 text-center"><p>Ce maillot n’est plus disponible.</p><Link className="text-gold" to="/boutique">Retour à la boutique</Link></div>

  const sizes = [...p.product_sizes].sort((a, b) => SIZES.indexOf(a.size) - SIZES.indexOf(b.size))
  const current = sizes.find((s) => s.size === size)
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-10">
      <div>
        <div className="aspect-[4/5] bg-ink border border-white/10">
          {p.images[img] ? <img src={p.images[img]} alt={p.name} className="w-full h-full object-cover" /> : <div className="h-full grid place-items-center text-white/30">Photo à venir</div>}
        </div>
        {p.images.length > 1 && <div className="flex gap-2 mt-2 overflow-x-auto">{p.images.map((u, i) => (
          <button key={u} onClick={() => setImg(i)} className={`w-20 h-24 shrink-0 border ${i === img ? 'border-gold' : 'border-white/15'}`}><img src={u} alt="" className="w-full h-full object-cover" /></button>))}</div>}
      </div>
      <div>
        <p className="text-white/60">{p.team}{p.season ? ` · ${p.season}` : ''}</p>
        <h1 className="text-5xl mt-1">{p.name}</h1>
        <p className="mt-2"><span className="border border-gold/50 text-gold text-sm px-2 py-1">Version {p.version}</span></p>
        <p className="text-gold text-3xl font-semibold mt-5">{fcfa(p.price)}</p>
        {p.description && <p className="mt-5 text-white/80 whitespace-pre-line">{p.description}</p>}
        <p className="label mt-8">Taille</p>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => <button key={s.size} disabled={s.stock < 1} onClick={() => { setSize(s.size); setQty(1) }}
            className={`min-w-12 px-3 py-2 border ${size === s.size ? 'bg-gold text-black border-gold' : 'border-white/30'} disabled:opacity-30 disabled:line-through`}>{s.size}</button>)}
        </div>
        {current && current.stock <= 5 && <p className="text-gold text-sm mt-2">Plus que {current.stock} en stock</p>}
        <div className="flex items-center gap-3 mt-6">
          <input className="input !w-20" type="number" min="1" max={current?.stock || 1} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(current?.stock || 1, +e.target.value || 1)))} aria-label="Quantité" />
          <button className="btn btn-gold flex-1" disabled={!size} onClick={() => { add(p.id, size, qty); nav('/panier') }}>{size ? 'Ajouter au panier' : 'Choisissez une taille'}</button>
        </div>
      </div>
    </div>
  )
}
