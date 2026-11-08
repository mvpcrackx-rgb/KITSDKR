import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminLayout() {
  const { session, isAdmin, loading, signOut } = useAuth()
  if (loading) return <p className="p-10 text-white/60">Chargement…</p>
  if (!session || !isAdmin) return <Navigate to="/admin/login" replace />
  const tab = ({ isActive }) => `px-4 py-2 border-b-2 ${isActive ? 'border-gold text-gold' : 'border-transparent text-white/70'}`
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <img src="/logo.png" alt="KITS DKR" className="h-14" />
        <div className="flex gap-3 items-center"><a href="/" className="text-white/60 hover:text-gold text-sm">Voir la boutique</a><button className="btn btn-line !py-2" onClick={signOut}>Déconnexion</button></div>
      </div>
      <nav className="flex gap-2 border-b border-white/10 mt-4 mb-6 overflow-x-auto">
        <NavLink end to="/admin" className={tab}>Produits</NavLink>
        <NavLink to="/admin/commandes" className={tab}>Commandes</NavLink>
        <NavLink to="/admin/statistiques" className={tab}>Statistiques</NavLink>
      </nav>
      <Outlet />
    </div>
  )
}
