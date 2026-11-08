import { Link } from 'react-router-dom'
import { fcfa, inStock } from '../lib/utils'

export default function ProductCard({ p }) {
  const out = !inStock(p)
  return (
    <Link to={`/produit/${p.id}`} className="group block bg-ink border border-white/10 hover:border-gold transition-colors">
      <div className="aspect-[4/5] bg-black overflow-hidden relative">
        {p.images?.[0] ? <img src={p.images[0]} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full grid place-items-center text-white/30">Photo à venir</div>}
        <span className="absolute top-2 left-2 bg-black/80 text-gold text-xs px-2 py-1 border border-gold/40">{p.version}</span>
        {out && <span className="absolute inset-x-0 bottom-0 bg-black/80 text-center py-1 text-sm">Épuisé</span>}
      </div>
      <div className="p-3">
        <p className="text-white/60 text-sm">{p.team}{p.season ? ` · ${p.season}` : ''}</p>
        <h3 className="text-xl leading-tight mt-0.5">{p.name}</h3>
        <p className="text-gold font-semibold mt-2">{fcfa(p.price)}</p>
      </div>
    </Link>
  )
}
