-- Enable pg_cron and pg_net extensions if not already enabled
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Schedule the auto_publish job to run every minute
select cron.schedule(
  'auto_publish_job',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://efkqvvekpmfocyspmeqg.supabase.co/functions/v1/auto_publish',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVma3F2dmVrcG1mb2N5c3BtZXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMDA5MzYsImV4cCI6MjA5Njg3NjkzNn0.i6PuMSX2ChFR06xa84NTJKYmnn1kjCFQxLS2CEHo4AI", "Content-Type": "application/json"}'::jsonb
  );
  $$
);

-- Schedule the request_client_approval job to run every 3 hours
select cron.schedule(
  'request_approval_job',
  '0 */3 * * *',
  $$
  select net.http_post(
    url := 'https://efkqvvekpmfocyspmeqg.supabase.co/functions/v1/request_client_approval',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVma3F2dmVrcG1mb2N5c3BtZXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMDA5MzYsImV4cCI6MjA5Njg3NjkzNn0.i6PuMSX2ChFR06xa84NTJKYmnn1kjCFQxLS2CEHo4AI", "Content-Type": "application/json"}'::jsonb
  );
  $$
);
