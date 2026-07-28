# Diseño de Sistema — Sistema Inteligente de Marketing con IA

> Documento de referencia funcional para el desarrollo del sistema. Basado en el diseño original del proyecto académico (UTESA, Proyecto Integrador). Este archivo es la fuente de verdad para Antigravity al completar los módulos pendientes del sistema.

---

## 1. Contexto del problema

La empresa (sector tabaquero) realiza sus actividades de marketing mediante procesos manuales: publicaciones en redes sociales, coordinación entre departamentos, atención a clientes y elaboración de reportes dependen de actividades ejecutadas por diferentes empleados usando herramientas sin integración. Esto provoca retrasos, mala coordinación de campañas, poca organización de la información y limitaciones para analizar resultados. No existe una plataforma centralizada.

## 2. Descripción del sistema propuesto

Plataforma inteligente de marketing para automatizar y optimizar la gestión de campañas publicitarias. Permite administrar usuarios, campañas, publicaciones en redes sociales, clientes, métricas, reportes y análisis de resultados desde una interfaz centralizada. Incorpora IA para generación automática de contenido publicitario, análisis de sentimientos, automatización de campañas y chatbot inteligente.

## 3. Objetivos del sistema

**General:** Desarrollar un sistema inteligente de marketing digital que automatice campañas publicitarias y genere contenido mediante IA.

**Específicos:**
- Automatizar campañas digitales
- Gestionar clientes y publicaciones
- Generar contenido mediante IA
- Implementar un chatbot inteligente
- Analizar estadísticas e interacciones
- Gestionar leads y segmentos
- Optimizar campañas publicitarias
- Mejorar la atención digital a los clientes

---

## 4. Funcionamiento general del sistema

1. El usuario accede a la pantalla de inicio de sesión.
2. Ingresa usuario y contraseña.
3. El sistema valida las credenciales contra la base de datos.
4. Si son correctas, muestra el menú principal.
5. El usuario selecciona el módulo a utilizar.

**Módulo de Clientes:** registrar, modificar, consultar o eliminar clientes. El sistema valida la información y la almacena.

**Módulo de Campañas:** registrar nueva campaña (nombre, descripción, objetivo, presupuesto, fechas), almacenar.

**Módulo de Publicaciones:** registrar publicaciones asociadas a una campaña, seleccionar red social, guardar publicación y programación.

**Módulo de Leads:** consultar y administrar clientes potenciales generados por campañas; mantener actualizado el estado de cada lead.

**Módulo de Reportes:** solicitar reporte, el sistema procesa la información y genera estadísticas, métricas e indicadores.

**Dashboard:** muestra resumen de campañas activas, publicaciones realizadas, leads registrados, interacciones obtenidas, presupuestos utilizados.

**Finalización:** el usuario cierra sesión y el sistema regresa a la pantalla de acceso.

---

## 5. Estandarización — nombres de programas y archivos

### 5.1 Programas / menús

| Programa | Descripción |
|---|---|
| Seguridad | Administración de usuarios y roles |
| Campañas | Gestión de campañas publicitarias |
| Clientes | Administración de clientes |
| Publicaciones | Gestión de publicaciones |
| Redes Sociales | Administración de plataformas sociales |
| Leads | Gestión de clientes potenciales |
| Reportes | Estadísticas y reportes |
| Dashboard | Indicadores generales del sistema |

### 5.2 Archivos / tablas

| Archivo | Descripción |
|---|---|
| roles | Almacena los roles |
| usuarios | Información de usuarios |
| clientes | Información de clientes |
| campañas | Campañas publicitarias |
| redes_sociales | Plataformas digitales |
| publicaciones | Publicaciones realizadas |
| interacciones | Métricas e interacciones |
| segmentos | Segmentación de clientes |
| leads | Clientes potenciales |
| presupuestos | Presupuesto de campañas |

### 5.3 Variables de archivo (ejemplos)

