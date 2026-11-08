import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { fcfa } from '../lib/utils'
import { WHATSAPP } from '../lib/config'

export default function Cart() {
  const { items, setQty, remove, clear } = useCart()
  const [products, setProducts] = useState({})
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)

  // Prix toujours relus depuis la base (jamais depuis le navigateur)
  useEffect(() => {
    const ids = [...new Set(items.map((i) => i.productId))]
    if (!supabase || ids.length === 0) return
    supabase.from('products').select('id, name, version, price, images').in('id', ids)
      .then(({ data }) => setProducts(Object.fromEntries((data || []).map((p) => [p.id, p]))))
  }, [items.length])

  const lines = items.map((i) => ({ ...i, p: products[i.productId] })).filter((l) => l.p)
  const total = lines.reduce((s, l) => s + l.p.price * l.quantity, 0)
  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError(''); setBusy(true)
    const { data, error } = await supabase.rpc('place_order', {
      p_name: form.name, p_phone: form.phone, p_address: form.address, p_notes: form.notes,
      p_items: lines.map((l) => ({ product_id: l.productId, size: l.size, quantity: l.quantity })),
    })
    setBusy(false)
    if (error) return setError(error.message)
    const { o_number, o_total } = Array.isArray(data) ? data[0] : data
    const msg = [`Bonjour KITS DKR, je confirme ma commande n°${o_number} :`,
      ...lines.map((l) => `- ${l.p.name} (${l.p.version}), taille ${l.size} x${l.quantity} : ${fcfa(l.p.price * l.quantity)}`),
      `Total : ${fcfa(o_total)}`, `Nom : ${form.name}`, `Téléphone : ${form.phone}`,
      form.address && `Adresse : ${form.address}`, form.notes && `Remarque : ${form.notes}`].filter(Boolean).join('\n')
    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`
    clear(); setDone({ n: o_number, url })
    window.location.href = url
  }

  if (done) return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <h1 className="text-5xl">Commande n°{done.n} enregistrée</h1>
      <p className="text-white/75 mt-4">Envoyez le message WhatsApp pour que nous la confirmions avec vous.</p>
      <a href={done.url} className="btn btn-gold mt-6">Ouvrir WhatsApp</a>
    </div>)

  if (items.length === 0) return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center"><h1 className="text-5xl">Votre panier est vide</h1><Link to="/boutique" className="btn btn-gold mt-6">Voir les maillots</Link></div>)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-5 gap-10">
      <div className="md:col-span-3">
        <h1 className="text-5xl mb-6">Panier</h1>
        <ul className="divide-y divide-white/10 border-y border-white/10">
          {lines.map((l) => (
            <li key={l.productId + l.size} className="flex gap-3 py-4">
              <div className="w-20 h-24 bg-ink shrink-0">{l.p.images?.[0] && <img src={l.p.images[0]} alt="" className="w-full h-full object-cover" />}</div>
              <div className="flex-1">
                <p className="font-semibold">{l.p.name}</p>
                <p className="text-sm text-white/60">{l.p.version} · Taille {l.size}</p>
                <div className="flex items-center gap-2 mt-2">
                  <input type="number" min="1" max="20" className="input !w-16 !py-1" value={l.quantity} onChange={(e) => setQty(l.productId, l.size, +e.target.value || 1)} aria-label="Quantité" />
                  <button className="text-sm text-white/60 hover:text-gold" onClick={() => remove(l.productId, l.size)}>Retirer</button>
                </div>
              </div>
              <p className="text-gold font-semibold">{fcfa(l.p.price * l.quantity)}</p>
            </li>))}
        </ul>
        <p className="text-right text-2xl mt-4">Total : <span className="text-gold font-semibold">{fcfa(total)}</span></p>
        <p className="text-sm text-white/60 text-right">Livraison non incluse, confirmée sur WhatsApp.</p>
      </div>
      <form onSubmit={submit} className="md:col-span-2 space-y-4 border border-gold/40 p-5 h-fit">
        <h2 className="text-3xl">Vos informations</h2>
        <div><label className="label" htmlFor="n">Nom complet</label><input id="n" className="input" required minLength={2} value={form.name} onChange={upd('name')} /></div>
        <div><label className="label" htmlFor="t">Téléphone</label><input id="t" className="input" type="tel" required minLength={6} value={form.phone} onChange={upd('phone')} /></div>
        <div><label className="label" htmlFor="a">Adresse de livraison (quartier, ville)</label><input id="a" className="input" required value={form.address} onChange={upd('address')} /></div>
        <div><label className="label" htmlFor="r">Remarque (facultatif)</label><textarea id="r" className="input" rows="2" value={form.notes} onChange={upd('notes')} /></div>
        {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}
        {!WHATSAPP && <p className="text-gold text-sm">Numéro WhatsApp non configuré (VITE_WHATSAPP_NUMBER).</p>}
        <button className="btn btn-gold w-full" disabled={busy || lines.length === 0 || !WHATSAPP}>{busy ? 'Envoi…' : 'Commander sur WhatsApp'}</button>
      </form>
    </div>
  )
}
