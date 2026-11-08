import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { fcfa } from '../../lib/utils'
import { STATUS } from '../../lib/config'

export default function AdminStats() {
  const [orders, setOrders] = useState(null)
  useEffect(() => { supabase.from('orders').select('total, status, created_at, order_items(product_name, quantity, unit_price)').then(({ data }) => setOrders(data || [])) }, [])
  if (!orders) return <p className="text-white/60">Chargement…</p>
  const sold = orders.filter((o) => ['confirmed', 'shipped', 'delivered'].includes(o.status))
  const revenue = sold.reduce((s, o) => s + o.total, 0)
  const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0)
  const monthRev = sold.filter((o) => new Date(o.created_at) >= month).reduce((s, o) => s + o.total, 0)
  const top = {}
  sold.forEach((o) => o.order_items.forEach((i) => { top[i.product_name] = (top[i.product_name] || 0) + i.quantity }))
  const ranking = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const Card = ({ t, v }) => <div className="border border-white/15 p-4"><p className="text-white/60 text-sm">{t}</p><p className="text-3xl text-gold font-display italic font-extrabold">{v}</p></div>
  return (
    <div>
      <h1 className="text-4xl mb-4">Statistiques</h1>
      <p className="text-sm text-white/60 mb-3">Le chiffre d’affaires compte les commandes confirmées, expédiées et livrées.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card t="Chiffre d’affaires" v={fcfa(revenue)} /><Card t="Ce mois-ci" v={fcfa(monthRev)} />
        <Card t="Commandes au total" v={orders.length} /><Card t="À traiter" v={orders.filter((o) => o.status === 'pending').length} />
      </div>
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <div><h2 className="text-2xl mb-2">Par statut</h2><ul>{Object.entries(STATUS).map(([k, v]) => <li key={k} className="flex justify-between border-b border-white/10 py-1.5"><span>{v}</span><span>{orders.filter((o) => o.status === k).length}</span></li>)}</ul></div>
        <div><h2 className="text-2xl mb-2">Maillots les plus vendus</h2>{ranking.length === 0 ? <p className="text-white/60">Pas encore de ventes.</p> : <ul>{ranking.map(([n, q]) => <li key={n} className="flex justify-between border-b border-white/10 py-1.5"><span>{n}</span><span>{q}</span></li>)}</ul>}</div>
      </div>
    </div>
  )
}
