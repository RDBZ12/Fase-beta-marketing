// src/learning/data/resources.ts
export type LearningResourceType = 'tour' | 'guide' | 'faq' | 'video' | 'resource';
export type ModuleId = 'inicio' | 'perfil' | 'campanas' | 'publicaciones' | 'leads' | 'ia' | 'whatsapp' | 'facturacion' | 'pagos' | 'reportes' | 'seguridad' | 'soporte';

export interface LearningResource {
  id: string;
  type: LearningResourceType;
  moduleId: ModuleId;
  title: string;
  category?: string;
  description?: string;
  guiaContenido?: string;
  // Metadata adicional para Tours y Guías
  estimatedTime?: string;
  learningObjective?: string;
  stepsSummary?: string[];
  // Enlaces o recursos adicionales
  url?: string;
}

export const MODULE_NAMES: Record<ModuleId, string> = {
  inicio: 'Inicio y Básicos',
  perfil: 'Mi Perfil',
  campanas: 'Campañas y Anuncios',
  publicaciones: 'Publicaciones',
  leads: 'Leads y Prospectos',
  ia: 'Inteligencia Artificial',
  whatsapp: 'WhatsApp Marketing',
  facturacion: 'Facturación (DGII)',
  pagos: 'Pagos y Suscripción',
  reportes: 'Reportes y Métricas',
  seguridad: 'Seguridad',
  soporte: 'Soporte y Ayuda',
};