**usuarios:** id_usuario, nombre, apellido, correo, password, telefono, estado, id_rol

**campañas:** id_campaña, nombre_campaña, descripcion, objetivo, presupuesto, fecha_inicio, fecha_fin, estado

**clientes:** id_cliente, nombre_empresa, contacto, telefono, correo

### 5.4 Variables de memoria (frontend / runtime)

| Variable | Descripción |
|---|---|
| vUsuario | Usuario autenticado |
| vRol | Rol del usuario |
| vCampaña | Campaña seleccionada |
| vCliente | Cliente seleccionado |
| vPublicacion | Publicación activa |
| vReporte | Reporte generado |
| vMetrica | Métrica calculada |

### 5.5 Botones / funciones estándar

Nuevo, Guardar, Modificar, Eliminar, Buscar, Imprimir, Salir, Cancelar, **Generar Contenido IA** (crear contenido automáticamente), **Publicar** (publicar campaña).

---

## 6. Entidades de la base de datos (diagrama ER)

Entidades principales:
- **roles** (id_rol, nombre_rol, descripcion)
- **usuarios** (id_usuario, nombre, apellido, correo, password, telefono, estado, id_rol FK)
- **clientes** (id_cliente, nombre_empresa, contacto, telefono, correo, direccion, estado)
- **campañas** (id_campaña, nombre_campaña, descripcion, objetivo, presupuesto, fecha_inicio, fecha_fin, estado, id_cliente FK, id_usuario FK)
- **redes_sociales** (id_red, nombre_red, url, estado)
- **tipos_contenido** (id_tipo_contenido, nombre_tipo, descripcion)
- **publicaciones** (id_publicacion, titulo, contenido, fecha_publicacion, estado, id_campaña FK, id_red FK, id_tipo_contenido FK)
- **interacciones** (id_interaccion, tipo_interaccion, cantidad, fecha, id_publicacion FK)
- **segmentos** (id_segmento, nombre_segmento, descripcion)
- **leads** (id_lead, nombre, telefono, correo, interes, estado, fecha_registro, id_campaña FK, id_segmento FK)
- **presupuestos** (id_presupuesto, monto, descripcion, fecha, id_campaña FK)
- **prompts_ia** (id_prompt, modo, prompt, tipo)
- **contenido_ia** (id_contenido, id_prompt FK, respuesta_ia, fecha, id_usuario FK)
- **chatbot_historial** (id_chat, pregunta, respuesta, fecha, id_usuario FK)
- **analisis_sentimientos** (id_analisis, comentario, sentimiento, confianza, fecha, id_publicacion FK)
- **presupuestos** (monto, descripcion, fecha, id_campaña FK)

La normalización cumple 1FN, 2FN y 3FN: cada tabla tiene clave primaria simple, valores atómicos, sin dependencias parciales ni transitivas; las relaciones se manejan vía claves foráneas.

---

## 7. Mini especificación de procesos del sistema

### Proceso 1.0 – Gestión de Usuarios
- **Entrada:** datos personales, correo, contraseña, rol
- **Proceso:** validar información, verificar permisos, almacenar
- **Salida:** usuario registrado, acceso autorizado, confirmación
- **Almacén:** usuarios

### Proceso 2.0 – Gestión de Campañas
- **Entrada:** información de campaña, segmentación, objetivos, fechas
- **Proceso:** procesar y organizar campañas para automatización y publicación
- **Salida:** campaña creada, programación, datos almacenados
- **Almacén:** campañas

### Proceso 3.0 – IA Generativa
- **Entrada:** datos de campaña, palabras clave, tipo de contenido solicitado
- **Proceso:** la IA analiza la información y genera contenido publicitario optimizado
- **Salida:** texto publicitario, contenido promocional, recomendaciones automáticas
- **Almacén:** contenido_ia

