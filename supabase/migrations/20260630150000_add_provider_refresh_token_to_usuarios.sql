ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS provider_refresh_token TEXT;