export const learningResources: LearningResource[] = [
  // ==========================================
  // TOURS INTERACTIVOS (Los que conectan con la máquina de estados)
  // ==========================================
  {
    id: 'tour-CREATE_CAMPAIGN',
    type: 'tour',
    moduleId: 'campanas',
    title: 'Crear una Campaña con IA',
    description: 'Aprende a llenar el formulario del asistente y a generar tus copys e imágenes con inteligencia artificial.',
    estimatedTime: '8 minutos',
    learningObjective: 'Dominar el flujo de creación de anuncios publicitarios utilizando nuestro motor de Inteligencia Artificial.',
    stepsSummary: [
      'Navegar a la pantalla de Campañas.',
      'Definir tu presupuesto y segmento.',
      'Solicitar a la IA la generación de textos (copys).',
      'Configurar el Call-to-Action (WhatsApp).'
    ]
  },
  {
    id: 'tour-PROFILE_TOUR',
    type: 'tour',
    moduleId: 'perfil',
    title: 'Vincular WhatsApp y Datos Fiscales',
    description: 'Configura tus datos dominicanos de facturación (RNC) y enlaza tu WhatsApp Web de manera nativa.',
    estimatedTime: '5 minutos',
    learningObjective: 'Dejar tu cuenta configurada al 100% para emitir facturas con valor fiscal y enviar mensajes masivos.',
    stepsSummary: [
      'Ingresar tu Razón Social o Nombre.',
      'Agregar tu RNC o Cédula dominicana.',
      'Escanear el código QR de WhatsApp Web.'
    ]
  },
  {
    id: 'tour-MIS_PUBLICACIONES',
    type: 'tour',
    moduleId: 'publicaciones',
    title: 'Gestionar mis Publicaciones',
    description: 'Aprende a visualizar, buscar y ordenar tus publicaciones programadas para redes sociales.',
    estimatedTime: '3 minutos',
    learningObjective: 'Manejar el calendario de contenidos orgánicos.',
    stepsSummary: [
      'Acceder a la cuadrícula de publicaciones.',
      'Filtrar por red social (Facebook/Instagram).',
      'Crear una nueva publicación programada.'
    ]
  },
  {
    id: 'tour-PAGOS',
    type: 'tour',
    moduleId: 'pagos',
    title: 'Administrar Pagos y Facturas DGII',
    description: 'Aprende a descargar tus comprobantes fiscales digitales e-CF y ver tus totales invertidos.',
    estimatedTime: '4 minutos',
    learningObjective: 'Gestionar las finanzas de tu cuenta y obtener soporte contable.',
    stepsSummary: [
      'Revisar tu historial de cobros.',
      'Ver el estatus de las facturas DGII.',
      'Descargar los recibos en formato PDF.'
    ]
  },
  {
    id: 'tour-ESTADISTICAS',
    type: 'tour',
    moduleId: 'reportes',
    title: 'Ver Informes y Métricas',
    description: 'Analiza tu CTR promedio, tus leads acumulados y el feed social de tu cuenta de Instagram Business.',
    estimatedTime: '6 minutos',
    learningObjective: 'Interpretar el retorno de inversión y alcance de tus campañas publicitarias.',
    stepsSummary: [
      'Explorar el embudo de ventas (Impresiones vs Leads).',
      'Analizar los gráficos de rendimiento.',
      'Exportar la tabla de resultados.'
    ]
  },

  // ==========================================
  // PREGUNTAS FRECUENTES (FAQs) - POR MÓDULO
  // ==========================================

  // --- MÓDULO: INICIO ---
  {
    id: 'faq-inicio-1', type: 'faq', moduleId: 'inicio',
    title: '¿Qué es MarketIA?',
    guiaContenido: '<p>MarketIA es una plataforma integral de marketing automatizado impulsada por Inteligencia Artificial. Permite crear anuncios, programar publicaciones y gestionar clientes (CRM) en piloto automático, sin requerir experiencia previa en marketing digital.</p>'
  },
  {
    id: 'faq-inicio-2', type: 'faq', moduleId: 'inicio',
    title: '¿Cómo empiezo?',
    guiaContenido: '<p>El primer paso es completar tu perfil. Ve a la sección <strong>Mi Perfil</strong>, ingresa los datos de tu empresa, tu RNC para facturación y escanea el código QR para vincular tu WhatsApp. Luego, puedes ir a <strong>Campañas</strong> y crear tu primer anuncio.</p>'
  },
  {
    id: 'faq-inicio-3', type: 'faq', moduleId: 'inicio',
    title: '¿Qué necesito antes de crear campañas?',
    guiaContenido: '<ul><li>Una cuenta de Facebook/Instagram vinculada (próximamente automatizado en el onboarding).</li><li>Saldo disponible en tu cuenta o una tarjeta de crédito activa.</li><li>Tu WhatsApp vinculado para recibir a los clientes potenciales.</li></ul>'
  },
  {
    id: 'faq-inicio-4', type: 'faq', moduleId: 'inicio',
    title: '¿Puedo usar MarketIA sin conocimientos de marketing?',
    guiaContenido: '<p>¡Absolutamente! Nuestro sistema está diseñado precisamente para empresarios y dueños de negocios que no son expertos en marketing. La Inteligencia Artificial redacta los textos persuasivos y optimiza el presupuesto por ti.</p>'
  },
  {
    id: 'faq-inicio-5', type: 'faq', moduleId: 'inicio',
    title: '¿Cómo funciona el aprendizaje?',
    guiaContenido: '<p>A través de la <strong>Academia MarketIA</strong> (donde estás ahora). Contamos con guías detalladas, tours interactivos en los que un Asistente Virtual te lleva de la mano pantalla por pantalla, y esta base de preguntas frecuentes.</p>'
  },

  // --- MÓDULO: MI PERFIL ---
  {
    id: 'faq-perfil-1', type: 'faq', moduleId: 'perfil',
    title: '¿Cómo cambio mi contraseña?',
    guiaContenido: '<p>Dirígete a la pantalla de <strong>Mi Perfil</strong>, en la sección de Seguridad (próximamente) podrás actualizar tu contraseña actual por una nueva, confirmándola mediante un código enviado a tu correo.</p>'
  },
  {
    id: 'faq-perfil-2', type: 'faq', moduleId: 'perfil',
    title: '¿Cómo cambio mi correo?',
    guiaContenido: '<p>El cambio de correo electrónico requiere validación de identidad. Debes solicitarlo directamente abriendo un ticket en el módulo de <strong>Soporte</strong>.</p>'
  },
  {
    id: 'faq-perfil-3', type: 'faq', moduleId: 'perfil',
    title: '¿Cómo cambio mi empresa?',
    guiaContenido: '<p>En la sección de <strong>Mi Perfil</strong>, simplemente modifica el campo "Razón Social" y haz clic en Guardar Cambios. Recuerda que esto afectará el nombre a quien se emiten los próximos comprobantes fiscales.</p>'
  },
  {
    id: 'faq-perfil-4', type: 'faq', moduleId: 'perfil',
    title: '¿Cómo vinculo WhatsApp?',
    guiaContenido: '<p>Ve a <strong>Mi Perfil</strong>. En el panel de WhatsApp, haz clic en "Vincular Dispositivo". Abre WhatsApp en tu celular, ve a Dispositivos Vinculados, presiona "Vincular un dispositivo" y apunta tu cámara al código QR que aparece en pantalla.</p>'
  },
  {
    id: 'faq-perfil-5', type: 'faq', moduleId: 'perfil',
    title: '¿Cómo desvinculo WhatsApp?',
    guiaContenido: '<p>Para desvincular, ve a <strong>Mi Perfil</strong> y haz clic en el botón rojo "Cerrar sesión" en el panel de WhatsApp. También puedes hacerlo desde tu teléfono (cerrando la sesión llamada "MarketIA").</p>'
  },

  // --- MÓDULO: CAMPAÑAS ---
  {
    id: 'faq-campanas-1', type: 'faq', moduleId: 'campanas',
    title: '¿Qué hace la IA?',
    guiaContenido: '<p>La Inteligencia Artificial de MarketIA analiza tu descripción de negocio y objetivo, y automáticamente redacta textos persuasivos (copywriting), sugiere llamados a la acción e incluso puede generar imágenes para tus anuncios.</p>'
  },
  {
    id: 'faq-campanas-2', type: 'faq', moduleId: 'campanas',
    title: '¿Cómo calcula el presupuesto?',
    guiaContenido: '<p>El presupuesto se divide equitativamente entre los días que dure la campaña. Por ejemplo, si pones $100 dólares para 10 días, el sistema consumirá un máximo de $10 dólares diarios en inversión publicitaria real.</p>'
  },
  {
    id: 'faq-campanas-3', type: 'faq', moduleId: 'campanas',
    title: '¿Puedo modificar el texto generado?',
    guiaContenido: '<p>Sí, la IA te presenta una sugerencia, pero tú tienes total control. Puedes hacer clic en el texto y editar cualquier palabra antes de publicar la campaña definitiva.</p>'
  },
  {
    id: 'faq-campanas-4', type: 'faq', moduleId: 'campanas',
    title: '¿Qué ocurre cuando publico una campaña?',
    guiaContenido: '<p>La campaña entra a estado "Programada" y se envía a los servidores de Meta (Facebook/Instagram) para su revisión. Una vez aprobada por Meta (suele tardar de 5 a 30 minutos), su estado cambiará a "Activa".</p>'
  },
  {
    id: 'faq-campanas-5', type: 'faq', moduleId: 'campanas',
    title: '¿Cómo pauso una campaña?',
    guiaContenido: '<p>En la tabla de <strong>Campañas</strong>, ubica la campaña activa y haz clic en el botón de Pausa (icono naranja). El gasto se detendrá inmediatamente.</p>'
  },

  // --- MÓDULO: PUBLICACIONES ---
  {
    id: 'faq-pub-1', type: 'faq', moduleId: 'publicaciones',
    title: '¿Cómo programa las publicaciones?',
    guiaContenido: '<p>MarketIA utiliza la API oficial de las redes sociales. Cuando creas un post y seleccionas una fecha futura, el sistema lo almacena en nuestra cola de procesos (Queue) y lo dispara exactamente en el minuto configurado.</p>'
  },
  {
    id: 'faq-pub-2', type: 'faq', moduleId: 'publicaciones',
    title: '¿Qué pasa si falla una publicación?',
    guiaContenido: '<p>Si por algún error de la red social tu publicación falla, aparecerá marcada en rojo como "Fallida". El sistema re-intentará 3 veces automáticamente. Si persiste, te notificaremos para que resuelvas el error (ej. token expirado).</p>'
  },
  {
    id: 'faq-pub-3', type: 'faq', moduleId: 'publicaciones',
    title: '¿Qué redes sociales soporta?',
    guiaContenido: '<p>Actualmente soportamos publicación directa en <strong>Instagram Business</strong> y <strong>Facebook Pages</strong>. Próximamente integraremos LinkedIn y TikTok.</p>'
  },

  // --- MÓDULO: IA ---
  {
    id: 'faq-ia-1', type: 'faq', moduleId: 'ia',
    title: '¿La IA aprende de mi empresa?',
    guiaContenido: '<p>¡Sí! Al configurar tu perfil y crear campañas repetidamente, la IA de MarketIA almacena el "Tono de voz" y los datos clave de tus productos para mejorar la precisión y efectividad de los siguientes anuncios generados.</p>'
  },
  {
    id: 'faq-ia-2', type: 'faq', moduleId: 'ia',
    title: '¿Puedo volver a generar contenido?',
    guiaContenido: '<p>Si el texto generado no te gusta, simplemente presiona el botón "Generar con IA" nuevamente. El sistema intentará un enfoque diferente. Puedes hacerlo ilimitadas veces.</p>'
  },

  // --- MÓDULO: WHATSAPP ---
  {
    id: 'faq-wa-1', type: 'faq', moduleId: 'whatsapp',
    title: '¿Mi número puede ser bloqueado?',
    guiaContenido: '<p>MarketIA utiliza tecnología antibaneo con emulación nativa e inyección de retrasos humanos (Typing emulation). Sin embargo, <strong>no apoyamos el SPAM masivo no solicitado</strong>. Si los usuarios a los que les escribes te reportan en masa, WhatsApp podría restringir tu línea. Envía mensajes solo a tus leads generados legítimamente.</p>'
  },
  {
    id: 'faq-wa-2', type: 'faq', moduleId: 'whatsapp',
    title: '¿Qué significa sesión activa?',
    guiaContenido: '<p>Significa que el motor interno (OpenWA Baileys) tiene una conexión WebSocket directa, viva y encriptada con los servidores de WhatsApp, lista para enviar y recibir mensajes en tiempo real.</p>'
  },

  // --- MÓDULO: FACTURACIÓN & PAGOS ---
  {
    id: 'faq-fact-1', type: 'faq', moduleId: 'facturacion',
    title: '¿Qué es un e-CF?',
    guiaContenido: '<p>Es un <strong>Comprobante Fiscal Electrónico</strong>, el nuevo estándar de facturación avalado por la Dirección General de Impuestos Internos (DGII) en la República Dominicana. Todas tus inversiones publicitarias facturadas con nosotros incluyen su e-CF válido para deducción de gastos.</p>'
  },
  {
    id: 'faq-fact-2', type: 'faq', moduleId: 'pagos',
    title: '¿Qué métodos de pago existen?',
    guiaContenido: '<p>Aceptamos pagos globales vía <strong>PayPal</strong> y todas las tarjetas de crédito o débito Visa, Mastercard y American Express a través de nuestra pasarela segura <strong>Stripe</strong>.</p>'
  },

  // --- MÓDULO: REPORTES ---
  {
    id: 'faq-rep-1', type: 'faq', moduleId: 'reportes',
    title: '¿Qué significa CTR?',
    guiaContenido: '<p><strong>Click-Through Rate (CTR)</strong> es la métrica que indica cuántas personas hicieron clic en tu anuncio en relación con el número de personas que lo vieron. Un CTR del 2% significa que por cada 100 personas que vieron el anuncio, 2 hicieron clic. Es un indicador clave de la calidad de tu anuncio.</p>'
  },
  {
    id: 'faq-rep-2', type: 'faq', moduleId: 'reportes',
    title: '¿Qué significa Alcance (Reach)?',
    guiaContenido: '<p>El alcance es el número de personas únicas a las que se les ha mostrado tu anuncio al menos una vez. Es diferente de las "Impresiones", que cuenta cuántas veces apareció el anuncio (una persona puede verlo varias veces).</p>'
  },

  // --- MÓDULO: SEGURIDAD ---
  {
    id: 'faq-seg-1', type: 'faq', moduleId: 'seguridad',
    title: '¿Dónde están mis datos?',
    guiaContenido: '<p>MarketIA aloja todos tus datos (incluidas sesiones de WhatsApp y bases de datos de leads) en servidores de altísima seguridad respaldados por infraestructura Cloud Tier-1 con cifrado en reposo y en tránsito.</p>'
  },

  // --- MÓDULO: SOPORTE ---
  {
    id: 'faq-sop-1', type: 'faq', moduleId: 'soporte',
    title: '¿Cómo contactar soporte?',
    guiaContenido: '<p>Puedes utilizar nuestro sistema interno de Tickets desde el menú, o enviar un correo directamente a <strong>soporte@marketdev.com</strong>. Nuestro tiempo de respuesta promedio es inferior a 2 horas en días hábiles.</p>'
  },

  // ==========================================
  // GUÍAS ESCRITAS Y RECURSOS
  // ==========================================
  {
    id: 'guide-camp-1', type: 'guide', moduleId: 'campanas',
    title: 'Manual Completo: Desde cero a tu primera campaña rentable',
    description: 'Aprende los fundamentos del marketing automatizado.',
    guiaContenido: `
      <h2>1. Preparación del terreno</h2>
      <p>Antes de lanzar anuncios, asegúrate de que tu perfil de empresa tenga tu <strong>WhatsApp conectado</strong>. Ese será tu punto de cierre de ventas.</p>
      
      <h2>2. Deja trabajar a la IA</h2>
      <p>No sobre-pienses el texto. Dile a la IA exactamente qué vendes y a quién, con palabras simples: <em>"Vendo pasteles de boda en Santo Domingo a novias exigentes"</em>. La IA se encargará de utilizar técnicas de Copywriting profesional.</p>

      <h2>3. El presupuesto inteligente</h2>
      <p>Te recomendamos comenzar con $5 a $10 dólares diarios durante 5 días. Esto le da tiempo al algoritmo de Meta y a nuestra plataforma para encontrar tu público ideal (Fase de Aprendizaje).</p>
    `
  },
  {
    id: 'guide-leads-1', type: 'guide', moduleId: 'leads',
    title: '¿Cómo tratar a un Lead que llegó por WhatsApp?',
    description: 'Protocolo de ventas recomendado.',
    guiaContenido: `
      <h2>La velocidad lo es todo</h2>
      <p>Cuando MarketIA te envíe un Lead a tu WhatsApp, respóndele en menos de <strong>5 minutos</strong>. La probabilidad de cierre disminuye drásticamente después del minuto 10.</p>
      
      <h2>No vendas características, vende soluciones</h2>
      <p>En lugar de decir <em>"Nuestra suscripción cuesta $20 y tiene 10 funciones"</em>, dile <em>"Con esto podrás ahorrarte 15 horas de trabajo a la semana"</em>.</p>
    `
  }
];