### Proceso 4.0 – Chatbot Inteligente
- **Entrada:** consultas del usuario, mensajes recibidos, solicitudes de información
- **Proceso:** el chatbot analiza la consulta y genera respuestas automáticas con IA
- **Salida:** respuestas automáticas, información al cliente, historial de conversaciones
- **Almacén:** chatbot_historial

### Proceso 5.0 – MCP Server (automatización / integraciones)
- **Entrada:** configuración de automatizaciones, datos de campañas, solicitudes de publicación
- **Proceso:** ejecuta workflows automáticos e integra servicios externos
- **Salida:** publicaciones automatizadas, procesos ejecutados, confirmaciones de integración

### Proceso 6.0 – Redes Sociales
- **Entrada:** contenido generado, configuración de publicación, archivos multimedia
- **Proceso:** publica automáticamente contenido en redes sociales mediante APIs integradas
- **Salida:** publicaciones realizadas, datos de interacción, alcance
- **Almacén:** publicaciones

### Proceso 7.0 – Reportes y Analíticas
- **Entrada:** métricas de campañas, datos de interacción, conversiones
- **Proceso:** procesa métricas y genera análisis estadísticos y reportes visuales
- **Salida:** reportes analíticos, gráficas estadísticas, indicadores de rendimiento

### Proceso 8.0 – Gestión de Pagos y Comprobantes
- **Descripción:** procesa cobros de campañas mediante PayPal, valida la transacción y emite comprobante fiscal regulado (NCF, formato dominicano)
- **Entrada:** ID de campaña, monto a pagar, credenciales de PayPal del usuario, RNC o Cédula del cliente, tipo de comprobante deseado
- **Proceso:** el sistema envía la petición a la API de PayPal; al confirmar pago exitoso, genera el número de NCF (secuencia correcta según tipo de cliente) y renderiza el PDF; envía confirmación a la API de Marketing para activar la campaña
- **Salida:** factura en PDF (comprobante), NCF emitido, registro del pago en base de datos

**Formato de referencia del comprobante (ver ejemplo del diseño):**
- Encabezado: nombre de la empresa emisora, RNC, dirección, teléfono, "FACTURA DE CONSUMO ELECTRÓNICA", e-NCF
- Datos del receptor: razón social, RNC comprador, tipo de ingreso
- Detalle del comprobante: fecha de emisión, forma de pago, código de seguridad, ambiente (TesteCF Pruebas / Producción)
- Detalle de productos/servicios: línea, descripción, cantidad, precio unitario, monto neto
- Totales: monto gravado total, ITBIS facturado (18%), total factura
- Track ID y estado DGII (Aceptado/Rechazado/Pendiente)

---

## 8. Entradas y salidas del sistema

**Entradas:**
- Gestión de Usuarios: nombre, apellido, correo, contraseña, rol
- Gestión de Clientes: nombre de empresa, persona de contacto, teléfono, correo, dirección
- Gestión de Campañas: nombre, objetivo publicitario, presupuesto, fechas inicio/fin, público objetivo
- Gestión de Publicaciones: título, contenido, archivos multimedia, fecha de publicación, red social
- Gestión de Leads: nombre, correo, teléfono, interés detectado

**Salidas:**
- Reportes: de campañas, de clientes, de publicaciones, de leads
- Estadísticas: alcance de campañas, interacciones, conversiones, rendimiento publicitario
- Publicaciones: contenido publicado, historial, programación
- Indicadores: métricas generales, dashboard estadístico, resultados de campañas

---

## 9. Seguridad y niveles de acceso

| Nivel | Rol | Permisos |
|---|---|---|
| 1 | **Administrador** | Gestionar usuarios, roles, clientes, campañas, publicaciones, reportes. Acceso total al sistema. |
| 2 | **Gerencia** | Consultar campañas, aprobar campañas, consultar reportes, consultar estadísticas, consultar clientes. |
| 3 | **Marketing** | Crear campañas, modificar campañas, gestionar publicaciones, consultar métricas, consultar clientes. |
| 4 | **Community Manager** | Crear publicaciones, programar publicaciones, consultar campañas, gestionar redes sociales. |
| 5 | **Servicio al Cliente** | Consultar clientes, registrar consultas, gestionar leads, consultar información básica. |

