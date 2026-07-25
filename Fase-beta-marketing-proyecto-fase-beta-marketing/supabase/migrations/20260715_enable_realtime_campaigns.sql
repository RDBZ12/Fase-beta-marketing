-- Enable Realtime for the campaigns table
begin;
  -- Remove the table from the publication if it's already there to avoid duplicates
  -- (this will throw an error if the publication doesn't exist, but supabase_realtime always exists)
  -- Actually, it's safer to just do a safe add.
  
  -- The safe way to add a table to supabase_realtime publication
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND tablename = 'campaigns'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE campaigns;
    END IF;
  END
  $$;
commit;
