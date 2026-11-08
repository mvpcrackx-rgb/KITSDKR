
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminLogin() {
  const { signIn, signOut, session, isAdmin, loading } = useAuth()
  const [f, setF] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  if (!loading && session && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  async function submit(e) {
    e.preventDefault()
    setError('')

    const { error } = await signIn(f.email.trim(), f.password)

    if (error) {
      console.error('Erreur Supabase :', error)
      setError(error.message)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 border border-gold/40 p-6">
        <img src="/logo.png" alt="KITS DKR" className="h-20 mx-auto" />
        <h1 className="text-3xl text-center">Espace administrateur</h1>

        <div>
          <label className="label" htmlFor="e">E-mail</label>
          <input
            id="e"
            className="input"
            type="email"
            required
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
          />
        </div>

        <div>
          <label className="label" htmlFor="p">Mot de passe</label>
          <input
            id="p"
            className="input"
            type="password"
            required
            value={f.password}
            onChange={(e) => setF({ ...f, password: e.target.value })}
          />
        </div>

        {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}

        {session && !loading && !isAdmin && (
          <p className="text-red-400 text-sm">
            Ce compte n'a pas accès à l'administration.
            <button type="button" className="underline" onClick={signOut}>
              Se déconnecter
            </button>
          </p>
        )}

        <button className="btn btn-gold w-full">Se connecter</button>
      </form>
    </div>
  )
}
