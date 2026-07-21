import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { User } from '@supabase/supabase-js'

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [cargando, setCargando] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorLogin, setErrorLogin] = useState('')
  const [loadingLogin, setLoadingLogin] = useState(false)

  const [showAdminForm, setShowAdminForm] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('error_description')) {
      const params = new URLSearchParams(hash.replace('#', '?'))
      setErrorLogin(params.get('error_description') || 'Error desconocido de autenticación.')
    }

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
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' },
        scopes: 'openid profile email https://www.googleapis.com/auth/gmail.send',
      },
    })
    if (error) console.error('Error al iniciar sesión:', error.message)
  }

  const iniciarSesionConPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorLogin('')
    setLoadingLogin(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setErrorLogin('Correo o contraseña incorrectos')
    }
    setLoadingLogin(false)
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[radial-gradient(120%_120%_at_20%_0%,_#3A28B8_0%,_#1D1266_45%,_#0E0A32_100%)]">
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 py-10 bg-[radial-gradient(120%_120%_at_20%_0%,_#3A28B8_0%,_#1D1266_45%,_#0E0A32_100%)] font-['Inter',_sans-serif]">
      <style dangerouslySetInnerHTML={{ __html: "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@500;700;800&display=swap');" }} />

      {/* Blobs de fondo, estilo glass */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[80px] -left-[140px] h-[300px] w-[420px] rounded-[45%_55%_60%_40%/50%_45%_55%_50%] bg-[linear-gradient(135deg,#4CD9E8,#2E6FE0)] opacity-[0.55] blur-[2px] motion-safe:animate-[float_14s_ease-in-out_infinite]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[40px] left-[6%] h-[260px] w-[340px] rounded-[45%_55%_60%_40%/50%_45%_55%_50%] bg-[linear-gradient(135deg,#6A5CF2,#3A2A9C)] opacity-[0.4] blur-[2px] motion-safe:animate-[float_14s_ease-in-out_infinite_-4s]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[100px] -right-[100px] h-[300px] w-[380px] rounded-[45%_55%_60%_40%/50%_45%_55%_50%] bg-[linear-gradient(135deg,#7B8CF5,#4A5FD9)] opacity-[0.55] blur-[2px] motion-safe:animate-[float_14s_ease-in-out_infinite_-8s]"
      />

      {/* Card de vidrio */}
      <div className="relative z-10 w-full max-w-[400px] rounded-[24px] border border-[rgba(255,255,255,0.22)] bg-[rgba(255,255,255,0.09)] px-[36px] pb-[32px] pt-[40px] shadow-[0_20px_60px_rgba(10,6,40,0.45)] backdrop-blur-[22px]">
        {user ? (
          <div className="flex flex-col items-center gap-[20px]">
            <img
              src={user.user_metadata?.avatar_url ?? `https://ui-avatars.com/api/?name=${user.email}`}
              alt="Avatar"
              className="w-[56px] h-[56px] rounded-full ring-2 ring-[#33D9C7]"
            />
            <div className="text-center">
              <p className="text-white font-medium text-[15px]">{user.user_metadata?.full_name ?? 'Usuario'}</p>
              <p className="text-[rgba(255,255,255,0.62)] text-[13px] mt-[2px]">{user.email}</p>
            </div>
            <button
              onClick={cerrarSesion}
              className="w-full mt-[8px] rounded-[12px] bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.18)] px-[16px] py-[11px] text-[13.5px] font-medium text-[rgba(255,255,255,0.85)] transition-colors duration-150 ease-in-out hover:bg-[rgba(255,255,255,0.12)]"
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <>
            <div className="mb-[26px] flex flex-col items-center gap-[10px]">
              <div
                className="h-[46px] w-[46px] rounded-full"
                style={{
                  background: 'conic-gradient(from 210deg, #33D9C7, #3A6BE0, #33D9C7)',
                  WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px))',
                  mask: 'radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px))',
                }}
              />
              <span className="font-['Manrope',_sans-serif] text-[15px] font-extrabold tracking-[0.04em] text-white">MARKETIA</span>
            </div>

            <h1 className="mb-1 font-['Manrope',_sans-serif] text-[22px] font-bold text-white">Bienvenido</h1>
            <p className="mb-6 text-[13px] leading-[1.5] text-[rgba(255,255,255,0.62)]">
              Accede a tu panel de campañas y marketing con IA.
            </p>

            {errorLogin && (
              <p className="mb-4 rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2 text-[13px] text-red-200">
                {errorLogin}
              </p>
            )}

            <button
              onClick={iniciarSesionConGoogle}
              className="flex w-full items-center justify-center gap-[10px] rounded-[12px] bg-white px-[16px] py-[13px] text-[14.5px] font-semibold text-[#1D1B33] transition-all duration-150 ease-in-out hover:-translate-y-[1px] hover:shadow-[0_8px_20px_rgba(0,0,0,0.25)] active:translate-y-0 disabled:opacity-60"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.98v2.33A9 9 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.95 10.71A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.71V4.96H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.04l2.97-2.33z" />
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.96l2.97 2.33C4.66 5.16 6.65 3.58 9 3.58z" />
              </svg>
              Continuar con Google
            </button>

            <div className="mt-[22px] mb-[18px] flex items-center gap-[12px]">
              <span className="h-px flex-1 bg-[rgba(255,255,255,0.16)]" />
              <span className="whitespace-nowrap text-[12px] text-[rgba(255,255,255,0.45)]">acceso interno</span>
              <span className="h-px flex-1 bg-[rgba(255,255,255,0.16)]" />
            </div>

            <button
              onClick={() => setShowAdminForm((v) => !v)}
              className="flex w-full items-center justify-center gap-[8px] rounded-[12px] border border-[rgba(255,255,255,0.22)] bg-transparent px-[16px] py-[11px] text-[13.5px] font-medium text-[rgba(255,255,255,0.85)] transition-colors duration-150 ease-in-out hover:bg-[rgba(255,255,255,0.06)]"
            >
              Soy administrador
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                className={`transition-transform duration-250 ease-in-out ${showAdminForm ? 'rotate-180' : ''}`}
              >
                <path d="M2.5 4.5L6 8l3.5-3.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div
              className={`overflow-hidden transition-all duration-350 ease-in-out ${
                showAdminForm ? 'mt-[18px] max-h-[320px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <form onSubmit={iniciarSesionConPassword}>
                <div className="mb-[14px]">
                  <label htmlFor="email" className="mb-[6px] block text-[12.5px] text-[rgba(255,255,255,0.65)]">Correo</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@marketia.com"
                    className="w-full rounded-[10px] border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] px-[13px] py-[11px] text-[14px] text-white outline-none transition-all duration-150 ease-in-out placeholder:text-[rgba(255,255,255,0.35)] focus:border-[#33D9C7] focus:bg-[rgba(255,255,255,0.12)]"
                  />
                </div>
                <div className="mb-[14px]">
                  <label htmlFor="password" className="mb-[6px] block text-[12.5px] text-[rgba(255,255,255,0.65)]">Contraseña</label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-[10px] border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] px-[13px] py-[11px] text-[14px] text-white outline-none transition-all duration-150 ease-in-out placeholder:text-[rgba(255,255,255,0.35)] focus:border-[#33D9C7] focus:bg-[rgba(255,255,255,0.12)]"
                  />
                </div>
                <div className="mb-[18px] flex justify-end">
                  <a href="/recuperar" className="text-[12.5px] text-[#6FE3D6] no-underline hover:underline">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <button
                  type="submit"
                  disabled={loadingLogin}
                  className="w-full rounded-[12px] bg-[linear-gradient(135deg,#4A3FD1,#3A2AAE)] px-[16px] py-[13px] text-[14.5px] font-semibold text-white transition-all duration-150 ease-in-out hover:brightness-110 disabled:opacity-60"
                >
                  {loadingLogin ? 'Ingresando...' : 'Iniciar sesión'}
                </button>
              </form>
            </div>

            <p className="mt-[22px] text-center text-[12.5px] text-[rgba(255,255,255,0.45)]">
              MarketIA · Marketing inteligente con IA
            </p>
          </>
        )}
      </div>
    </div>
  )
}
