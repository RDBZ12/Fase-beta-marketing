export const tutorKnowledge = [
  // ── INTENCIONES CONVERSACIONALES (Sin flow) ──
  { 
    intent: 'GREETING', 
    keywords: ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'buenas', 'que tal', 'saludos', 'hey', 'holi', 'holis', 'alo', 'hello', 'que onda', 'buendia', 'buen dia'], 
    explanation: [
      '¡Hola! Qué gusto saludarte. Soy la IA de Marketdev. Estoy aquí para ayudarte a crear campañas, revisar tus métricas, gestionar tus pagos o publicar en redes. ¿En qué te puedo asistir hoy?',
      '¡Saludos! Soy tu asistente de Marketdev. ¿Qué vamos a lograr hoy? Puedes decirme "quiero crear una campaña" o "ver mis estadísticas".',
      '¡Hola, hola! Listo para ayudarte con tu marketing. Pídeme lo que necesites, como "pagar facturas" o "configurar mi WhatsApp".'
    ]
  },
  { 
    intent: 'THANKS', 
    keywords: ['gracias', 'excelente', 'perfecto', 'muy bien', 'ok', 'vale', 'listo', 'entendido', 'muchas gracias', 'nitido', 'chevere', 'super', 'cool', 'genial', 'mil gracias', 'agradecido'], 
    explanation: [
      '¡De nada! Es un placer ayudarte. Si necesitas algo más, solo escríbelo aquí.',
      '¡Para eso estamos! Cualquier otra duda, aquí sigo.',
      '¡Genial! Siempre a la orden. ¿Te ayudo con otra cosa?'
    ]
  },
  { 
    intent: 'HELP', 
    keywords: ['ayuda', 'no se que hacer', 'como funciona', 'que puedes hacer', 'opciones', 'menu', 'necesito ayuda', 'auxilio', 'ayudame', 'estoy perdido', 'guiame', 'orientacion', 'explicame', 'que hago', 'no entiendo'], 
    explanation: [
      '¡No te preocupes! Puedo guiarte paso a paso. Intenta decir algo como: "Quiero crear un anuncio", "Quiero ver mis estadísticas", o "Quiero configurar mi WhatsApp".',
      'Es muy fácil. Funciono reconociendo lo que necesitas. Prueba escribiendo: "Cómo hago una campaña" o "Dónde pago mis facturas".',
      '¡Aquí estoy para guiarte! Puedes pedirme ayuda con: Creación de campañas, Estadísticas, Publicaciones o Pagos. ¿Cuál prefieres?'
    ]
  },

  // ── INTENCIONES DE SISTEMA (Con flow) ──
  { 
    intent: 'CREATE_CAMPAIGN', 
    keywords: ['campaña', 'crear', 'anuncio', 'nueva campaña', 'quiero publicidad', 'hacer un anuncio', 'promocionar mi negocio', 'necesito ventas', 'lanzar promo', 'publicidad', 'vender mas', 'marketing', 'quiero crear', 'como hago una campaña', 'hacer campaña', 'nueva publicidad', 'promocionar', 'lanzar campaña', 'crear anuncio', 'vender por internet', 'mas clientes', 'atraer clientes'], 
    triggerFlow: 'CREATE_CAMPAIGN', 
    explanation: [
      '¡Por supuesto! Iniciemos el recorrido para crear tu campaña publicitaria con Inteligencia Artificial paso a paso.',
      '¡Excelente idea! Vamos a lanzar esa campaña. Te guiaré paso a paso por el formulario.',
      '¡Manos a la obra! Voy a mostrarte cómo crear un anuncio usando nuestra IA.'
    ]
  },
  { 
    intent: 'PAGOS', 
    keywords: ['pagar', 'pago', 'factura', 'saldo', 'paypal', 'donde pago', 'mi tarjeta', 'cobros', 'facturacion', 'estoy pendiente de pago', 'pagar campaña', 'metodos de pago', 'tarjeta de credito', 'como pago', 'pagos', 'abonar', 'deuda', 'pagar factura', 'realizar pago', 'tarjeta'], 
    triggerFlow: 'PAGOS', 
    explanation: [
      '¡Claro! Te guiaré hacia la sección de pagos para que puedas revisar tu presupuesto y saldar tus campañas.',
      'Entendido. Vamos a la sección de facturación para que puedas ver y gestionar tus pagos pendientes.',
      'Perfecto, acompáñame y te muestro dónde y cómo realizar los pagos de tus campañas.'
    ]
  },
  { 
    intent: 'VERIFICAR_NCF', 
    keywords: ['pdf de pago', 'descargar pdf', 'escanear qr', 'comprobante', 'ncf', 'verificar ncf', 'factura fiscal', 'comprobante fiscal', 'codigo qr', 'descargar factura', 'factura de la dgii', 'recibo', 'ver mi recibo', 'imprimir factura'], 
    triggerFlow: 'PAGOS', 
    explanation: [
      '¡Entendido! Te mostraré cómo descargar tu factura PDF y cómo validar tu e-NCF con la DGII usando el código QR.',
      'Sin problema. Vamos a la sección donde puedes descargar tus comprobantes fiscales y ver el código QR de la DGII.',
      '¡Vamos a ello! Te indicaré dónde descargar tu PDF de facturación con validación fiscal.'
    ]
  },
  { 
    intent: 'PROFILE_TOUR', 
    keywords: ['perfil', 'configurar', 'fiscal', 'rnc', 'whatsapp', 'vincular', 'whatsap', 'watsap', 'wasap', 'wasa', 'whatpa', 'conectar whatsapp', 'vincular whatsapp', 'configurar whatsapp', 'ajustes', 'cambiar rnc', 'datos fiscales', 'vincular celular', 'vincular telefono', 'cambiar nombre', 'mi cuenta', 'razon social', 'numero de telefono', 'cambiar perfil'], 
    triggerFlow: 'PROFILE_TOUR', 
    explanation: [
      'Perfecto. Vamos a configurar tus datos fiscales y a vincular tu cuenta de WhatsApp para que recibas notificaciones.',
      '¡Claro! Te guiaré a tu perfil para que configures tu RNC y conectes tu dispositivo a WhatsApp.',
      'Excelente, vamos a tu cuenta. Ahí te mostraré cómo actualizar tu razón social y activar WhatsApp.'
    ]
  },
  { 
    intent: 'MIS_PUBLICACIONES', 
    keywords: ['publicaciones', 'publicacion', 'post', 'feed', 'redes', 'programado', 'hacer publicacion', 'nuevo post', 'crear post', 'programar post', 'ver mis posts', 'redes sociales', 'calendario de posts', 'gestionar redes', 'instagram', 'facebook', 'subir foto', 'subir contenido', 'publicar algo', 'subir imagen', 'foto de instagram'], 
    triggerFlow: 'MIS_PUBLICACIONES', 
    explanation: [
      '¡Excelente! Te mostraré cómo gestionar tus publicaciones, ver tu historial y crear nuevo contenido para tus redes.',
      '¡Vamos a las redes! Te enseñaré dónde programar y editar tus posts para Facebook e Instagram.',
      'Perfecto, acompáñame a la sección de publicaciones para que veas cómo subir y programar contenido.'
    ]
  },
  { 
    intent: 'ESTADISTICAS', 
    keywords: ['estadisticas', 'metricas', 'alcance', 'leads', 'rendimiento', 'resultados', 'como me fue', 'cuanta gente', 'graficos', 'ventas', 'impacto', 'numeros', 'reportes', 'analiticas', 'ver alcance', 'ver resultados', 'como van los anuncios', 'interacciones'], 
    triggerFlow: 'ESTADISTICAS', 
    explanation: [
      '¡Entendido! Vamos a revisar los resultados, el alcance y las estadísticas detalladas de tus campañas.',
      '¡Claro que sí! Te llevaré al panel de analíticas para que veas cómo están rindiendo tus anuncios.',
      'Vamos a ver esos números. Te guiaré por la sección de estadísticas y métricas clave.'
    ]
  }
];

export const normalizeString = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const findIntent = (q: string) => {
  const normQ = normalizeString(q);

  // Regla de coincidencia difusa para WhatsApp y variaciones tipográficas comunes
  const isWhatsAppQuery = ['what', 'wats', 'wasap', 'wasa', 'whatp', 'watp', 'wtsp', 'whata'].some(sub => normQ.includes(sub));
  if (isWhatsAppQuery) {
    return tutorKnowledge.find(k => k.intent === 'PROFILE_TOUR');
  }

  // Búsqueda flexible: si alguna palabra clave está contenida en la pregunta del usuario
  return tutorKnowledge.find(k => k.keywords.some(kw => {
    const normKw = normalizeString(kw);
    // Verificamos si la frase completa o la palabra clave está en la consulta
    return normQ.includes(normKw);
  }));
};
