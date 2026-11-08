import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useProducts } from '../lib/utils'
import { DELIVERY } from '../lib/config'

export default function Home() {
  const { products, loading } = useProducts()
  return (
    <>
      <section className="relative overflow-hidden border-b border-gold/30">
        <div className="absolute -right-24 top-0 h-full w-40 md:w-72 bg-gold -skew-x-12 opacity-90" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-28 hero-in">
          <h1 className="text-6xl md:text-8xl leading-[0.9]">Porte les<br />couleurs<br /><span className="text-gold">de ton équipe.</span></h1>
          <p className="mt-6 max-w-md text-white/80 text-lg">Maillots de clubs et de sélections, versions Player et Fan, livrés à Dakar et dans tout le Sénégal.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/boutique" className="btn btn-gold">Voir les maillots</Link>
            <Link to="/livraison" className="btn btn-line bg-black">Infos livraison</Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 mt-12 grid grid-cols-2 gap-4">
        {[['club', 'Clubs'], ['national', 'Sélections nationales']].map(([cat, label]) => (
          <Link key={cat} to={`/boutique?cat=${cat}`} className="border border-white/15 hover:border-gold p-6 md:p-10 transition-colors">
            <h2 className="text-3xl md:text-5xl">{label}</h2><p className="text-gold mt-2">Voir la sélection</p>
          </Link>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-4 mt-14">
        <h2 className="text-4xl mb-6">Derniers arrivages</h2>
        {loading ? <p className="text-white/60">Chargement…</p> : products.length === 0
          ? <p className="border border-dashed border-white/20 p-8 text-center text-white/70">Le catalogue arrive bientôt. Revenez vite ou écrivez-nous sur WhatsApp.</p>
          : <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{products.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}</div>}
      </section>

      <section className="max-w-6xl mx-auto px-4 mt-14 grid md:grid-cols-3 gap-4">
        {DELIVERY.map((d) => <div key={d.title} className="border-l-2 border-gold pl-4"><h3 className="text-2xl">{d.title}</h3><p className="text-white/70 mt-1">{d.text}</p></div>)}
      </section>
    </>
  )
}
