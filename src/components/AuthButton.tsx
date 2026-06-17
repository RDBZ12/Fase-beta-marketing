import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setCargando(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const iniciarSesionConGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) console.error('Error al iniciar sesión:', error.message)
  }

  const cerrarSesion = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Error al cerrar sesión:', error.message)
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 px-4">
      <div className="mb-10 text-center">
        <span className="text-xs font-semibold tracking-[0.25em] text-indigo-400 uppercase">SmartMarketing</span>
        <h1 className="mt-2 text-3xl font-bold text-white tracking-tight">AI Platform</h1>
      </div>
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">
        {user ? (
          <div className="flex flex-col items-center gap-5">
            <img
              src={user.user_metadata?.avatar_url ?? `https://ui-avatars.com/api/?name=${user.email}`}
              alt="Avatar"
              className="w-14 h-14 rounded-full ring-2 ring-indigo-500"
            />
            <div className="text-center">
              <p className="text-white font-medium">{user.user_metadata?.full_name ?? 'Usuario'}</p>
              <p className="text-gray-400 text-sm mt-0.5">{user.email}</p>
            </div>
            <button
              onClick={cerrarSesion}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-all duration-150"
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <h2 className="text-white text-lg font-semibold">Bienvenido</h2>
              <p className="text-gray-400 text-sm mt-1">Accede con tu cuenta de Google para continuar</p>
            </div>
            <button
              onClick={iniciarSesionConGoogle}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl font-medium text-sm bg-white text-gray-800 hover:bg-gray-100 active:scale-[0.98] transition-all duration-150 shadow-sm"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.99 3.47 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </button>
            <p className="text-gray-600 text-xs text-center">
              Al continuar, aceptas nuestros términos de servicio.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
