-- Agregar la columna last_reminder_at si no existe
ALTER TABLE public.publicaciones ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMPTZ;

-- Programar la ejecución de la función cada hora
SELECT cron.schedule(
  'remind_publications_job',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://efkqvvekpmfocyspmeqg.supabase.co/functions/v1/remind_publications',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVma3F2dmVrcG1mb2N5c3BtZXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMDA5MzYsImV4cCI6MjA5Njg3NjkzNn0.i6PuMSX2ChFR06xa84NTJKYmnn1kjCFQxLS2CEHo4AI", "Content-Type": "application/json"}'::jsonb
  );
  $$
);
