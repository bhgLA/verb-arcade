// Ranking semanal en Supabase. Ninguna función lanza: si algo falla devuelven
// { ok: false, motivo } y la interfaz enseña textos.ranking.errores[motivo].
import { llamarRpc } from './supabase.js'
import { motivoDeError } from './errores.js'
import { idJugador } from './jugador.js'
import { leerApodo, cambiarApodo } from './apodo.js'
import { leerClase } from './clase.js'
import { leer, guardar } from './almacen.js'
import { JUEGOS } from '../motor/config.js'
import { semanaISO } from '../motor/semana.js'

// Lo mejor que el servidor ya aceptó esta semana, para no gastar intentos del
// límite diario en partidas que no cambian nada: { semana, puntos, clase }.
const claveEnviado = (juego) => `enviado:${juego}`

function yaEnviado(juego, semana, clase) {
  const e = leer(claveEnviado(juego))
  if (!e || e.semana !== semana || e.clase !== clase) return null
  return Number.isInteger(e.puntos) ? e.puntos : null
}

// Devuelve { ok: true, enviada } (enviada: false si no mejoraba lo ya enviado)
// o { ok: false, motivo }.
export async function enviarPuntuacion(juego, puntos) {
  if (!JUEGOS.includes(juego)) return { ok: false, motivo: 'juego' }
  if (!Number.isInteger(puntos) || puntos < 0) return { ok: false, motivo: 'puntuacion' }

  const semana = semanaISO()
  const clase = leerClase()
  const anterior = yaEnviado(juego, semana, clase)
  if (anterior !== null && puntos <= anterior) return { ok: true, enviada: false }

  const enviar = (nick) =>
    llamarRpc('submit_score', {
      p_player_id: idJugador(),
      p_nick: nick,
      p_class_code: clase,
      p_game: juego,
      p_score: puntos,
    })
  let r = await enviar(leerApodo())
  // Un apodo rechazado no gasta intento (se comprueba antes del límite): se cambia y se reintenta una vez.
  if (!r.ok && motivoDeError(r) === 'apodo') r = await enviar(cambiarApodo())
  if (!r.ok) return { ok: false, motivo: motivoDeError(r) }

  guardar(claveEnviado(juego), { semana, puntos, clase })
  return { ok: true, enviada: true }
}

// Filas con la forma que usa la interfaz: [{ posicion, nick, puntos }].
// clase: null para el ranking general. Devuelve { ok: true, filas } o { ok: false, motivo }.
export async function leerRanking(juego, { clase = null, limite = 20 } = {}) {
  if (!JUEGOS.includes(juego)) return { ok: false, motivo: 'juego' }
  const r = await llamarRpc('get_leaderboard', {
    p_game: juego,
    p_class_code: clase,
    p_limit: limite,
  })
  if (!r.ok) return { ok: false, motivo: motivoDeError(r) }
  const filas = (Array.isArray(r.datos) ? r.datos : [])
    .filter((f) => f && typeof f.nick === 'string' && Number.isFinite(Number(f.score)))
    .map((f) => ({ posicion: Number(f.pos), nick: f.nick, puntos: Number(f.score) }))
  return { ok: true, filas }
}
