// Pruebas contra el Supabase real (el de .env.local). Uso: npm run probar:supabase -- CODIGO
// Escribe solo en el juego 'mimica', que aún no se muestra, con apodos PruebaBot##.
// Tarda unos 90 s: el límite diario necesita 5 envíos separados por la pausa de 20 s.
// Al final imprime el SQL para borrar lo que ha creado.
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { cabeceras, leerRespuesta } from '../src/datos/supabase.js'
import { motivoDeError } from '../src/datos/errores.js'
import { semanaISO } from '../src/motor/semana.js'

// El código de clase va como argumento para que no quede en el repo.
const CLASE = process.argv[2]?.trim().toUpperCase()
if (!CLASE) {
  console.error('Falta el código de una clase dada de alta. Uso: npm run probar:supabase -- CODIGO')
  process.exit(1)
}
const JUEGO = 'mimica'
const PAUSA_MS = 21_000

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .map((l) => /^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/.exec(l))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
)
const URL_BASE = env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const CLAVE = env.VITE_SUPABASE_ANON_KEY
if (!URL_BASE || !CLAVE) {
  console.error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local')
  process.exit(1)
}

let fallos = 0
function comprobar(nombre, ok, detalle = '') {
  if (!ok) fallos++
  console.log(`${ok ? '  ok   ' : '  FALLO'} ${nombre}${!ok && detalle ? `\n         ${detalle}` : ''}`)
}
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

async function pedir(ruta, { metodo = 'POST', cuerpo } = {}) {
  const r = await fetch(`${URL_BASE}${ruta}`, {
    method: metodo,
    headers: cabeceras(CLAVE),
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    signal: AbortSignal.timeout(10_000),
  })
  const res = await leerRespuesta(r)
  return { ...res, status: r.status }
}
const rpc = (f, args = {}) => pedir(`/rest/v1/rpc/${f}`, { cuerpo: args })

function envio({ jugador = randomUUID(), nick = 'PruebaBot00', clase = null, juego = JUEGO, puntos = 10 } = {}) {
  return rpc('submit_score', { p_player_id: jugador, p_nick: nick, p_class_code: clase, p_game: juego, p_score: puntos })
}
const describir = (r) => `status ${r.status}, motivo ${r.motivo ?? '-'}, mensaje "${r.mensaje ?? ''}"`

async function errorEsperado(nombre, promesa, mensaje, motivo) {
  const r = await promesa
  comprobar(`${nombre} -> "${mensaje}"`, !r.ok && r.mensaje === mensaje && motivoDeError(r) === motivo, describir(r))
}

console.log(`\nSupabase: ${new URL(URL_BASE).host}  clase: ${CLASE}  juego de prueba: ${JUEGO}\n`)

console.log('Funciones públicas')
{
  const r = await rpc('current_week')
  comprobar('current_week responde', r.ok, describir(r))
  comprobar(`la semana coincide con el juego (${semanaISO()})`, r.datos === semanaISO(), `servidor: ${r.datos}`)

  const a = await rpc('class_exists', { p_code: CLASE })
  comprobar(`class_exists('${CLASE}') = true`, a.ok && a.datos === true, describir(a))
  const b = await rpc('class_exists', { p_code: ` ${CLASE.toLowerCase()} ` })
  comprobar('class_exists normaliza minúsculas y espacios', b.ok && b.datos === true, describir(b))
  const c = await rpc('class_exists', { p_code: 'ZZZZZZZ9' })
  comprobar("class_exists('ZZZZZZZ9') = false", c.ok && c.datos === false, describir(c))
}

console.log('\nAcceso cerrado para la clave pública')
for (const tabla of ['verb_scores', 'game_limits', 'verb_attempts', 'classes']) {
  const r = await pedir(`/rest/v1/${tabla}?select=*&limit=1`, { metodo: 'GET' })
  comprobar(`leer ${tabla} directamente está prohibido`, !r.ok, `status ${r.status}, devolvió ${JSON.stringify(r.datos)?.slice(0, 80)}`)
}
{
  const r = await pedir('/rest/v1/verb_scores', {
    cuerpo: { player_id: randomUUID(), nick: 'PruebaBot00', game: JUEGO, week: semanaISO(), score: 1 },
  })
  comprobar('escribir verb_scores directamente está prohibido', !r.ok, `status ${r.status}`)
}
for (const f of ['new_class', 'purge_old']) {
  const r = await rpc(f)
  comprobar(`${f}() no se puede llamar`, !r.ok, describir(r))
}

