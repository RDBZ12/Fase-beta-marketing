export const tutorKnowledge = [
  { intent: 'MEGA_TOUR', keywords: ['iniciar tour', 'tour completo', 'recorrido completo', 'todo el sitio', 'tour general'], triggerFlow: 'MEGA_TOUR', explanation: '¡Excelente! Iniciemos el recorrido maestro paso a paso por absolutamente toda la aplicación.' },
  { intent: 'CREATE_CAMPAIGN', keywords: ['campaña', 'crear', 'anuncio', 'nueva campaña'], triggerFlow: 'CREATE_CAMPAIGN', explanation: '¡Por supuesto! Iniciemos el recorrido específicamente para crear una nueva campaña publicitaria.' },
  { intent: 'PAGOS', keywords: ['pagar', 'pago', 'factura', 'saldo', 'paypal'], triggerFlow: 'PAGOS', explanation: '¡Claro! Te enseñaré cómo revisar tu presupuesto y realizar pagos.' },
  { intent: 'VERIFICAR_NCF', keywords: ['pdf de pago', 'descargar pdf', 'escanear qr', 'comprobante', 'ncf', 'verificar ncf'], triggerFlow: 'PAGOS', explanation: '¡Entendido! Te mostraré cómo descargar tu factura PDF y validar su e-NCF con la DGII usando el código QR.' },
  { intent: 'PROFILE_TOUR', keywords: ['perfil', 'configurar', 'fiscal', 'rnc', 'whatsapp', 'vincular', 'whatsap', 'watsap', 'wasap', 'wasa', 'whatpa', 'conectar whatsapp', 'vincular whatsapp', 'configurar whatsapp'], triggerFlow: 'PROFILE_TOUR', explanation: 'Entendido. Vamos a configurar tus datos fiscales y vincular tu cuenta de WhatsApp Web.' },
  { intent: 'MIS_PUBLICACIONES', keywords: ['publicaciones', 'publicacion', 'publicación', 'post', 'feed', 'redes', 'programado', 'hacer publicacion', 'hacer publicación', 'nuevo post', 'crear post', 'programar post'], triggerFlow: 'MIS_PUBLICACIONES', explanation: '¡Perfecto! Te mostraré cómo gestionar tus publicaciones programadas y crear nuevas.' },
  { intent: 'ESTADISTICAS', keywords: ['estadísticas', 'métricas', 'alcance', 'leads', 'rendimiento'], triggerFlow: 'ESTADISTICAS', explanation: '¡Entendido! Vamos a ver los resultados y estadísticas de tus campañas.' }
];

export const normalizeString = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const findIntent = (q: string) => {
  const normQ = normalizeString(q);

  // Regla de coincidencia difusa para WhatsApp y variaciones tipográficas
  const isWhatsAppQuery = ['what', 'wats', 'wasap', 'wasa', 'whatp', 'watp', 'wtsp', 'whata'].some(sub => normQ.includes(sub));
  if (isWhatsAppQuery) {
    return tutorKnowledge.find(k => k.intent === 'PROFILE_TOUR');
  }

  return tutorKnowledge.find(k => k.keywords.some(kw => normQ.includes(normalizeString(kw))));
};
