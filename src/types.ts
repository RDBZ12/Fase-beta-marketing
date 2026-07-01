// ─── Existing types (maintained for compatibility) ───────────────────────────

export interface Campaign {
  id: string;
  name: string;
  brand?: string;
  image_url?: string;
  channel: 'Email' | 'Social' | 'Display' | 'Multi';
  status: 'Activa' | 'Pausada' | 'Completada' | 'Borrador' | 'Pendiente de Pago' | 'Aprobada';
  leads: number;
  reach: string;
  ctr: number;
  startDate: string;
  endDate?: string;
  descripcion?: string;
  objetivo?: string;
  presupuesto?: number;
  fechaInicio?: string;
  fechaFin?: string;
  idCliente?: string;
  creatorName?: string;
  creatorRole?: string;
}

export interface Metric {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  subtext: string;
}

// ─── Roles & Users ───────────────────────────────────────────────────────────

export type RolId = 1 | 2 | 3 | 4 | 5;
export type RolNombre = 'Administrador' | 'Gerencia' | 'Marketing' | 'Community Manager' | 'Servicio al Cliente';

export interface Rol {
  id_rol: RolId;
  nombre_rol: RolNombre;
  descripcion: string;
}

export interface Usuario {
  id_usuario: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  estado: 'activo' | 'inactivo';
  id_rol: RolId;
  nombre_rol?: RolNombre;
  created_at?: string;
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export interface Cliente {
  id_cliente: string;
  nombre_empresa: string;
  contacto?: string;
  telefono: string;
  correo?: string;
  direccion?: string;
  estado: 'activo' | 'inactivo';
  created_at?: string;
}

// ─── Social Networks & Content Types ─────────────────────────────────────────

export interface RedSocial {
  id_red: number;
  nombre_red: string;
  url?: string;
  estado: 'activo' | 'inactivo';
  icono?: string;
}

export interface TipoContenido {
  id_tipo_contenido: number;
  nombre_tipo: string;
  descripcion?: string;
}

// ─── Publications ─────────────────────────────────────────────────────────────

export interface Publicacion {
  id_publicacion: string;
  titulo: string;
  contenido: string;
  fecha_publicacion: string;
  estado: 'Programada' | 'Publicada' | 'Borrador' | 'Cancelada' | 'Pendiente Aprobacion';
  id_campana?: string;
  id_red?: number;
  id_tipo_contenido?: number;
  imagen_url?: string;
  ayrshare_post_id?: string;
  instagram_post_url?: string;
  nombre_red?: string;
  nombre_tipo?: string;
  nombre_campana?: string;
  created_at?: string;
  likes?: number;
  comentarios?: number;
  compartidos?: number;
  alcance?: number;
}

// ─── Segments & Leads ────────────────────────────────────────────────────────

export interface Segmento {
  id_segmento: number;
  nombre_segmento: string;
  descripcion?: string;
}

export interface Lead {
  id_lead: string;
  nombre: string;
  telefono?: string;
  correo?: string;
  interes?: string;
  estado: 'Nuevo' | 'Contactado' | 'Calificado' | 'Convertido' | 'Perdido';
  fecha_registro: string;
  id_campana?: string;
  id_segmento?: number;
  nombre_campana?: string;
  nombre_segmento?: string;
}

// ─── AI Content ──────────────────────────────────────────────────────────────

export interface ContenidoIA {
  id_contenido: string;
  respuesta_ia: string;
  fecha: string;
  canal?: string;
  tema?: string;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export interface Pago {
  id_pago: string;
  id_campana?: string;
  monto: number;
  itbis?: number;
  total_con_itbis?: number;
  ncf?: string;
  estado_dgii: 'Pendiente' | 'Aceptado' | 'Rechazado';
  metodo_pago: 'PayPal' | 'Transferencia' | 'Efectivo' | 'Tarjeta';
  rnc_cedula?: string;
  razon_social?: string;
  tipo_comprobante?: string;
  fecha: string;
  nombre_campana?: string;
  url_dgii?: string;
}

// ─── User Context ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id_usuario: string;
  nombre: string;
  apellido: string;
  correo: string;
  id_rol: RolId;
  nombre_rol: RolNombre;
  telefono?: string;
  whatsapp_session_name?: string;
  whatsapp_phone?: string;
}
