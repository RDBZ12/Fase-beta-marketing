import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';
import { Settings, User, Shield, Globe, KeyRound, Save, Loader2, CheckCircle } from 'lucide-react';

export const AjustesModule: React.FC = () => {
  const { profile, refetch, isAdmin } = useUser();
  const [nombre, setNombre]       = useState(profile?.nombre ?? '');
  const [apellido, setApellido]   = useState(profile?.apellido ?? '');
  const [telefono, setTelefono]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [activeSection, setActiveSection] = useState<'perfil' | 'seguridad' | 'redes' | 'api'>('perfil');

  const handleSavePerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      await supabase.from('usuarios').update({ nombre, apellido, telefono: telefono || null }).eq('id_usuario', profile.id_usuario);
      setSaved(true);
      refetch();
      setTimeout(() => setSaved(false), 3000);
    } catch { /* silently fail */ }
    finally { setSaving(false); }
  };

  const sections = [
    { id: 'perfil',    label: 'Mi Perfil',       icon: User },
    { id: 'seguridad', label: 'Seguridad',        icon: Shield },
    { id: 'redes',     label: 'Redes Sociales',  icon: Globe },
    ...(isAdmin ? [{ id: 'api', label: 'API Keys', icon: KeyRound }] : []),
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-600" /> Ajustes
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Configuración de tu cuenta y del sistema</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar */}
        <div className="w-full lg:w-52 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2">
            {sections.map(s => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <button key={s.id} onClick={() => setActiveSection(s.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${active ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                  <Icon className="w-4 h-4" /> {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile */}
          {activeSection === 'perfil' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Información de Perfil</h3>
                <p className="text-xs text-slate-400 mt-0.5">Actualiza tus datos personales</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-black text-xl">
                  {profile?.nombre.charAt(0)}{profile?.apellido.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{profile?.nombre} {profile?.apellido}</p>
                  <p className="text-xs text-slate-400">{profile?.correo}</p>
                  <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">{profile?.nombre_rol}</span>
                </div>
              </div>
              <form onSubmit={handleSavePerfil} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre</label>
                    <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Apellido</label>
                    <input type="text" value={apellido} onChange={e => setApellido(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Teléfono</label>
                  <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="809-000-0000"
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Correo</label>
                  <input type="email" value={profile?.correo ?? ''} disabled
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded-xl opacity-60 cursor-not-allowed" />
                  <p className="text-[10px] text-slate-400 mt-1">El correo se gestiona desde Supabase Auth</p>
                </div>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors disabled:opacity-60">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar Cambios'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Security */}
          {activeSection === 'seguridad' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Seguridad</h3>
                <p className="text-xs text-slate-400 mt-0.5">Gestión de contraseña y sesiones</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-700 mb-1">Cambiar contraseña</p>
                <p className="text-[11px] text-blue-600">Para cambiar tu contraseña, ve a tu correo y usa la opción "Restablecer contraseña" desde el panel de Supabase, o utiliza el siguiente botón:</p>
              </div>
              <button
                onClick={async () => {
                  if (!profile?.correo) return;
                  await supabase.auth.resetPasswordForEmail(profile.correo);
                  alert('Se envió un correo para restablecer tu contraseña.');
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
                <Shield className="w-3.5 h-3.5" /> Enviar correo de restablecimiento
              </button>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-slate-700">Niveles de acceso del sistema</p>
                {[
                  { n: 'Administrador', d: 'Acceso total al sistema' },
                  { n: 'Gerencia', d: 'Consultar y aprobar campañas' },
                  { n: 'Marketing', d: 'Crear y gestionar campañas' },
                  { n: 'Community Manager', d: 'Publicaciones y redes sociales' },
                  { n: 'Servicio al Cliente', d: 'Leads y consultas' },
                ].map((r, i) => (
                  <div key={r.n} className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 w-4">{i + 1}</span>
                    <span className="text-[10px] font-bold text-slate-700">{r.n}</span>
                    <span className="text-[10px] text-slate-400">— {r.d}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Networks */}
          {activeSection === 'redes' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Redes Sociales</h3>
                <p className="text-xs text-slate-400 mt-0.5">Plataformas configuradas en el sistema</p>
              </div>
              <RedesSocialesConfig />
            </div>
          )}

          {/* API Config (Admin only) */}
          {activeSection === 'api' && isAdmin && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Configuración de APIs</h3>
                <p className="text-xs text-slate-400 mt-0.5">Las API keys se configuran en Supabase Edge Functions Secrets</p>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'GEMINI_API_KEY', desc: 'Google Gemini AI — Generador de contenido y chatbot', url: 'https://aistudio.google.com/app/apikey', color: 'text-blue-600 bg-blue-50 border-blue-100' },
                  { name: 'PAYPAL_CLIENT_ID', desc: 'PayPal Sandbox — Procesamiento de pagos', url: 'https://developer.paypal.com', color: 'text-amber-600 bg-amber-50 border-amber-100' },
                  { name: 'PAYPAL_CLIENT_SECRET', desc: 'PayPal Secret — No exponer nunca en el frontend', url: 'https://developer.paypal.com', color: 'text-amber-600 bg-amber-50 border-amber-100' },
                ].map(k => (
                  <div key={k.name} className={`border rounded-xl p-4 ${k.color}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black font-mono">{k.name}</p>
                      <a href={k.url} target="_blank" rel="noreferrer"
                        className="text-[10px] font-bold underline opacity-70 hover:opacity-100">Obtener clave →</a>
                    </div>
                    <p className="text-[10px] mt-1 opacity-80">{k.desc}</p>
                    <p className="text-[10px] mt-2 opacity-60 font-mono">supabase secrets set {k.name}=tu_clave_aqui</p>
                  </div>
                ))}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-700 mb-2">Cómo configurar:</p>
                  <ol className="text-[11px] text-slate-500 space-y-1 list-decimal list-inside">
                    <li>Ve a tu proyecto en supabase.com</li>
                    <li>Menú → Edge Functions → Secrets</li>
                    <li>Agrega cada variable con el nombre exacto</li>
                    <li>Redeploya las funciones para que tomen efecto</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Redes Sociales config sub-component ─────────────────────────────────────
const RedesSocialesConfig: React.FC = () => {
  const [redes, setRedes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('redes_sociales').select('*').order('id_red').then(({ data }) => {
      setRedes(data ?? []);
      setLoading(false);
    });
  }, []);

  const toggle = async (id: number, estado: string) => {
    const nuevo = estado === 'activo' ? 'inactivo' : 'activo';
    await supabase.from('redes_sociales').update({ estado: nuevo }).eq('id_red', id);
    setRedes(prev => prev.map(r => r.id_red === id ? { ...r, estado: nuevo } : r));
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></div>;

  return (
    <div className="space-y-2">
      {redes.map(r => (
        <div key={r.id_red} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
          <div>
            <p className="text-xs font-bold text-slate-700">{r.nombre_red}</p>
            <p className="text-[10px] text-slate-400">{r.url || 'Sin URL'}</p>
          </div>
          <button onClick={() => toggle(r.id_red, r.estado)}
            className={`text-[10px] font-bold px-3 py-1 rounded-full transition-colors ${r.estado === 'activo' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}>
            {r.estado === 'activo' ? 'Activa' : 'Inactiva'}
          </button>
        </div>
      ))}
    </div>
  );
};
