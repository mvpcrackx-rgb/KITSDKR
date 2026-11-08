import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { fcfa } from '../../lib/utils'
import { STATUS } from '../../lib/config'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('')
  const load = () => supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).then(({ data }) => setOrders(data || []))
  useEffect(() => { load() }, [])
  const setStatus = async (id, status) => { const { error } = await supabase.from('orders').update({ status }).eq('id', id); if (error) alert(error.message); load() }
  const shown = orders.filter((o) => !filter || o.status === filter)
  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2"><h1 className="text-4xl">Commandes ({shown.length})</h1>
        <select className="input !w-auto" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtrer par statut"><option value="">Tous les statuts</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      {shown.length === 0 && <p className="border border-dashed border-white/20 p-8 text-center text-white/70">Aucune commande.</p>}
      <div className="space-y-3">{shown.map((o) => (
        <div key={o.id} className="border border-white/15 p-4">
          <div className="flex justify-between gap-3 flex-wrap">
            <div><p className="font-semibold">Commande n°{o.number} · {o.customer_name}</p>
              <p className="text-sm text-white/60">{new Date(o.created_at).toLocaleString('fr-FR')} · <a className="text-gold" href={`https://wa.me/${o.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">{o.phone}</a></p>
              {o.address && <p className="text-sm text-white/60">{o.address}</p>}{o.notes && <p className="text-sm text-white/60">Remarque : {o.notes}</p>}</div>
            <div className="text-right"><p className="text-gold text-xl font-semibold">{fcfa(o.total)}</p>
              <select className="input !w-auto mt-1" value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} aria-label="Statut">{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          </div>
          <ul className="mt-3 text-sm text-white/80 border-t border-white/10 pt-2">{o.order_items.map((i) => <li key={i.id}>{i.quantity} × {i.product_name} · taille {i.size} · {fcfa(i.unit_price)}</li>)}</ul>
        </div>))}</div>
    </div>
  )
}