console.log('\nErrores de submit_score (cada uno con su texto en el juego)')
await errorEsperado('jugador vacío', rpc('submit_score', { p_player_id: null, p_nick: 'PruebaBot00', p_class_code: null, p_game: JUEGO, p_score: 1 }), 'invalid player', 'jugador')
await errorEsperado('juego inexistente', envio({ juego: 'tetris' }), 'unknown game', 'juego')
await errorEsperado('puntuación negativa', envio({ puntos: -1 }), 'invalid score', 'puntuacion')
await errorEsperado('puntuación por encima del máximo', envio({ puntos: 6001 }), 'invalid score', 'puntuacion')
await errorEsperado('apodo corto', envio({ nick: 'ab' }), 'invalid nick', 'apodo')
await errorEsperado('apodo con símbolos', envio({ nick: 'Bad<b>nick' }), 'invalid nick', 'apodo')
await errorEsperado('código de clase de 1 letra', envio({ clase: 'A' }), 'invalid class code', 'codigoClase')
await errorEsperado('clase que no existe', envio({ clase: 'ZZZZZZZ9' }), 'unknown class', 'claseDesconocida')

console.log(`\nEnvíos válidos, pausa y límite diario (unos ${Math.round((4 * PAUSA_MS) / 1000)} s)`)
const jugador = randomUUID()
const nick = `PruebaBot${10 + Math.floor(Math.random() * 90)}`
const puntos = [100, 300, 200, 50, 250]
for (const [i, p] of puntos.entries()) {
  if (i > 0) await esperar(PAUSA_MS)
  // La primera vez, con la clase en minúsculas y espacios: el servidor la normaliza.
  const r = await envio({ jugador, nick, clase: i === 0 ? ` ${CLASE.toLowerCase()} ` : CLASE, puntos: p })
  comprobar(`envío ${i + 1}/5 (${p} puntos) aceptado, 204 sin cuerpo`, r.ok && r.status === 204 && r.datos === null, describir(r))
  if (i === 0) {
    await errorEsperado('otro envío enseguida', envio({ jugador, nick, clase: CLASE, puntos: 999 }), 'too fast', 'muyRapido')
  }
}
await errorEsperado('sexto envío del día', envio({ jugador, nick, clase: CLASE, puntos: 400 }), 'daily limit', 'limiteDiario')

console.log('\nRanking')
{
  const r = await rpc('get_leaderboard', { p_game: JUEGO, p_class_code: CLASE, p_limit: 50 })
  comprobar('get_leaderboard de la clase responde', r.ok && Array.isArray(r.datos), describir(r))
  const filas = r.datos ?? []
  const mia = filas.find((f) => f.nick === nick)
  comprobar(`aparece ${nick} en la clase ${CLASE}`, Boolean(mia), JSON.stringify(filas.slice(0, 5)))
  comprobar('guarda la mejor puntuación (300), no la última ni la rechazada', mia?.score === 300, `score: ${mia?.score}`)
  const columnas = Object.keys(filas[0] ?? {}).sort().join(',')
  comprobar('solo devuelve pos, nick y score', columnas === 'nick,pos,score', `columnas: ${columnas}`)

  const g = await rpc('get_leaderboard', { p_game: JUEGO, p_class_code: null, p_limit: 1000 })
  comprobar('ranking general responde y limita a 50', g.ok && g.datos.length <= 50, describir(g))
  comprobar('el ranking general también incluye la partida', (g.datos ?? []).some((f) => f.nick === nick))
  const v = await rpc('get_leaderboard', { p_game: 'verb_pop' })
  comprobar('get_leaderboard de verb_pop responde', v.ok && Array.isArray(v.datos), describir(v))
}

console.log(fallos === 0 ? '\nTodo bien.' : `\n${fallos} comprobación(es) fallida(s).`)
console.log(`
Para borrar lo que ha creado esta prueba (SQL Editor):
  delete from public.verb_scores   where game = '${JUEGO}' and nick like 'PruebaBot%';
  delete from public.verb_attempts where game = '${JUEGO}';   -- mientras Mímica no esté publicada
`)
process.exit(fallos === 0 ? 0 : 1)