**Medidas de seguridad generales:**
- Inicio de sesión obligatorio
- Contraseñas cifradas
- Control de permisos por roles
- Validación de usuarios
- Respaldo periódico de la información
- Protección de accesos al sistema

---

## 10. Validación de atributos de entrada

**Usuarios:** nombre obligatorio, correo obligatorio y único, contraseña obligatoria, rol obligatorio.

**Clientes:** nombre de empresa obligatorio, correo válido, teléfono obligatorio, estado obligatorio.

**Campañas:** nombre obligatorio, presupuesto mayor que cero, fecha de inicio obligatoria, fecha fin mayor que fecha inicio.

**Publicaciones:** título obligatorio, contenido obligatorio, red social obligatoria, fecha de publicación obligatoria.

**Leads:** nombre obligatorio, correo válido, segmento obligatorio.

**Generales:** no permitir registros duplicados, verificar integridad referencial, validar formatos de fechas, validar campos obligatorios, validar permisos según rol.

---

## 11. Stack tecnológico propuesto (diseño original)

| Software | Función |
|---|---|
| PHP | Desarrollo backend *(en la implementación real del proyecto se usa Supabase como backend, no PHP — ver nota abajo)* |
| MySQL | Base de datos *(en la implementación real se usa Postgres vía Supabase)* |
| HTML5 | Estructura |
| CSS3 | Diseño |
| JavaScript | Interactividad |
| Bootstrap | Diseño responsive *(en la implementación real se usa Tailwind CSS)* |
| Gemini API | Inteligencia artificial |
| Chart.js | Estadísticas |

> **Nota de implementación:** el proyecto real ya está construido con React + TypeScript + Vite + Tailwind + Supabase (Postgres + Auth), en lugar del stack PHP/MySQL/Bootstrap del documento de diseño original. Las funciones de **Gemini API** y la lógica de gráficas (Chart.js o equivalente como `recharts`) sí deben respetarse según el diseño. El diagrama ER y los procesos de negocio aplican igual, solo cambia la tecnología de implementación.

---

## 12. Mini especificación de programas (resumen funcional)

- **Programa Usuarios:** administrar usuarios y permisos → entrada: datos del usuario → proceso: validar y almacenar → salida: usuario registrado.
- **Programa Campañas:** gestionar campañas publicitarias → entrada: datos de campaña → proceso: registrar y organizar → salida: campaña creada.
- **Programa Publicaciones:** administrar publicaciones digitales → entrada: contenido publicitario → proceso: publicar contenido → salida: publicación realizada.
- **Programa Reportes:** generar estadísticas → entrada: datos de campañas → proceso: analizar métricas → salida: reporte generado.
- **Programa Dashboard:** visualizar indicadores → entrada: datos estadísticos → proceso: procesar información → salida: gráficas e indicadores.

---

## 13. Relación archivos vs. programas

| Archivo | Usuarios | Clientes | Campañas | Publicaciones | Leads | Reportes |
|---|---|---|---|---|---|---|
| roles | X | | | | | |
| usuarios | X | | | | | |
| clientes | | X | X | | X | |
| campañas | | X | X | X | | X |
| publicaciones | | | X | X | | X |
| redes_sociales | | | | X | | |
| interacciones | | | | | | X |
| segmentos | | | | | X | |
| leads | | | | | X | X |
| presupuestos | | | X | | | X |

---

## 14. Conclusiones del diseño original

El sistema debe automatizar procesos de marketing digital, mejorar la organización y control de campañas publicitarias, facilitar la administración de clientes y leads, optimizar la gestión de publicaciones en redes sociales, proporcionar estadísticas e indicadores para la toma de decisiones, centralizar la información en una única plataforma, e incorporar IA para modernizar las actividades de marketing.
