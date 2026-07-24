# Instrucciones de Migración — Supabase SQL Editor

## Orden de ejecución (OBLIGATORIO hacerlo en este orden)

1. `20260620_001_initial_schema.sql`
2. `20260620_002_rls_policies.sql`
3. `20260620_003_seed_data.sql`

---

## Pasos en Supabase

1. Ve a [https://supabase.com](https://supabase.com) → tu proyecto `efkqvvekpmfocyspmeqg`
2. Menú izquierdo → **SQL Editor**
3. Clic en **"New query"**
4. Copia y pega el contenido de `001_initial_schema.sql` completo → clic **Run**
5. Espera a que diga "Success" (verás el mensaje de NOTICE sobre tobacco_products)
6. Nueva query → pega `002_rls_policies.sql` → Run
7. Nueva query → pega `003_seed_data.sql` → Run

---

## Verificación post-migración

Ejecuta esta query para confirmar que las tablas fueron creadas:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Deberías ver: `analisis_sentimientos`, `campaigns`, `chatbot_historial`, `clientes`,
`contenido_ia`, `interacciones`, `leads`, `pagos`, `presupuestos`, `prompts_ia`,
`publicaciones`, `redes_sociales`, `roles`, `segmentos`, `tipos_contenido`, `usuarios`

Para verificar la migración de datos:

```sql
SELECT COUNT(*) FROM public.campaigns;
-- Debe mostrar el mismo número de filas que tenías en tobacco_products
```

Para verificar los roles:

```sql
SELECT * FROM public.roles ORDER BY id_rol;
-- Debe mostrar los 5 roles: Administrador, Gerencia, Marketing, Community Manager, Servicio al Cliente
```

---

## Asignar tu usuario como Administrador

Después de ejecutar las migraciones, asigna el rol Administrador a tu cuenta:

```sql
UPDATE public.usuarios
SET id_rol = 1
WHERE correo = 'TU_CORREO@email.com';
```

(Reemplaza `TU_CORREO@email.com` con el correo con el que te logueas)

---

## NOTA sobre tobacco_products

La tabla `tobacco_products` **NO es eliminada** por este script — sus datos son copiados
a `campaigns` pero la tabla original queda intacta como respaldo.

Una vez que confirmes que los datos se migraron correctamente, puedes eliminarla:

```sql
DROP TABLE IF EXISTS public.tobacco_products;
```

⚠️ **No ejecutes ese DROP hasta que el frontend esté actualizado para usar `campaigns`.**
Antigravity actualizará el frontend en el Módulo siguiente.
