import { DELIVERY, WHATSAPP } from '../lib/config'

export default function Delivery() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-5xl mb-8">Livraison au Sénégal</h1>
      <div className="space-y-6">{DELIVERY.map((d) => <div key={d.title} className="border-l-2 border-gold pl-4"><h2 className="text-2xl">{d.title}</h2><p className="text-white/75 mt-1">{d.text}</p></div>)}</div>
      <h2 className="text-3xl mt-12 mb-3">Comment commander</h2>
      <p className="text-white/75">Choisissez vos maillots et vos tailles, validez le panier, puis envoyez votre commande sur WhatsApp. Nous confirmons la disponibilité, le total et la livraison avec vous.</p>
      {WHATSAPP && <a className="btn btn-gold mt-6" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">Poser une question sur WhatsApp</a>}
    </div>
  )
}
