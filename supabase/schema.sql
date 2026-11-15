-- Verb Arcade: ranking semanal. Sin datos personales: solo apodo generado, código de clase opcional
-- y un id aleatorio guardado en el navegador.
-- v2 (15 nov 2026): límite diario de intentos, class_code en mayúsculas y fuera del ranking general,
-- REVOKE explícito de acceso directo, search_path (con pg_temp al final) en TODAS las funciones, función de purga (8 semanas).
-- Se puede pegar entero varias veces (idempotente), también sobre la v1.
-- La purga automática con pg_cron va aparte: schema_purga_cron.sql (ejecutar después de activar pg_cron).

-- ---------------------------------------------------------------- límites por juego
create table if not exists public.game_limits (
  game text primary key,
  max_score int not null check (max_score > 0)
);
alter table public.game_limits
  add column if not exists max_attempts_per_day int not null default 5 check (max_attempts_per_day > 0);

-- verb_pop: máximo teórico de una partida de 75 s (14850) + 10 % = 16335.
--   Se calcula en src/motor/puntuacion.js (limiteServidor); ver NOTAS_VERBOS.md.
-- mimica: provisional hasta equilibrar Mímica.
-- "do update" para que volver a pegar este fichero actualice los límites.
insert into public.game_limits (game, max_score, max_attempts_per_day) values
  ('verb_pop', 16335, 5),
  ('mimica',   6000,  5)
on conflict (game) do update
  set max_score = excluded.max_score,
      max_attempts_per_day = excluded.max_attempts_per_day;

