// Informations modifiables de la boutique. Aucun prix ni délai inventé : complétez selon vos conditions réelles.
export const WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER || ''

export const DELIVERY = [
  { title: 'Dakar et banlieue', text: 'Livraison à domicile ou point de rendez-vous, à convenir avec nous sur WhatsApp.' },
  { title: 'Autres régions du Sénégal', text: 'Envoi par transporteur vers votre ville. Les frais et délais vous sont communiqués à la confirmation.' },
  { title: 'Paiement', text: 'Le paiement et le montant de la livraison sont confirmés avec vous sur WhatsApp avant l’envoi.' },
]

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL']
export const VERSIONS = ['Fan', 'Player', 'Rétro', 'Enfant']
export const STATUS = { pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée' }
