-- 1. Agregar la columna de control de tiempo a la tabla campaigns
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMPTZ;

-- 2. Programar el robot (pg_cron) para que ejecute la Edge Function cada hora
SELECT cron.schedule(
  'remind_campaigns_job',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://efkqvvekpmfocyspmeqg.supabase.co/functions/v1/remind_publications',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVma3F2dmVrcG1mb2N5c3BtZXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMDA5MzYsImV4cCI6MjA5Njg3NjkzNn0.i6PuMSX2ChFR06xa84NTJKYmnn1kjCFQxLS2CEHo4AI", "Content-Type": "application/json"}'::jsonb
  );
  $$
);