-- ---------------------------------------------------------------- puntuaciones
create table if not exists public.verb_scores (
  id          bigint generated always as identity primary key,
  player_id   uuid        not null,
  nick        text        not null check (nick ~ '^[A-Za-z0-9 _-]{3,20}$'),
  class_code  text,
  game        text        not null references public.game_limits(game),
  week        text        not null check (week ~ '^[0-9]{4}-W[0-9]{2}$'),
  score       int         not null check (score >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (player_id, game, week)
);

-- Código de clase: 2-8 caracteres A-Z/0-9, siempre en mayúsculas (la función lo normaliza).
alter table public.verb_scores drop constraint if exists verb_scores_class_code_check;
update public.verb_scores set class_code = upper(class_code) where class_code is not null;
alter table public.verb_scores add constraint verb_scores_class_code_check
  check (class_code is null or class_code ~ '^[A-Z0-9]{2,8}$');

create index if not exists verb_scores_rank_idx on public.verb_scores (game, week, score desc);

-- ---------------------------------------------------------------- intentos por día
create table if not exists public.verb_attempts (
  player_id uuid        not null,
  game      text        not null references public.game_limits(game),
  day       date        not null,                 -- día de Madrid, lo calcula el servidor
  n         int         not null default 0,
  last_at   timestamptz not null default now(),
  primary key (player_id, game, day)
);

-- ---------------------------------------------------------------- clases (códigos opacos)
-- Solo existen las clases que tú das de alta con select public.new_class();
-- así un error al teclear el código se detecta, y puedes anular un código borrándolo de aquí.
create table if not exists public.classes (
  code       text primary key check (code ~ '^[A-Z0-9]{2,8}$'),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- acceso directo: cerrado
alter table public.verb_scores   enable row level security;
alter table public.game_limits   enable row level security;
alter table public.verb_attempts enable row level security;
alter table public.classes       enable row level security;
-- Sin políticas, y además sin privilegios: la clave anon recibe "permission denied", no una lista vacía.
revoke all on public.verb_scores, public.game_limits, public.verb_attempts, public.classes from anon, authenticated;

-- ---------------------------------------------------------------- funciones
create or replace function public.current_week()
returns text language sql stable set search_path = public, pg_temp as $$
  select to_char(now() at time zone 'Europe/Madrid', 'IYYY-"W"IW');
$$;

-- La semana y el día los decide el servidor, no el cliente.
-- Errores posibles: invalid player | unknown game | invalid score | invalid nick |
--                   invalid class code | unknown class | daily limit | too fast
create or replace function public.submit_score(
  p_player_id uuid,
  p_nick text,
  p_class_code text,
  p_game text,
  p_score int
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_max   int;
  v_limit int;
  v_n     int;
  v_class text := nullif(upper(btrim(coalesce(p_class_code, ''))), '');
begin
  if p_player_id is null then raise exception 'invalid player'; end if;

  select max_score, max_attempts_per_day into v_max, v_limit from game_limits where game = p_game;
  if v_max is null then raise exception 'unknown game'; end if;
  if p_score is null or p_score < 0 or p_score > v_max then raise exception 'invalid score'; end if;
  if p_nick is null or p_nick !~ '^[A-Za-z0-9 _-]{3,20}$' then raise exception 'invalid nick'; end if;
  if v_class is not null and v_class !~ '^[A-Z0-9]{2,8}$' then raise exception 'invalid class code'; end if;
  if v_class is not null and not exists (select 1 from classes where code = v_class) then
    raise exception 'unknown class';
  end if;

  -- Un intento = un envío. Tope diario y pausa mínima de 20 s entre envíos.
  insert into verb_attempts (player_id, game, day, n, last_at)
  values (p_player_id, p_game, (now() at time zone 'Europe/Madrid')::date, 1, now())
  on conflict (player_id, game, day) do update
    set n = verb_attempts.n + 1, last_at = now()
    where verb_attempts.n < v_limit
      and verb_attempts.last_at <= now() - interval '20 seconds'
  returning n into v_n;

  if v_n is null then
    select n into v_n from verb_attempts
     where player_id = p_player_id and game = p_game
       and day = (now() at time zone 'Europe/Madrid')::date;
    if v_n >= v_limit then raise exception 'daily limit'; end if;
    raise exception 'too fast';
  end if;

  insert into verb_scores (player_id, nick, class_code, game, week, score)
  values (p_player_id, p_nick, v_class, p_game, current_week(), p_score)
  on conflict (player_id, game, week) do update
    set score      = greatest(verb_scores.score, excluded.score),
        nick       = excluded.nick,
        class_code = excluded.class_code,
        -- el desempate del ranking es "quién llegó antes a esa puntuación": solo se mueve si mejora
        updated_at = case when excluded.score > verb_scores.score then now() else verb_scores.updated_at end;
end $$;

-- Cambia el tipo de retorno respecto a la v1 (ya no devuelve class_code): hay que borrarla antes.
drop function if exists public.get_leaderboard(text, text, text, int);

-- Solo posición, apodo y puntuación. Nunca player_id ni class_code.
create function public.get_leaderboard(
  p_game text,
  p_class_code text default null,
  p_week text default null,
  p_limit int default 20
) returns table (pos bigint, nick text, score int)
language sql stable security definer set search_path = public, pg_temp as $$
  select row_number() over (order by s.score desc, s.updated_at asc) as pos,
         s.nick, s.score
    from verb_scores s
   where s.game = p_game
     and s.week = coalesce(p_week, current_week())
     and (nullif(btrim(p_class_code), '') is null or s.class_code = upper(btrim(p_class_code)))
   order by s.score desc, s.updated_at asc
   limit greatest(least(coalesce(p_limit, 20), 50), 1);
$$;

-- ¿Existe este código de clase? Para avisar al niño al teclearlo, antes de jugar.
create or replace function public.class_exists(p_code text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from classes where code = upper(btrim(coalesce(p_code, ''))));
$$;

-- Alta de una clase nueva: devuelve un código al azar de 4 caracteres, sin 0/O ni 1/I/L para que no se confundan.
-- Solo para ti, desde el SQL Editor:  select public.new_class();
create or replace function public.new_class() returns text language plpgsql set search_path = public, pg_temp as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  loop
    v_code := '';
    for i in 1..4 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    begin
      insert into public.classes (code) values (v_code);
      return v_code;
    exception when unique_violation then
      null;  -- ya existía: probar otro
    end;
  end loop;
end $$;

-- Purga: puntuaciones de más de 8 semanas e intentos de más de 2 días. La llama pg_cron, nunca el cliente.
create or replace function public.purge_old() returns void language sql set search_path = public, pg_temp as $$
  delete from public.verb_scores   where created_at < now() - interval '8 weeks';
  delete from public.verb_attempts where day < (now() at time zone 'Europe/Madrid')::date - 2;
$$;

-- ---------------------------------------------------------------- permisos de ejecución
revoke all on function public.purge_old() from public, anon, authenticated;
revoke all on function public.new_class() from public, anon, authenticated;
grant execute on function public.class_exists(text) to anon;
grant execute on function public.submit_score(uuid, text, text, text, int) to anon;
grant execute on function public.get_leaderboard(text, text, text, int) to anon;
grant execute on function public.current_week() to anon;
