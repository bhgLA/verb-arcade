-- Purga automática (8 semanas). Ejecutar DESPUÉS de schema.sql.
-- En Supabase: Database > Extensions > pg_cron (activar) o simplemente la línea siguiente.
create extension if not exists pg_cron;

-- Cada día a las 03:00 UTC. Si ya existe una tarea con ese nombre, se actualiza.
select cron.schedule('verb-arcade-purga', '0 3 * * *', $$select public.purge_old()$$);

-- Para comprobarlo:  select * from cron.job;
-- Historial de ejecuciones:  select * from cron.job_run_details order by start_time desc limit 5;
