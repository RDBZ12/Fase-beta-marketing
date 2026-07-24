// src/learning/data/flows.ts
// Flujos de aprendizaje basados en expectedState (datos tipados en lugar de selectores DOM)

export type StateSource = 'campaignWizard' | 'profileSettings' | 'globalUI';

export interface ExpectedStateDef {
  source: StateSource;
  stateKey: string;
  operator: 'notEmpty' | 'greaterThan' | 'equals';
  expectedValue?: any;
  errorMessage: string;
}

export interface StepDef {
  target: string; // Utilizado únicamente como ancla visual para colgar el tooltip
  placement?: string;
  title: string;
  content: string;
  helpText?: string;
  requiresAction?: boolean;
  actionId?: string;
  condition?: (state: any) => boolean;
  expectedState?: ExpectedStateDef;
}

export const flowSteps: Record<string, StepDef[]> = {

  // ── 1. ONBOARDING INICIAL ─────────────────────────────────────────────
  GLOBAL_ONBOARDING: [
    {
      target: 'body',
      placement: 'center',
      title: '¡Bienvenido a Marketdev! 🚀',
      content: 'Hola, soy tu asistente personal de marketing. Voy a guiarte paso a paso por todo el portal para que no te pierdas nada. ¡Vamos!',
      expectedState: {
        source: 'globalUI',
        stateKey: 'onboardingWelcome',
        operator: 'equals',
        expectedValue: true,
        errorMessage: 'Acepta el mensaje inicial para continuar.'
      }
    },
    {
      target: '#tour-sidebar-panel',
      placement: 'right',
      title: 'Mis Campañas',
      content: 'Esta es tu sección principal. Aquí verás el estado de todas tus campañas, el alcance semanal, los leads generados y el presupuesto invertido en tiempo real.',
      helpText: 'Haz clic en cualquier campaña para ver sus publicaciones y estadísticas detalladas.',
      expectedState: {
        source: 'globalUI',
        stateKey: 'currentScreen',
        operator: 'equals',
        expectedValue: 'campaigns',
        errorMessage: 'Haz clic en Mis Campañas.'
      }
    },
    {
      target: '#tour-btn-new-campaign',
      placement: 'bottom',
      title: '¡Crea tu primera campaña! ✨',
      content: 'Nuestra IA genera el contenido, las imágenes y la estrategia completa en menos de 3 minutos. Haz clic en "Crear Campaña" para comenzar el proceso ahora.',
      helpText: 'Puedes revisar y editar todo antes de publicar. ¡No te preocupes!',
      requiresAction: true,
      actionId: 'click_new_campaign',
      expectedState: {
        source: 'globalUI',
        stateKey: 'currentModal',
        operator: 'equals',
        expectedValue: 'campaignWizard',
        errorMessage: 'Haz clic en Crear Campaña para continuar.'
      }
    },
  ],

  // ── 2. CREACIÓN DE CAMPAÑA (FORMULARIO DETALLADO Y RAMIFICADO - 14 PASOS) ──
  CREATE_CAMPAIGN: [
    {
      target: '#tour-sidebar-panel',
      placement: 'right',
      title: 'Ir a Mis Campañas 📋',
      content: 'Para crear una nueva campaña, primero debemos dirigirnos a la sección "Mis Campañas" en el menú de la izquierda.',
      helpText: 'Haz clic en "Mis Campañas" en el menú lateral para avanzar.',
      requiresAction: true,
      actionId: 'click_sidebar_panel',
      expectedState: {
        source: 'globalUI',
        stateKey: 'currentScreen',
        operator: 'equals',
        expectedValue: 'campaigns',
        errorMessage: 'Ve a la sección Mis Campañas.'
      }
    },
    {
      target: '#tour-btn-new-campaign',
      placement: 'bottom',
      title: 'Crear campaña',
      content: '¡Excelente! Ahora haz clic en el botón "Crear Campaña" para abrir el asistente inteligente.',
      requiresAction: true,
      actionId: 'click_new_campaign',
      expectedState: {
        source: 'globalUI',
        stateKey: 'currentModal',
        operator: 'equals',
        expectedValue: 'campaignWizard',
        errorMessage: 'Abre el Wizard de Campaña.'
      }
    },
    {
      target: '#tour-cw-name',
      placement: 'right',
      title: 'Nombre de tu negocio 🏢',
      content: 'Escribe el nombre oficial o marca de tu negocio en la primera casilla.',
      helpText: 'Ej: "Moda Exclusiva Bella" o "Repostería El Dulce Sabor".',
      expectedState: {
        source: 'campaignWizard',
        stateKey: 'businessName',
        operator: 'notEmpty',
        errorMessage: 'Por favor, escribe el nombre de tu negocio.'
      }
    },
    {
      target: '#tour-cw-budget',
      placement: 'right',
      title: 'Presupuesto de Campaña 💵',
      content: 'Ingresa el monto en dólares ($USD) que deseas invertir para los anuncios (mínimo sugerido $350 USD).',
      helpText: 'Nuestra IA optimizará este presupuesto entre los canales que elijas.',
      expectedState: {
        source: 'campaignWizard',
        stateKey: 'budget',
        operator: 'greaterThan',
        expectedValue: 349,
        errorMessage: 'Por favor, introduce un presupuesto mayor o igual a 350.'
      }
    },
    {
      target: '#tour-cw-description',
      placement: 'right',
      title: 'Descripción de Negocio 📝',
      content: 'Describe detalladamente qué vende tu negocio o qué servicios ofreces para que la IA genere copys atractivos.',
      helpText: 'Ej: "Somos un taller mecánico a domicilio especializado en Santo Domingo".',
      expectedState: {
        source: 'campaignWizard',
        stateKey: 'description',
        operator: 'notEmpty',
        errorMessage: 'Escribe una breve descripción del negocio.'
      }
    },
    {
      target: '#tour-cw-audience',
      placement: 'right',
      title: 'Público Objetivo 🎯',
      content: 'Selecciona del menú desplegable el perfil de clientes ideal para tus productos.',
      helpText: 'Elige de las opciones sugeridas la que mejor encaje.',
      expectedState: {
        source: 'campaignWizard',
        stateKey: 'audience',
        operator: 'notEmpty',
        errorMessage: 'Selecciona un público objetivo.'
      }
    },
    {
      target: '#tour-cw-objective',
      placement: 'right',
      title: 'Objetivo de Campaña 🚀',
      content: 'Indica si deseas capturar datos de clientes (Leads), visitas a tu web o alcance general.',
      helpText: 'Este objetivo alineará el comportamiento del bot de inteligencia artificial.',
      expectedState: {
        source: 'campaignWizard',
        stateKey: 'objective',
        operator: 'notEmpty',
        errorMessage: 'Selecciona un objetivo para tu campaña.'
      }
    },
    {
      target: '#tour-cw-dates',
      placement: 'top',
      title: 'Fecha de Inicio 📅',
      content: 'Elige el día de inicio para el lanzamiento de la publicidad en redes sociales.',
      helpText: 'Normalmente se recomienda iniciar al día siguiente de la creación.',
      expectedState: {
        source: 'campaignWizard',
        stateKey: 'startDate',
        operator: 'notEmpty',
        errorMessage: 'Elige una fecha de inicio.'
      }
    },
    {
      target: '#tour-cw-dates',
      placement: 'top',
      title: 'Fecha de Fin 📅',
      content: 'Define el último día de circulación de los anuncios publicitarios.',
      helpText: 'Debe ser posterior a la fecha de inicio seleccionada.',
      expectedState: {
        source: 'campaignWizard',
        stateKey: 'endDate',
        operator: 'notEmpty',
        errorMessage: 'Elige una fecha de fin.'
      }
    },
    {
      target: '#tour-cw-social',
      placement: 'top',
      title: 'Red Social de Destino 📱',
      content: 'Selecciona en qué canal deseas que se distribuya el contenido publicitario generado.',
      helpText: 'Elige Instagram, Facebook o Canales Combinados.',
      expectedState: {
        source: 'campaignWizard',
        stateKey: 'socialNetwork',
        operator: 'notEmpty',
        errorMessage: 'Selecciona al menos una red social.'
      }
    },
    {
      target: '#tour-cw-time',
      placement: 'top',
      title: 'Hora Programada (Opcional) ⏰',
      content: 'Define a qué hora del día prefieres que se publiquen automáticamente las publicaciones.',
      helpText: 'Puedes dejarlo vacío para que el sistema publique de forma inmediata.'
    },
    {
      target: '#tour-cw-images',
      placement: 'top',
      title: 'Imágenes de la Campaña 🖼️',
      content: 'Elige cómo asociar imágenes a tu campaña. Puedes subirlas desde tu computadora o generar imágenes nuevas con Inteligencia Artificial de forma instantánea.',
      helpText: 'Presiona "Siguiente" para continuar hacia el botón de generación de estrategia.'
    },
    {
      target: '#tour-cw-ai-generation',
      placement: 'top',
      title: 'Generar con Inteligencia Artificial ✨',
      content: 'Haz clic en "Generar Estrategia con IA" para iniciar el motor creativo inteligente.',
      requiresAction: true,
      actionId: 'click_ai_generate'
    },
    {
      target: '#tour-cw-review',
      placement: 'left',
      title: 'Revisión del Contenido 👁️',
      content: 'La IA ha generado tu anuncio: copy, creativos e imágenes. Puedes editarlos libremente.',
      helpText: 'Haz clic en "Siguiente" para continuar hacia el pago.'
    },
    {
      target: '#tour-cw-approve',
      placement: 'top',
      title: 'Aprobar y Proceder al Pago 💳',
      content: 'Haz clic en "Aprobar y Proceder al Pago" para lanzar tu campaña al público.',
      requiresAction: true,
      actionId: 'click_approve_campaign',
      expectedState: {
        source: 'globalUI',
        stateKey: 'currentWizardStep',
        operator: 'equals',
        expectedValue: 4,
        errorMessage: 'Haz clic en Aprobar y Proceder al Pago.'
      }
    },
  ],

  // ── 3. VINCULACIÓN DE WHATSAPP / PERFIL (7 PASOS) ──────────────────────
  PROFILE_TOUR: [
    {
      target: '#tour-sidebar-perfil',
      placement: 'right',
      title: 'Ir a Mi Perfil ⚙️',
      content: 'Para configurar tus datos fiscales y vincular WhatsApp, primero haz clic en "Mi Perfil" en la barra lateral.',
      requiresAction: true,
      actionId: 'click_sidebar_perfil'
    },
    {
      target: '#tour-profile-empresa',
      placement: 'right',
      title: 'Configura tu Razón Social 🏢',
      content: 'Ingresa el nombre oficial de tu empresa para la emisión de comprobantes fiscales homologados.',
      helpText: 'Presiona "Siguiente" para continuar.'
    },
    {
      target: '#tour-profile-rnc',
      placement: 'right',
      title: 'RNC o Cédula Dominicana 🇩🇴',
      content: 'Escribe el número de identificación fiscal (9 u 11 dígitos).',
      helpText: 'Presiona "Siguiente" para continuar.'
    },
    {
      target: '#tour-profile-save-billing',
      placement: 'top',
      title: 'Guardar configuración fiscal 💾',
      content: 'Haz clic en "Guardar Datos de Facturación" para conservar la configuración.',
      requiresAction: true,
      actionId: 'click_save_billing'
    },
    {
      target: '#tour-profile-phone',
      placement: 'right',
      title: 'Teléfono de WhatsApp 📞',
      content: 'Ingresa tu número celular incluyendo el código de país (ej: +1...).',
      helpText: 'Presiona "Siguiente" para continuar.'
    },
    {
      target: '#tour-profile-connect-btn',
      placement: 'left',
      title: 'Vincular Dispositivo 📲',
      content: 'Haz clic en "Vincular Dispositivo" para abrir la sesión de WhatsApp Web.',
      requiresAction: true,
      actionId: 'click_connect_whatsapp'
    },
    {
      target: '#tour-profile-status',
      placement: 'top',
      title: 'Estado de la sesión y QR 🔗',
      content: 'Si es tu primera vinculación, verás el código QR dinámico. Escanéalo desde tu teléfono móvil.',
      helpText: 'Haz clic en "Finalizar" para concluir el recorrido.'
    }
  ],

  // ── 4. MIS PUBLICACIONES ───────────────────────────────────────────
  MIS_PUBLICACIONES: [
    {
      target: '#tour-sidebar-mis-publicaciones',
      placement: 'right',
      title: 'Ir a Mis Publicaciones 📱',
      content: 'Haz clic en "Mis Publicaciones" en el menú de la izquierda para abrir el gestor de posts.',
      requiresAction: true,
      actionId: 'click_sidebar_mis-publicaciones'
    },
    {
      target: '#tour-pub-title',
      placement: 'bottom',
      title: 'Historial de Publicaciones 📋',
      content: 'Aquí verás todo tu feed planificado, tanto posts pasados como los programados para el futuro.',
      helpText: 'Presiona "Siguiente" para continuar.'
    },
    {
      target: '#tour-pub-search',
      placement: 'bottom',
      title: 'Buscador y Filtros 🔍',
      content: 'Escribe palabras clave para filtrar rápidamente tus publicaciones por título, red o contenido.',
      helpText: 'Presiona "Siguiente" para continuar.'
    },
    {
      target: '#tour-pub-edit-btn',
      placement: 'right',
      title: 'Editar Publicación ✏️',
      content: 'Haz clic aquí para corregir o cambiar el copy, la fecha/hora programada o la imagen de una publicación antes de que salga al aire.',
      helpText: 'Presiona "Siguiente" para continuar.'
    },
    {
      target: '#tour-pub-replicate-btn',
      placement: 'right',
      title: 'Compartir en otra Red Social 🔁',
      content: 'Este botón te permite clonar exactamente este post para publicarlo en otra de tus redes vinculadas (como Facebook o Telegram).',
      helpText: 'Presiona "Siguiente" para continuar.'
    },
    {
      target: '#tour-pub-create-btn',
      placement: 'bottom',
      title: 'Nueva Publicación ➕',
      content: 'Haz clic en el botón morado "Nueva Publicación" para abrir el editor asistido por IA.',
      requiresAction: true,
      actionId: 'click_new_publication'
    },
    {
      target: '#tour-pub-modal-assoc',
      placement: 'bottom',
      title: 'Asociar a Campaña 🔗',
      content: 'Si deseas asociar esta publicación a una de tus campañas de marketing para medir su retorno, búscala y selecciónala aquí.',
      helpText: 'Es opcional. Presiona "Siguiente" para continuar.'
    },
    {
      target: '#tour-pub-modal-title',
      placement: 'bottom',
      title: 'Tema o Título 💡',
      content: 'Ingresa un título descriptivo o un tema breve. Servirá de base si decides generar el texto utilizando inteligencia artificial.',
      helpText: 'Haz clic en "Siguiente" para continuar.'
    },
    {
      target: '#tour-pub-modal-copy',
      placement: 'top',
      title: 'Contenido y Redacción con IA 📝',
      content: 'Escribe el copy de tu publicación o presiona el botón "Generar con IA" para redactar un texto persuasivo automáticamente.',
      helpText: 'Haz clic en "Siguiente" para continuar.'
    },
    {
      target: '#tour-pub-modal-social',
      placement: 'top',
      title: 'Red Social Destino 🌐',
      content: 'Elige la plataforma (Instagram, Facebook, etc.) donde deseas publicar este contenido.',
      helpText: 'Haz clic en "Siguiente" para continuar.'
    },
    {
      target: '#tour-pub-modal-schedule',
      placement: 'top',
      title: 'Programar Fecha y Hora ⏰',
      content: 'Elige el día y la hora exacta en la que tu publicación debe salir al aire de manera automática.',
      helpText: 'Haz clic en "Siguiente" para continuar.'
    },
    {
      target: '#tour-pub-modal-media',
      placement: 'top',
      title: 'Multimedia y Generador de Imagen IA 🎨',
      content: 'Sube un archivo desde tu PC o haz clic en "Generar Imagen con IA" para crear una pieza gráfica original y lista para usar.',
      helpText: 'Haz clic en "Siguiente" para continuar.'
    },
    {
      target: '#tour-pub-modal-submit',
      placement: 'top',
      title: 'Guardar y Lanzar Post 🚀',
      content: 'Una vez todo esté listo, haz clic en "Publicar Ahora" o "Programar Publicación". ¡La plataforma se encargará de lo demás!',
      helpText: 'Haz clic en "Finalizar" para concluir este tutorial.'
    }
  ],

  // ── 5. PAGOS Y FACTURAS ───────────────────────────────────────────
  PAGOS: [
    {
      target: '#tour-sidebar-pagos',
      placement: 'right',
      title: 'Ir a Pagos 💳',
      content: 'Haz clic en "Pagos" en el menú de la izquierda. (Nota: También puedes pagar tus campañas directamente desde la pestaña "Mis Campañas" abriendo su detalle).',
      requiresAction: true,
      actionId: 'click_sidebar_pagos'
    },
    {
      target: '#tour-pagos-cards-container',
      placement: 'top',
      title: 'Tarjetas de Control de Inversión 📊',
      content: 'Aquí verás tu balance total facturado, gráfico de comportamiento de ingresos y detalles de la pasarela de PayPal.',
      helpText: 'Presiona "Siguiente" para continuar.'
    },
    {
      target: '#tour-pagos-table-pending',
      placement: 'top',
      title: 'Campañas Pendientes de Pago 📋',
      content: 'Localiza tu campaña en estado "Pendiente de Pago" y haz clic en el botón morado "Pagar" para abrir la ventana de facturación.',
      requiresAction: true,
      actionId: 'click_pay_campaign',
      expectedState: {
        source: 'globalUI',
        stateKey: 'currentModal',
        operator: 'equals',
        expectedValue: 'paymentModal',
        errorMessage: 'Haz clic en Pagar para abrir el asistente de facturación.'
      }
    },
    {
      target: '#tour-pay-amount',
      placement: 'top',
      title: 'Presupuesto de Campaña 💵',
      content: 'Este campo muestra el presupuesto base asignado en dólares ($USD) para la difusión de tu campaña.',
      helpText: 'Es un valor de sólo lectura.'
    },
    {
      target: '#tour-pay-rnc',
      placement: 'right',
      title: 'Identificación Fiscal / RNC 🇩🇴',
      content: 'Escribe tu Registro Nacional de Contribuyentes (RNC) o Cédula dominicana. Esto generará la factura con comprobante válido para crédito fiscal.',
      helpText: 'Ej: 1-31-00000-0. Presiona "Siguiente" para continuar.'
    },
    {
      target: '#tour-pay-name',
      placement: 'left',
      title: 'Razón Social de tu Empresa 🏢',
      content: 'Ingresa el nombre comercial o razón social correspondiente al comprobante fiscal electrónico.',
      helpText: 'Haz clic en "Siguiente" para avanzar.'
    },
    {
      target: '#tour-pay-paypal',
      placement: 'top',
      title: 'Procesar Pago Seguro con PayPal 💳',
      content: 'Usa los botones amarillos para ingresar a PayPal y completar la transacción segura (incluyendo saldo o tarjeta de crédito).',
      helpText: 'Una vez aprobado, el servidor validará el estatus.'
    },
    {
      target: '#tour-pay-success',
      placement: 'top',
      title: '¡Pago Exitoso y Comprobante DGII! 🎉',
      content: 'El pago se ha acreditado, activando tu campaña. La factura e-NCF con firma digital y código QR se descargará de inmediato.',
      helpText: 'Haz clic en "Siguiente" para ver cómo descargar y verificar el comprobante.'
    },
    {
      target: '#tour-pagos-download',
      placement: 'top',
      title: 'Descargar Comprobante Fiscal (PDF) 📄',
      content: 'Una vez pagada, puedes volver a descargar la factura oficial en PDF en cualquier momento haciendo clic en este botón de descarga.',
      helpText: 'Presiona "Siguiente" para ver la validación QR.'
    },
    {
      target: '#tour-pagos-download',
      placement: 'left',
      title: 'Validación con la DGII 📱',
      content: 'Al abrir el PDF impreso, verás un código QR. Escanearlo con tu celular te redirigirá a la consulta pública de la Dirección General de Impuestos Internos (DGII) para verificar que el comprobante fiscal (e-NCF) es 100% auténtico.',
      helpText: 'Haz clic en "Finalizar" para concluir el recorrido.'
    }
  ],

  // ── 6. ESTADÍSTICAS Y RENDIMIENTO ─────────────────────────────────
  ESTADISTICAS: [
    {
      target: '#tour-sidebar-estadisticas',
      placement: 'right',
      title: 'Ir a Estadísticas 📊',
      content: 'Vamos a ver los resultados. Haz clic en "Estadísticas" en la barra de navegación.',
      requiresAction: true,
      actionId: 'click_sidebar_estadisticas',
      expectedState: {
        source: 'globalUI',
        stateKey: 'currentScreen',
        operator: 'equals',
        expectedValue: 'estadisticas',
        errorMessage: 'Ve a la sección de Estadísticas.'
      }
    },
    {
      target: '#tour-stats-kpi',
      placement: 'bottom',
      title: 'Métricas de Rendimiento',
      content: 'Aquí verás el CTR promedio, los leads generados y tu alcance histórico de todas tus redes conectadas.',
      expectedState: {
        source: 'globalUI',
        stateKey: 'currentScreen',
        operator: 'equals',
        expectedValue: 'estadisticas',
        errorMessage: 'Visualiza el KPI de estadísticas.'
      }
    }
  ]
};
