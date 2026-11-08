import { createContext, useContext, useEffect, useState } from 'react'

const Ctx = createContext(null)
const KEY = 'kitsdkr-cart-v1'
// Le panier ne garde que id/taille/quantité : les prix sont toujours relus depuis la base.
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] } })
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)) } catch {} }, [items])
  const same = (a, id, size) => a.productId === id && a.size === size
  const add = (productId, size, quantity = 1) => setItems((l) => l.some((x) => same(x, productId, size))
    ? l.map((x) => same(x, productId, size) ? { ...x, quantity: Math.min(x.quantity + quantity, 20) } : x)
    : [...l, { productId, size, quantity }])
  const setQty = (productId, size, q) => setItems((l) => l.map((x) => same(x, productId, size) ? { ...x, quantity: Math.max(1, Math.min(20, q)) } : x))
  const remove = (productId, size) => setItems((l) => l.filter((x) => !same(x, productId, size)))
  const clear = () => setItems([])
  const count = items.reduce((s, i) => s + i.quantity, 0)
  return <Ctx.Provider value={{ items, add, setQty, remove, clear, count }}>{children}</Ctx.Provider>
}
export const useCart = () => useContext(Ctx)
