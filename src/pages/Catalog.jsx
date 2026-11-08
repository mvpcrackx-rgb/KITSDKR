import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useProducts } from '../lib/utils'
import { VERSIONS } from '../lib/config'

export default function Catalog() {
  const { products, loading, error } = useProducts()
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') || '', cat = sp.get('cat') || '', version = sp.get('version') || '', sort = sp.get('sort') || ''
  const set = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n, { replace: true }) }

  const list = useMemo(() => {
    let l = products.filter((p) =>
      (!cat || p.category === cat) && (!version || p.version === version) &&
      `${p.name} ${p.team} ${p.season || ''}`.toLowerCase().includes(q.toLowerCase()))
    if (sort === 'asc') l = [...l].sort((a, b) => a.price - b.price)
    if (sort === 'desc') l = [...l].sort((a, b) => b.price - a.price)
    return l
  }, [products, q, cat, version, sort])

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-5xl mb-6">Boutique</h1>
      <div className="grid gap-3 md:grid-cols-4 mb-8">
        <input className="input md:col-span-1" type="search" placeholder="Rechercher un club, une équipe…" value={q} onChange={(e) => set('q', e.target.value)} aria-label="Recherche" />
        <select className="input" value={cat} onChange={(e) => set('cat', e.target.value)} aria-label="Catégorie">
          <option value="">Clubs et sélections</option><option value="club">Clubs</option><option value="national">Sélections nationales</option>
        </select>
        <select className="input" value={version} onChange={(e) => set('version', e.target.value)} aria-label="Version">
          <option value="">Toutes les versions</option>{VERSIONS.map((v) => <option key={v}>{v}</option>)}
        </select>
        <select className="input" value={sort} onChange={(e) => set('sort', e.target.value)} aria-label="Tri">
          <option value="">Nouveautés</option><option value="asc">Prix croissant</option><option value="desc">Prix décroissant</option>
        </select>
      </div>
      {error && <p className="text-red-400">Erreur de chargement : {error}</p>}
      {loading ? <p className="text-white/60">Chargement…</p> : list.length === 0
        ? <p className="border border-dashed border-white/20 p-10 text-center text-white/70">{products.length === 0 ? 'Aucun maillot disponible pour le moment.' : 'Aucun maillot ne correspond à votre recherche.'}</p>
        : <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
    </div>
  )
}
