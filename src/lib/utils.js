import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export const fcfa = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`
export const inStock = (p) => (p.product_sizes || []).some((s) => s.stock > 0)

// Produits visibles au public (la RLS ne renvoie que les produits actifs)
export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.from('products').select('*, product_sizes(size, stock)').eq('active', true).order('created_at', { ascending: false })
      .then(({ data, error }) => { if (error) setError(error.message); else setProducts(data || []); setLoading(false) })
  }, [])
  return { products, loading, error }
}
