# Flujos de Usuario (User Flows)

Este documento detalla los flujos principales que un usuario (ej. dueño de negocio) atraviesa en la plataforma.

## 1. Onboarding Inicial
1. El usuario inicia sesión.
2. La plataforma detecta que su `learning_progress` está vacío.
3. El Asistente IA saluda e invita a realizar el Tour General.
4. Se presenta el Dashboard, KPIs y menú lateral.

## 2. Creación de Campaña Publicitaria
1. El usuario ingresa a "Mis Campañas".
2. Hace clic en "Nuevo Proyecto".
3. El Wizard solicita objetivo, presupuesto y detalles de la marca.
4. El backend conecta con IA para generar textos publicitarios.
5. El usuario guarda y la campaña queda en estado "Borrador" hasta el pago.

## 3. Gestión de Pagos y Facturación
1. El usuario decide iniciar la campaña.
2. Realiza el pago de la suscripción/campaña.
3. Puede navegar a "Mis Pagos" para descargar el PDF de e-NCF generado automáticamente con un código QR verificable.

## 4. Visualización de Estadísticas
1. A medida que las campañas corren, los datos se almacenan.
2. En el módulo de "Estadísticas", el usuario visualiza gráficos `recharts`.
3. Puede filtrar por fechas y ver los KPIs más relevantes (Leads, Alcance, Inversión).
