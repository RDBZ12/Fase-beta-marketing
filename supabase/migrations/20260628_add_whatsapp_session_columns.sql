-- Migration: Add WhatsApp Session Name and Phone number columns
-- Targets: public.clientes_portal and public.usuarios

ALTER TABLE public.clientes_portal ADD COLUMN IF NOT EXISTS whatsapp_session_name TEXT;
ALTER TABLE public.clientes_portal ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;

ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS whatsapp_session_name TEXT;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;
