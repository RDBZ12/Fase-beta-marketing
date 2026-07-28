# Reglas del Proyecto (Customizations)

Este archivo contiene reglas de comportamiento y directrices específicas para cualquier Agente de Inteligencia Artificial que trabaje en esta base de código.

## REGLA CRÍTICA DE SEGURIDAD: CÓDIGO QR Y PDFS

> [!IMPORTANT]
> **REGLA DE BLOQUEO ABSOLUTO:** Bajo ninguna circunstancia se debe modificar, alterar o eliminar el bloque de código encargado de la generación, estructura, datos y codificación de los Códigos QR en los archivos que generan comprobantes en PDF.
>
> **Archivos Protegidos:**
> 1. [PaymentModal.tsx](file:///c:/Users/FRANCISCO%20DAVID/Downloads/proyecto%20de%20marketing%20%284%29/proyecto%20de%20marketing/src/components/PaymentModal.tsx) (Bloque encerrado entre comentarios de bloqueo).
> 2. [PagosModule.tsx](file:///c:/Users/FRANCISCO%20DAVID/Downloads/proyecto%20de%20marketing%20%284%29/proyecto%20de%20marketing/src/components/PagosModule.tsx) (Bloque encerrado entre comentarios de bloqueo).
>
> **Razón:** La lógica de generación y verificación del código QR (que asocia el NCF, total, fecha y datos de DGII) es la parte fundamental de la evaluación académica por parte del docente. Cualquier modificación involuntaria que rompa el escaneo de este código invalida la funcionalidad central del proyecto.
