import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { configured } from '../lib/supabase'
import { WHATSAPP } from '../lib/config'

const links = [['/boutique', 'Boutique'], ['/boutique?cat=club', 'Clubs'], ['/boutique?cat=national', 'Sélections'], ['/livraison', 'Livraison']]

export default function Layout() {
  const { count } = useCart()
  const [open, setOpen] = useState(false)
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur border-b border-gold/30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" onClick={() => setOpen(false)}><img src="/logo.png" alt="KITS DKR" className="h-12 w-auto" /></Link>
          <nav className="hidden md:flex gap-8 font-medium">
            {links.map(([to, label]) => <NavLink key={label} to={to} className="text-white/80 hover:text-gold">{label}</NavLink>)}
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/panier" className="btn btn-line !px-4 !py-2" aria-label="Panier">Panier ({count})</Link>
            <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d={open ? 'M5 5l14 14M19 5L5 19' : 'M3 7h18M3 12h18M3 17h18'} /></svg>
            </button>
          </div>
        </div>
        {open && <nav className="md:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-3">
          {links.map(([to, label]) => <Link key={label} to={to} onClick={() => setOpen(false)} className="py-1">{label}</Link>)}
        </nav>}
      </header>
      {!configured && <p className="bg-gold text-black text-center text-sm py-2 px-4">Supabase n’est pas configuré : renseignez le fichier .env (voir README).</p>}
      <main className="flex-1"><Outlet /></main>
      <footer className="border-t border-gold/30 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-10 grid gap-6 md:grid-cols-3 text-sm text-white/70">
          <div><img src="/logo.png" alt="" className="h-14 mb-3" /><p>Maillots de football, clubs et sélections nationales, livrés partout au Sénégal.</p></div>
          <div className="flex flex-col gap-2"><Link to="/boutique" className="hover:text-gold">Boutique</Link><Link to="/livraison" className="hover:text-gold">Livraison</Link><Link to="/panier" className="hover:text-gold">Panier</Link></div>
          <div>{WHATSAPP && <a className="btn btn-gold" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">Nous écrire sur WhatsApp</a>}<p className="mt-4">© {new Date().getFullYear()} KITS DKR</p></div>
        </div>
      </footer>
    </div>
  )
}
