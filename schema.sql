-- Verb Arcade: ranking semanal. Sin datos personales: solo apodo generado, código de clase opcional
-- y un id aleatorio guardado en el navegador. NO PROBADO contra una base real: ejecutar en el SQL Editor
-- de Supabase y revisar errores antes de usar.

create table if not exists public.game_limits (
  game text primary key,
  max_score int not null check (max_score > 0)
);
-- verb_pop: máximo teórico de una partida de 75 s (14850) + 10 % = 16335.
--   Se calcula en src/motor/puntuacion.js (limiteServidor); ver NOTAS_VERBOS.md.
-- mimica: provisional hasta equilibrar Mímica (paso 4).
-- "do update" para que volver a pegar este fichero actualice los límites.
insert into public.game_limits (game, max_score) values
  ('verb_pop', 16335),
  ('mimica',   6000)
on conflict (game) do update set max_score = excluded.max_score;

create table if not exists public.verb_scores (
  id          bigint generated always as identity primary key,
  player_id   uuid        not null,
  nick        text        not null check (nick ~ '^[A-Za-z0-9 _-]{3,20}$'),
  class_code  text        check (class_code is null or class_code ~ '^[a-z0-9]{2,8}$'),
  game        text        not null references public.game_limits(game),
  week        text        not null check (week ~ '^[0-9]{4}-W[0-9]{2}$'),
  score       int         not null check (score >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (player_id, game, week)
);

create index if not exists verb_scores_rank_idx on public.verb_scores (game, week, score desc);

-- Nadie escribe ni lee la tabla directamente: todo pasa por las dos funciones de abajo.
alter table public.verb_scores enable row level security;
alter table public.game_limits enable row level security;
-- (sin políticas = acceso directo denegado para anon/authenticated)

create or replace function public.current_week()
returns text language sql stable as $$
  select to_char(now() at time zone 'Europe/Madrid', 'IYYY-"W"IW');
$$;

-- La semana la decide el servidor, no el cliente.
create or replace function public.submit_score(
  p_player_id uuid,
  p_nick text,
  p_class_code text,
  p_game text,
  p_score int
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_max int;
  v_last timestamptz;
begin
  select max_score into v_max from game_limits where game = p_game;
  if v_max is null then raise exception 'unknown game'; end if;
  if p_score is null or p_score < 0 or p_score > v_max then raise exception 'invalid score'; end if;

  select updated_at into v_last from verb_scores
   where player_id = p_player_id and game = p_game and week = current_week();
  if v_last is not null and v_last > now() - interval '20 seconds' then
    raise exception 'too fast';
  end if;

  insert into verb_scores (player_id, nick, class_code, game, week, score)
  values (p_player_id, p_nick, nullif(lower(p_class_code), ''), p_game, current_week(), p_score)
  on conflict (player_id, game, week) do update
    set score = greatest(verb_scores.score, excluded.score),
        nick = excluded.nick,
        class_code = excluded.class_code,
        updated_at = now();
end $$;

create or replace function public.get_leaderboard(
  p_game text,
  p_class_code text default null,
  p_week text default null,
  p_limit int default 20
) returns table (pos bigint, nick text, class_code text, score int)
language sql stable security definer set search_path = public as $$
  select row_number() over (order by s.score desc, s.updated_at asc) as pos,
         s.nick, s.class_code, s.score
    from verb_scores s
   where s.game = p_game
     and s.week = coalesce(p_week, current_week())
     and (p_class_code is null or s.class_code = lower(p_class_code))
   order by s.score desc, s.updated_at asc
   limit least(coalesce(p_limit, 20), 50);
$$;

grant execute on function public.submit_score(uuid, text, text, text, int) to anon;
grant execute on function public.get_leaderboard(text, text, text, int) to anon;
grant execute on function public.current_week() to anon;
