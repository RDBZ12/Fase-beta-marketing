-- Alter telefono column in leads table to allow longer values like WhatsApp group JIDs
ALTER TABLE public.leads ALTER COLUMN telefono TYPE VARCHAR(100);
