# Matriz de Pruebas Funcionales (QA Técnico) - MarketIA v1.0

Esta matriz debe ejecutarse rigurosamente por el equipo técnico antes del paso a producción. Si un caso falla, debe ser documentado y corregido antes de desplegar.

## 1. Módulo: Academia y Aprendizaje
| Acción | Precondición | Resultado Esperado | Estado |
| :--- | :--- | :--- | :--- |
| **Entrar por primera vez** | Storage/DB vacíos | Aparece modal de bienvenida del Instructor IA invitando a iniciar. | ⬜ |
| **Comenzar desde cero** | Clic en el botón Iniciar | El `LearningTour` comienza en el Dashboard y avanza guiando al usuario. | ⬜ |
| **Navegar en tour** | Tour activo | Las alertas (tooltips) apuntan exactamente a los elementos correctos del DOM. | ⬜ |
| **Pausar tour** | Tour activo (paso intermedio) | El estado se guarda en BD. El modal desaparece pero el Instructor queda minimizado indicando pausa. | ⬜ |
| **Continuar tour** | Tour pausado | Al reanudar, se abre exactamente el mismo paso donde se quedó. | ⬜ |
| **Reiniciar aprendizaje** | Progreso existente | Se limpian los registros (DB) y el usuario puede empezar de cero. | ⬜ |
| **Instructor Contextual** | Fuera de un tour | Al presionar Ayuda/Qué hago, la IA responde indicando qué pantalla está viendo. | ⬜ |

## 2. Módulo: Mis Campañas
| Acción | Precondición | Resultado Esperado | Estado |
| :--- | :--- | :--- | :--- |
| **Crear campaña** | Clic en Nuevo Proyecto | El Wizard de IA se abre sin errores. | ⬜ |
| **Completar wizard** | Todos los pasos completos | Los datos (presupuesto, descripción, audiencia) se guardan en la DB correctamente. | ⬜ |
| **Validaciones** | Dejar campos vacíos | El sistema bloquea el avance al siguiente paso mostrando error visual. | ⬜ |
| **Generación IA** | Paso final del Wizard | La IA propone textos/imágenes coherentes con el input del usuario. | ⬜ |
| **Cancelación** | Cerrar wizard a medias | Los datos temporales se limpian y la interfaz vuelve a la normalidad sin campañas "fantasmas". | ⬜ |

## 3. Módulo: Mis Publicaciones
| Acción | Precondición | Resultado Esperado | Estado |
| :--- | :--- | :--- | :--- |
| **Ver publicaciones** | Campaña seleccionada | Muestra los posts filtrados exclusivamente para esa campaña. | ⬜ |
| **Editar publicación** | Clic en Editar | Permite cambiar texto, hora e imagen. Los cambios se reflejan al guardar. | ⬜ |
| **Aprobar publicación** | Estado 'Borrador' | Cambia de estado a 'Aprobada/Programada'. | ⬜ |

## 4. Módulo: Pagos
| Acción | Precondición | Resultado Esperado | Estado |
| :--- | :--- | :--- | :--- |
| **Historial de pagos** | Transacciones existentes | La tabla muestra todos los cobros con sus estatus (Pagado/Pendiente). | ⬜ |
| **Descargar NCF** | Pago aprobado | Genera y descarga correctamente el PDF del e-NCF formateado. | ⬜ |
| **Escaneo QR** | PDF generado | El código QR contenido en la factura dirige a la validación en DGII (si aplica). | ⬜ |

## 5. Módulo: Estadísticas
| Acción | Precondición | Resultado Esperado | Estado |
| :--- | :--- | :--- | :--- |
| **Carga de KPIs** | Entrar al módulo | Los KPIs globales (alcance, clics, leads) cargan sin delay masivo. | ⬜ |
| **Filtros** | Cambiar rango de fechas | Las gráficas y tablas se actualizan dinámicamente según el periodo. | ⬜ |
| **Gráficos** | Datos existentes | Las gráficas `recharts` renderizan sin romper el layout en pantallas móviles y desktop. | ⬜ |
