import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';
import { 
  Settings, User, Shield, Globe, KeyRound, Save, Loader2, CheckCircle,
  MessageSquare, AlertCircle, RefreshCw, Play, Square, ExternalLink,
  Database, Download, Upload, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { logSystemEvent } from '../lib/logger';
import {
  getOpenWASettings,
  saveOpenWASettings,
  getOpenWASessions,
  createOpenWASession,
  startOpenWASession,
  stopOpenWASession
} from '../lib/whatsapp';
import type { OpenWASession } from '../lib/whatsapp';

export const AjustesModule: React.FC = () => {
  const { profile, refetch, isAdmin } = useUser();
  const [nombre, setNombre]       = useState(profile?.nombre ?? '');
  const [apellido, setApellido]   = useState(profile?.apellido ?? '');
  const [telefono, setTelefono]   = useState(profile?.telefono ?? '');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [activeSection, setActiveSection] = useState<'perfil' | 'seguridad' | 'redes' | 'api'>('perfil');

  useEffect(() => {
    if (profile) {
      setNombre(profile.nombre ?? '');
      setApellido(profile.apellido ?? '');
      setTelefono(profile.telefono ?? '');
    }
  }, [profile]);

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

              <hr className="border-slate-100 my-4" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Integración con Gmail</h3>
                <p className="text-xs text-slate-500 mt-1 mb-3">Conecta tu cuenta de Google para enviar notificaciones automáticas de las publicaciones desde tu propio correo.</p>
                <button
                  onClick={async () => {
                    await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: {
                        redirectTo: window.location.origin,
                        queryParams: { access_type: 'offline', prompt: 'consent' },
                        scopes: 'openid profile email https://www.googleapis.com/auth/gmail.send',
                      },
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.99 3.47 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Conectar Gmail
                </button>
              </div>
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

              <DatabaseBackupRestore />
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
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Redes Sociales</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Plataformas configuradas en el sistema</p>
                </div>
                <RedesSocialesConfig />
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <WhatsAppGatewayConfig />
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <TelegramGatewayConfig />
              </div>
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

// ─── Componente de Ajustes de WhatsApp / OpenWA ───────────────────────────────
const WhatsAppGatewayConfig: React.FC = () => {
  const settings = getOpenWASettings();
  const [apiUrl, setApiUrl] = useState(settings.apiUrl);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [sessionName, setSessionName] = useState(settings.sessionName);
  
  const [, setSessions] = useState<OpenWASession[]>([]);
  const [currentSession, setCurrentSession] = useState<OpenWASession | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSessionStatus = async () => {
    setChecking(true);
    setErrorMsg('');
    try {
      const list = await getOpenWASessions();
      setSessions(list);
      const found = list.find(s => s.name === sessionName);
      setCurrentSession(found || null);
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo conectar al servidor OpenWA. Asegúrate de que esté corriendo en el puerto configurado.');
      setCurrentSession(null);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    fetchSessionStatus();
  }, [sessionName]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    saveOpenWASettings(apiUrl, apiKey, sessionName);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
    fetchSessionStatus();
  };

  const handleCreateAndStart = async () => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      let targetSession = currentSession;
      if (!targetSession) {
        targetSession = await createOpenWASession(sessionName);
      }
      if (!['ready', 'qr_ready', 'initializing', 'authenticating'].includes(targetSession.status)) {
        await startOpenWASession(targetSession.id);
      }
      await fetchSessionStatus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar la sesión.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    if (!currentSession) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      await stopOpenWASession(currentSession.id);
      await fetchSessionStatus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al detener la sesión.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: OpenWASession['status']) => {
    switch (status) {
      case 'ready':
        return <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-bold">Conectado (Listo)</span>;
      case 'qr_ready':
        return <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-bold animate-pulse">Esperando QR (Escanea en Dashboard)</span>;
      case 'initializing':
      case 'authenticating':
        return <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-bold animate-pulse">Iniciando...</span>;
      case 'disconnected':
        return <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-bold">Desconectado</span>;
      case 'failed':
        return <span className="bg-rose-100 text-rose-700 text-xs px-2.5 py-1 rounded-full font-bold font-mono">Fallo en Conexión</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-bold font-mono">Creado (Detenido)</span>;
    }
  };

  const inputCls = 'w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500';
  const labelCls = 'block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Pasarela de WhatsApp (OpenWA)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Controla y monitorea tu automatización de WhatsApp.</p>
          </div>
        </div>
        <button
          onClick={fetchSessionStatus}
          disabled={checking}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
          Comprobar Estado
        </button>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex gap-3 text-xs text-rose-600">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Info de Estado */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado de la Sesión</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs font-black font-mono text-slate-700">[{sessionName}]</p>
            {currentSession ? getStatusBadge(currentSession.status) : <span className="bg-slate-100 text-slate-500 text-xs px-2.5 py-1 rounded-full font-bold">No creada</span>}
          </div>
          {currentSession?.phone && (
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Vinculado a: <strong className="text-slate-700">+{currentSession.phone}</strong>
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-2">
          {(!currentSession || currentSession.status === 'disconnected' || currentSession.status === 'created' || currentSession.status === 'failed') ? (
            <button
              onClick={handleCreateAndStart}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              {currentSession ? 'Iniciar Sesión' : 'Crear e Iniciar'}
            </button>
          ) : (
            <button
              onClick={handleStop}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
              Detener Sesión
            </button>
          )}
          
          <a
            href="http://localhost:2886"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir Dashboard QR
          </a>
        </div>
      </div>

      {currentSession?.status === 'qr_ready' && (
        <div className="bg-amber-50 border border-amber-100 text-amber-800 rounded-xl p-4 text-xs space-y-2">
          <p className="font-bold">⚠️ Vinculación requerida:</p>
          <p>Tu sesión de WhatsApp está lista para vincularse pero aún no tiene una cuenta asociada. Por favor, realiza lo siguiente:</p>
          <ol className="list-decimal list-inside space-y-1 ml-1">
            <li>Haz clic en el botón de arriba **"Abrir Dashboard QR"** o visita <a href="http://localhost:2886" target="_blank" rel="noopener noreferrer" className="underline font-bold">http://localhost:2886</a>.</li>
            <li>En esa página, escanea el código QR utilizando tu teléfono móvil (ve a WhatsApp → Dispositivos Vinculados → Vincular Dispositivo).</li>
            <li>Una vez escaneado, el estado aquí cambiará a **Conectado**.</li>
          </ol>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSave} className="space-y-4 pt-2 border-t border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>URL de API de OpenWA</label>
            <input
              type="url"
              required
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
              placeholder="http://localhost:2785/api"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Nombre de Sesión</label>
            <input
              type="text"
              required
              value={sessionName}
              onChange={e => setSessionName(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
              placeholder="marketing-bot"
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Clave de API de OpenWA (X-API-Key)</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Introduce tu X-API-Key (Dejar vacío si no usas contraseña)"
            className={inputCls}
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Configuración
          </button>
          {saved && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Configuración Guardada
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

// ─── Componente de Ajustes de Telegram ───────────────────────────────
const TelegramGatewayConfig: React.FC = () => {
  const { profile } = useUser();
  const [destinos, setDestinos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDestinos = async () => {
    setLoading(true);
    if (profile?.id_usuario) {
      const { data } = await supabase.from('telegram_destinos').select('*').eq('cliente_id', profile.id_usuario);
      setDestinos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDestinos();
  }, [profile]);

  const botUsername = 'Marketing_r_bot'; // From prompt

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 5L2 12.5l7 2.5l3-2.5l-2.5 3l4 3.5L21 5z"></path></svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Destinos de Telegram</h3>
            <p className="text-xs text-slate-400 mt-0.5">Vincula canales, grupos o chats directos para publicar automáticamente.</p>
          </div>
        </div>
        <button
          onClick={fetchDestinos}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refrescar
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs space-y-3">
        <p className="font-bold text-blue-800">¿Cómo vincular un nuevo destino?</p>
        <p className="text-blue-700">Telegram requiere que los usuarios inicien la conversación con el bot. Sigue estos pasos:</p>
        <ol className="list-decimal list-inside space-y-2 ml-1 text-blue-800">
          <li>
            Haz clic en el siguiente enlace y luego en <strong>"Iniciar"</strong> (o "Start") dentro de Telegram:
            <br />
            {profile?.codigo_vinculacion_telegram && (
              <a 
                href={`https://t.me/${botUsername}?start=${profile.codigo_vinculacion_telegram}`} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex mt-1 items-center gap-1 text-blue-600 bg-blue-100/50 px-2 py-1 rounded font-mono font-bold hover:bg-blue-200 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                https://t.me/{botUsername}?start={profile.codigo_vinculacion_telegram}
              </a>
            )}
          </li>
          <li>Inmediatamente el bot te confirmará la vinculación y aparecerá en la lista de abajo.</li>
          <li>
            <strong>Para vincular un Grupo o Canal:</strong> Agrega a <strong>@{botUsername}</strong> como administrador, y luego envía el mensaje: 
            <code className="bg-blue-100 px-1 py-0.5 rounded ml-1 select-all font-mono text-[10px]">/start {profile?.codigo_vinculacion_telegram}</code>
          </li>
        </ol>
      </div>

      <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
        <div className="bg-slate-50 border-b border-slate-100 px-4 py-2">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Destinos Vinculados ({destinos.length})</h4>
        </div>
        {destinos.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Aún no has vinculado ningún destino de Telegram.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {destinos.map(d => (
              <li key={d.id} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase">
                    {d.nombre_visible.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{d.nombre_visible}</p>
                    <p className="text-[10px] text-slate-400 font-mono">ID: {d.chat_id} • Tipo: {d.tipo}</p>
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    if (confirm("¿Desvincular destino? Ya no podrás publicar en él.")) {
                      await supabase.from('telegram_destinos').delete().eq('id', d.id);
                      fetchDestinos();
                    }
                  }}
                  className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded hover:bg-rose-100 transition-colors"
                >
                  Desvincular
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// ─── Helpers para respaldo y parseo de SQL PostgreSQL ─────────────────────
export const formatSqlValue = (val: any): string => {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'object') {
    if (val instanceof Date) return `'${val.toISOString()}'`;
    const jsonStr = JSON.stringify(val).replace(/'/g, "''");
    return `'${jsonStr}'::jsonb`;
  }
  const escaped = String(val).replace(/'/g, "''");
  return `'${escaped}'`;
};

export const generatePostgresSqlDump = (
  tablesData: Record<string, any[]>,
  profileEmail: string
): string => {
  const lines: string[] = [];
  const now = new Date().toISOString();

  lines.push(`-- =============================================================================`);
  lines.push(`-- RESPALDO COMPLETO DE BASE DE DATOS POSTGRESQL (MARKETIA)`);
  lines.push(`-- Fecha: ${now}`);
  lines.push(`-- Generado por: ${profileEmail || 'Administrador'}`);
  lines.push(`-- Motor: PostgreSQL / Supabase DB`);
  lines.push(`-- =============================================================================\n`);

  lines.push(`BEGIN;\n`);

  let totalInserts = 0;

  for (const [tableName, rows] of Object.entries(tablesData)) {
    lines.push(`-- -----------------------------------------------------------------------------`);
    lines.push(`-- Tabla: public."${tableName}" (${rows.length} registros)`);
    lines.push(`-- -----------------------------------------------------------------------------\n`);

    if (!rows || rows.length === 0) {
      lines.push(`-- (Sin datos en la tabla public."${tableName}")\n`);
      continue;
    }

    const columnsSet = new Set<string>();
    rows.forEach(r => Object.keys(r).forEach(k => columnsSet.add(k)));
    const columns = Array.from(columnsSet);

    const colsStr = columns.map(c => `"${c}"`).join(', ');

    for (const row of rows) {
      const valuesStr = columns.map(c => formatSqlValue(row[c])).join(', ');
      lines.push(`INSERT INTO public."${tableName}" (${colsStr}) VALUES (${valuesStr}) ON CONFLICT DO NOTHING;`);
      totalInserts++;
    }

    lines.push(``);
  }

  lines.push(`COMMIT;`);
  lines.push(`\n-- Fin del respaldo SQL PostgreSQL (${totalInserts} registros exportados).`);

  return lines.join('\n');
};

export const parseSqlValueToken = (rawToken: string): any => {
  if (rawToken.toUpperCase() === 'NULL') return null;
  if (rawToken.toUpperCase() === 'TRUE') return true;
  if (rawToken.toUpperCase() === 'FALSE') return false;
  
  let clean = rawToken.replace(/::[a-zA-Z0-9_]+/g, '').trim();

  if (clean.startsWith("'") && clean.endsWith("'")) {
    const unquoted = clean.slice(1, -1).replace(/''/g, "'");
    if ((unquoted.startsWith('{') && unquoted.endsWith('}')) || (unquoted.startsWith('[') && unquoted.endsWith(']'))) {
      try {
        return JSON.parse(unquoted);
      } catch {
        return unquoted;
      }
    }
    return unquoted;
  }

  if (!isNaN(Number(clean))) {
    return Number(clean);
  }

  return clean;
};

export const parsePostgresSqlDump = (sqlContent: string): { tables: Record<string, any[]>; totalRecords: number } => {
  const tables: Record<string, any[]> = {};
  let totalRecords = 0;

  const lines = sqlContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.toUpperCase().startsWith('INSERT INTO')) continue;

    const match = trimmed.match(/INSERT INTO public\."?([a-zA-Z0-9_]+)"?\s*\(([^)]+)\)\s*VALUES\s*\((.+)\)(?:\s+ON CONFLICT.*)?;?/i);
    if (!match) continue;

    const tableName = match[1];
    const rawCols = match[2];
    const rawVals = match[3];

    const cols = rawCols.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    
    const values: any[] = [];
    let currentVal = '';
    let inQuotes = false;

    for (let i = 0; i < rawVals.length; i++) {
      const char = rawVals[i];
      if (char === "'" && rawVals[i - 1] !== '\\') {
        inQuotes = !inQuotes;
        currentVal += char;
      } else if (char === ',' && !inQuotes) {
        values.push(parseSqlValueToken(currentVal.trim()));
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    if (currentVal.trim().length > 0) {
      values.push(parseSqlValueToken(currentVal.trim()));
    }

    if (cols.length === values.length) {
      const rowObj: Record<string, any> = {};
      cols.forEach((col, idx) => {
        rowObj[col] = values[idx];
      });

      if (!tables[tableName]) tables[tableName] = [];
      tables[tableName].push(rowObj);
      totalRecords++;
    }
  }

  return { tables, totalRecords };
};

// ─── Componente de Backup y Restauración de Base de Datos PostgreSQL ───────
const DatabaseBackupRestore: React.FC = () => {
  const { profile, isAdmin } = useUser();
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [pendingRestoreData, setPendingRestoreData] = useState<any | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string>('');

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const TABLES_TO_BACKUP = [
    'roles',
    'usuarios',
    'clientes',
    'campaigns',
    'redes_sociales',
    'tipos_contenido',
    'publicaciones',
    'interacciones',
    'segmentos',
    'leads',
    'presupuestos',
    'prompts_ia',
    'contenido_ia',
    'chatbot_historial',
    'analisis_sentimientos',
    'pagos',
    'telegram_destinos',
    'clientes_portal',
    'system_logs'
  ];

  const handleExportBackup = async () => {
    setBackupLoading(true);
    setBackupStatus('Extrayendo esquema y datos de PostgreSQL...');
    setErrorMsg(null);
    setRestoreStatus(null);

    try {
      const backupTablesData: Record<string, any[]> = {};
      const recordCounts: Record<string, number> = {};
      let totalRecords = 0;

      for (const table of TABLES_TO_BACKUP) {
        try {
          const { data, error } = await supabase.from(table).select('*');
          if (!error && data) {
            backupTablesData[table] = data;
            recordCounts[table] = data.length;
            totalRecords += data.length;
          } else {
            backupTablesData[table] = [];
            recordCounts[table] = 0;
          }
        } catch {
          backupTablesData[table] = [];
          recordCounts[table] = 0;
        }
      }

      const sqlContent = generatePostgresSqlDump(backupTablesData, profile?.correo || '');

      const blob = new Blob([sqlContent], { type: 'application/sql;charset=utf-8' });
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      downloadAnchor.href = URL.createObjectURL(blob);
      downloadAnchor.download = `backup_marketia_postgres_${dateStr}.sql`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setBackupStatus(`Backup SQL PostgreSQL completado (${totalRecords} registros exportados en .sql).`);
      logSystemEvent('INFO', 'Database', 'Copia de seguridad SQL PostgreSQL exportada', {
        totalRecords,
        tables: recordCounts,
        admin: profile?.correo
      });
    } catch (err: any) {
      console.error('Error durante el backup:', err);
      setErrorMsg(err.message || 'Error al generar el archivo SQL de respaldo.');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setRestoreStatus(null);
    setBackupStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let parsedTables: Record<string, any[]> = {};
        let totalRecords = 0;

        if (file.name.endsWith('.sql') || content.includes('INSERT INTO')) {
          const res = parsePostgresSqlDump(content);
          parsedTables = res.tables;
          totalRecords = res.totalRecords;
        } else {
          const parsed = JSON.parse(content);
          if (!parsed || typeof parsed !== 'object' || !parsed.tables) {
            throw new Error('El archivo no tiene un formato de respaldo SQL o JSON válido.');
          }
          parsedTables = parsed.tables;
          totalRecords = parsed.total_records || 0;
        }

        if (Object.keys(parsedTables).length === 0) {
          throw new Error('No se encontraron registros ni sentencias SQL válidas en el archivo.');
        }

        setPendingFileName(file.name);
        setPendingRestoreData({
          tables: parsedTables,
          total_records: totalRecords,
          isSql: file.name.endsWith('.sql') || content.includes('INSERT INTO')
        });
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al leer el archivo de respaldo SQL.');
      }
    };
    reader.readAsText(file);
  };

  const executeRestore = async () => {
    if (!pendingRestoreData) return;

    setRestoreLoading(true);
    setRestoreStatus('Iniciando restauración de datos PostgreSQL...');
    setErrorMsg(null);

    try {
      const tables = pendingRestoreData.tables;
      let restoredTablesCount = 0;
      let totalRestoredRecords = 0;

      for (const tableName of Object.keys(tables)) {
        const records = tables[tableName];
        if (Array.isArray(records) && records.length > 0) {
          setRestoreStatus(`Restaurando tabla '${tableName}' (${records.length} registros)...`);
          const { error } = await supabase.from(tableName).upsert(records);
          if (error) {
            console.warn(`Advertencia al restaurar tabla ${tableName}:`, error.message);
          } else {
            restoredTablesCount++;
            totalRestoredRecords += records.length;
          }
        }
      }

      setRestoreStatus(`Restauración completada: ${totalRestoredRecords} registros restaurados en ${restoredTablesCount} tablas.`);
      logSystemEvent('WARNING', 'Database', 'Restauración de base de datos ejecutada por administrador', {
        restoredRecords: totalRestoredRecords,
        file: pendingFileName,
        admin: profile?.correo
      });

      setPendingRestoreData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Error al restaurar:', err);
      setErrorMsg(err.message || 'Error durante la restauración de PostgreSQL.');
    } finally {
      setRestoreLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            Copia de seguridad y restauración (PostgreSQL SQL)
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Genera un script de respaldo completo PostgreSQL (.sql) del sistema o restaura la base de datos desde un archivo SQL o JSON.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* Backup Button */}
        <button
          onClick={handleExportBackup}
          disabled={backupLoading || restoreLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-sm disabled:opacity-50"
        >
          {backupLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" /> : <Download className="w-3.5 h-3.5 text-slate-600" />}
          <span>{backupLoading ? 'Generando SQL...' : 'Hacer Backup SQL (PostgreSQL)'}</span>
        </button>

        {/* Restore Button */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".sql,.json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={backupLoading || restoreLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {restoreLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" /> : <Upload className="w-3.5 h-3.5 text-slate-600" />}
            <span>Restaurar Base de Datos (.sql)</span>
          </button>
        </div>
      </div>

      {/* Backup status banner */}
      {backupStatus && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2 text-[11px] font-semibold text-emerald-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{backupStatus}</span>
        </div>
      )}

      {/* Restore status banner */}
      {restoreStatus && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2 text-[11px] font-semibold text-emerald-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{restoreStatus}</span>
        </div>
      )}

      {/* Error banner */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center gap-2 text-[11px] font-semibold text-rose-700">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Pending Restore Confirmation Card */}
      {pendingRestoreData && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2.5 text-xs">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">Confirmación de Restauración SQL</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Archivo: <span className="font-mono font-bold text-amber-950">{pendingFileName}</span> {pendingRestoreData.isSql ? '(Formato SQL Script)' : '(Formato JSON)'}
              </p>
              <p className="text-[10px] text-amber-700 mt-0.5">
                Total de registros detectados: {pendingRestoreData.total_records || 'Varios'}
              </p>
            </div>
          </div>

          <div className="bg-white/80 p-2 rounded-lg border border-amber-200/60 text-[10px] text-slate-700">
            <span className="font-bold text-slate-800">Tablas a restaurar: </span>
            {Object.keys(pendingRestoreData.tables || {}).map((tbl, i, arr) => (
              <span key={tbl} className="font-mono text-slate-600">
                {tbl} ({Array.isArray(pendingRestoreData.tables[tbl]) ? pendingRestoreData.tables[tbl].length : 0}){i < arr.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={executeRestore}
              disabled={restoreLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {restoreLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
              Confirmar Restauración SQL
            </button>

            <button
              onClick={() => {
                setPendingRestoreData(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              disabled={restoreLoading}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
