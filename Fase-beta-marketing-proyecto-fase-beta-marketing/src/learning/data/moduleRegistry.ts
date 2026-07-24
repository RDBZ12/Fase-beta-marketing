import type { Step } from 'react-joyride';

export interface LearningResource {
  id: string;
  title: string;
  url: string;
  type: 'video' | 'pdf' | 'article';
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface LearningIntent {
  intentId: string;
  keywords: string[];
  response: string;
  action?: () => void;
}

export interface LearningFlow {
  id: string;
  name: string;
  description: string;
  steps: Step[];
}

export interface LearningModule {
  id: string;
  name: string;
  description: string;
  targetAudience: 'client' | 'admin' | 'all';
  flows: LearningFlow[];
  intents: LearningIntent[];
  resources: LearningResource[];
  faqs: FAQ[];
}

export const moduleRegistry: Record<string, LearningModule> = {
  LOGIN_WIZARD: {
    id: 'LOGIN_WIZARD',
    name: 'Bienvenida e Inicio de Sesión',
    description: 'Conoce cómo acceder al sistema MarketIA.',
    targetAudience: 'all',
    flows: [
      {
        id: 'FLOW_LOGIN_WELCOME',
        name: 'Tour de Bienvenida',
        description: 'Recorrido inicial por la pantalla de inicio de sesión.',
        steps: [
          {
            target: '#tour-login-client-checklist',
            content: 'Aquí te explicamos los pasos rápidos para acceder a la plataforma. No te preocupes si no tienes cuenta, te la crearemos automáticamente.',
            placement: 'bottom',
            // @ts-ignore
            disableBeacon: true,
          },
          {
            target: '#tour-login-client-google',
            content: 'Haz clic en este botón para iniciar sesión de forma segura y directa con tu cuenta de Google.',
            placement: 'top',
          }
        ]
      }
    ],
    intents: [],
    resources: [],
    faqs: []
  },
  CLIENT_DASHBOARD: {
    id: 'CLIENT_DASHBOARD',
    name: 'Panel Principal (Dashboard)',
    description: 'Resumen general del rendimiento y campañas activas.',
    targetAudience: 'client',
    flows: [
      {
        id: 'FLOW_CLIENT_PANEL_OVERVIEW',
        name: 'Conoce tu Panel de Control',
        description: 'Aprende a revisar las métricas de tus campañas y comenzar nuevos proyectos.',
        steps: [
          {
            target: '#tour-client-kpi-reach',
            content: 'Aquí puedes ver el impacto total estimado que están generando tus campañas activas.',
            placement: 'bottom',
            // @ts-ignore
            disableBeacon: true,
          },
          {
            target: '#tour-client-campaigns-table',
            content: 'En esta tabla encontrarás todas tus campañas. Presta atención al estado (Borrador, Revisión o Activa).',
            placement: 'top',
          },
          {
            target: '#tour-btn-new-campaign',
            content: 'Cuando estés listo para crear algo nuevo, haz clic aquí. Nuestra IA te guiará paso a paso.',
            placement: 'left',
          }
        ]
      }
    ],
    intents: [
      {
        intentId: 'INTENT_VIEW_CAMPAIGNS',
        keywords: ['ver campañas', 'mis proyectos', 'donde están mis campañas'],
        response: 'Puedes ver todas tus campañas en la tabla principal del Panel.'
      }
    ],
    resources: [],
    faqs: [
      { question: '¿Qué significa estado en Borrador?', answer: 'Son campañas que no has terminado de crear o no has enviado a revisión.' }
    ]
  },
  CAMPAIGN_WIZARD: {
    id: 'CAMPAIGN_WIZARD',
    name: 'Asistente de Campañas (IA)',
    description: 'Motor de creación de campañas usando Inteligencia Artificial.',
    targetAudience: 'client',
    flows: [
      {
        id: 'FLOW_CAMPAIGN_WIZARD',
        name: 'Crear Campaña con IA',
        description: 'Crea tu primera campaña con Inteligencia Artificial.',
        steps: [
          {
            target: '#tour-cw-basics',
            content: 'Ingresa el nombre, la descripción y el presupuesto de tu campaña. Asegúrate de ser descriptivo para que la IA entienda tu negocio.',
            placement: 'bottom',
            // @ts-ignore
            disableBeacon: true,
          },
          {
            target: '#tour-cw-targeting',
            content: 'Define tu audiencia objetivo y las fechas en las que la campaña estará activa.',
            placement: 'top',
          },
          {
            target: '#tour-cw-ai-generation',
            content: '¡La magia sucede aquí! La IA redactará los textos, sugerirá estrategias y hashtags en base a la información anterior.',
            placement: 'top',
          },
          {
            target: '#tour-cw-review',
            content: 'Revisa cuidadosamente los textos e imágenes sugeridas por la IA. Puedes regenerar las imágenes si lo deseas.',
            placement: 'right',
          },
          {
            target: '#tour-cw-approve',
            content: 'Una vez estés conforme, aprueba la estrategia. Tu campaña pasará a revisión y pago.',
            placement: 'top',
          }
        ]
      }
    ],
    intents: [
      {
        intentId: 'INTENT_CREATE_CAMPAIGN',
        keywords: ['crear campaña', 'como hago un anuncio', 'nueva campaña'],
        response: 'Para crear una campaña, haz clic en el botón "Crear Campaña" ubicado en tu panel principal.'
      }
    ],
    resources: [
      { id: 'RES_CW_1', title: 'Cómo escribir descripciones para la IA', url: '#', type: 'video' }
    ],
    faqs: [
      { question: '¿Qué presupuesto debo elegir?', answer: 'Recomendamos un mínimo de $1,500 DOP para ver resultados iniciales.' }
    ]
  },
  CLIENT_PAGOS: {
    id: 'CLIENT_PAGOS',
    name: 'Pagos e Inversión',
    description: 'Gestión de facturación y pagos de campañas.',
    targetAudience: 'client',
    flows: [
      {
        id: 'FLOW_CLIENT_PAGOS',
        name: 'Gestión de Pagos e-NCF',
        description: 'Controla tu inversión y descarga tus facturas válidas para crédito fiscal.',
        steps: [
          {
            target: '#tour-pagos-kpi',
            content: 'Esta tarjeta muestra tu inversión total. Puedes hacer clic en el botón de la esquina para cambiar entre USD y DOP.',
            placement: 'bottom',
            // @ts-ignore
            disableBeacon: true,
          },
          {
            target: '#tour-pagos-history',
            content: 'Aquí verás el historial completo de tus pagos, incluyendo desglose de ITBIS.',
            placement: 'top',
          },
          {
            target: '#tour-pagos-download',
            content: 'Al aprobarse un pago, podrás descargar instantáneamente tu comprobante electrónico de crédito fiscal (e-NCF) en formato PDF.',
            placement: 'left',
          }
        ]
      }
    ],
    intents: [
      {
        intentId: 'INTENT_DOWNLOAD_NCF',
        keywords: ['descargar factura', 'comprobante fiscal', 'e-ncf'],
        response: 'Puedes descargar tu factura visitando la pestaña de Pagos y haciendo clic en el botón "PDF" junto a las transacciones aprobadas.'
      }
    ],
    resources: [
      { id: 'RES_PAGOS_1', title: 'Guía de Comprobantes Fiscales', url: '#', type: 'pdf' }
    ],
    faqs: [
      { question: '¿Cuándo se emite mi factura electrónica?', answer: 'Inmediatamente después de que se apruebe tu pago, podrás descargar el e-NCF válido para crédito fiscal.' },
      { question: '¿Qué es el Monto Gravado?', answer: 'Es el valor base de tu inversión antes de aplicar los impuestos correspondientes.' }
    ]
  },
  CLIENT_PUBLICACIONES: {
    id: 'CLIENT_PUBLICACIONES',
    name: 'Gestión de Publicaciones',
    description: 'Administración de posts generados y revisión de contenido.',
    targetAudience: 'client',
    flows: [
      {
        id: 'FLOW_CLIENT_PUBLICACIONES',
        name: 'Revisión de Publicaciones',
        description: 'Edita y aprueba los posts para tus redes sociales.',
        steps: [
          {
            target: '#tour-pub-filter',
            content: 'Selecciona una campaña de la lista para ver las publicaciones asociadas a ella.',
            placement: 'bottom',
            // @ts-ignore
            disableBeacon: true,
          },
          {
            target: '#tour-pub-actions',
            content: 'Puedes editar el texto de la publicación, cambiar la imagen o ajustar la fecha programada.',
            placement: 'right',
          },
          {
            target: '#tour-pub-grid',
            content: 'Una vez que la publicación esté lista, apruébala para que sea publicada automáticamente en la fecha indicada.',
            placement: 'top',
          }
        ]
      }
    ],
    intents: [
      {
        intentId: 'INTENT_EDIT_POST',
        keywords: ['editar publicación', 'cambiar texto', 'modificar post', 'corregir imagen'],
        response: 'Para editar una publicación, selecciona la campaña y haz clic en el botón de edición de la publicación deseada. Allí podrás modificar el texto, la imagen o la fecha.'
      },
      {
        intentId: 'INTENT_APPROVE_POST',
        keywords: ['aprobar', 'como apruebo', 'enviar a publicar'],
        response: 'Una vez estés satisfecho con los cambios, asegúrate de aprobar la publicación para que nuestro sistema la publique automáticamente en la fecha acordada.'
      }
    ],
    resources: [],
    faqs: [
      { question: '¿Puedo cambiar la fecha de publicación?', answer: 'Sí, al editar una publicación puedes reprogramar el día y la hora exactos.' }
    ]
  },
  CLIENT_ESTADISTICAS: {
    id: 'CLIENT_ESTADISTICAS',
    name: 'Módulo de Estadísticas',
    description: 'KPIs en tiempo real de interacciones.',
    targetAudience: 'client',
    flows: [
      {
        id: 'FLOW_CLIENT_ESTADISTICAS',
        name: 'Analizando tus Resultados',
        description: 'Descubre cómo interpretar las métricas de tus campañas.',
        steps: [
          {
            target: '#tour-stats-kpi',
            content: 'Estas tarjetas muestran un resumen rápido de tu impacto: alcance, clics, leads.',
            placement: 'bottom',
            // @ts-ignore
            disableBeacon: true,
          },
          {
            target: '#tour-stats-ig',
            content: 'Aquí verás el rendimiento real de tus publicaciones recientes extraído directamente desde Instagram.',
            placement: 'top',
          }
        ]
      }
    ],
    intents: [
      {
        intentId: 'INTENT_VIEW_STATS',
        keywords: ['ver estadisticas', 'resultados', 'rendimiento', 'impacto', 'alcance'],
        response: 'Puedes ver el rendimiento detallado de tus campañas en el módulo de Estadísticas, que muestra datos extraídos directamente de las plataformas sociales.'
      }
    ],
    resources: [],
    faqs: [
      { question: '¿Con qué frecuencia se actualizan las métricas?', answer: 'Las métricas se sincronizan en tiempo real directamente desde las plataformas sociales (como Instagram y Facebook).' },
      { question: '¿Qué significa CTR?', answer: 'CTR (Click-Through Rate) es el porcentaje de personas que hicieron clic en tu anuncio en relación con el total de personas que lo vieron.' }
    ]
  }
};
