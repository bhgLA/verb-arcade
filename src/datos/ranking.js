// Ranking semanal en Supabase. Ninguna función lanza: si algo falla devuelven
// { ok: false, motivo } y la interfaz enseña textos.ranking.errores[motivo].
import { llamarRpc } from './supabase.js'
import { motivoDeError } from './errores.js'
import { idJugador } from './jugador.js'
import { leerApodo, cambiarApodo } from './apodo.js'
import { leerClase } from './clase.js'
import { leer, guardar } from './almacen.js'
import { JUEGOS } from '../motor/config.js'
import { semanaISO, diaMadrid } from '../motor/semana.js'

// Lo mejor que el servidor ya aceptó esta semana, para no gastar intentos del
// límite diario en partidas que no cambian nada: { semana, puntos, clase }.
const claveEnviado = (juego) => `enviado:${juego}`

function yaEnviado(juego, semana, clase) {
  const e = leer(claveEnviado(juego))
  if (!e || e.semana !== semana || e.clase !== clase) return null
  return Number.isInteger(e.puntos) ? e.puntos : null
}

// El servidor solo cambia el apodo dentro de submit_score. Si el niño cambia de
// apodo y no se ha podido reenviar, queda esta marca y la próxima partida se envía
// aunque no mejore.
const clavePendiente = (juego) => `apodoPendiente:${juego}`
// Día (Madrid) del último reenvío inmediato: solo el primer cambio del día se reenvía al momento.
const CLAVE_REENVIO = 'apodoReenviado'

// Devuelve { ok: true, enviada } (enviada: false si no mejoraba lo ya enviado)
// o { ok: false, motivo }.
export async function enviarPuntuacion(juego, puntos) {
  if (!JUEGOS.includes(juego)) return { ok: false, motivo: 'juego' }
  if (!Number.isInteger(puntos) || puntos < 0) return { ok: false, motivo: 'puntuacion' }

  const semana = semanaISO()
  const clase = leerClase()
  const anterior = yaEnviado(juego, semana, clase)
  const mejora = anterior === null || puntos > anterior
  const pendiente = leer(clavePendiente(juego)) === true
  if (!mejora && !pendiente) return { ok: true, enviada: false }

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
  if (!r.ok) {
    // Envío solo por el apodo: la puntuación ya estaba en el ranking. La marca sigue para otra vez.
    if (!mejora) return { ok: true, enviada: false }
    return { ok: false, motivo: motivoDeError(r) }
  }

  guardar(clavePendiente(juego), false)
  // Un envío por apodo pendiente lleva una puntuación más baja: se guarda la mejor, no la última.
  guardar(claveEnviado(juego), { semana, puntos: mejora ? puntos : anterior, clase })
  return { ok: true, enviada: mejora }
}

// Tras cambiar de apodo. Solo afecta a los juegos con puntuación esta semana (con la
// clase actual); en los demás, el apodo nuevo saldrá con el primer envío.
// Primer cambio del día: se reenvía al momento la mejor puntuación ya enviada (el
// servidor se queda con la mayor y no mueve el desempate). Siguientes cambios del
// día, o si el reenvío falla: queda pendiente para la próxima partida de Challenge.
// Devuelve { reenviados: [juego], pendientes: [juego] }.
export async function avisarCambioApodo() {
  const semana = semanaISO()
  const clase = leerClase()
  const juegos = JUEGOS.filter((j) => yaEnviado(j, semana, clase) !== null)
  for (const j of juegos) guardar(clavePendiente(j), true)
  if (juegos.length === 0) return { reenviados: [], pendientes: [] }

  const hoy = diaMadrid()
  if (leer(CLAVE_REENVIO) === hoy) return { reenviados: [], pendientes: juegos }
  guardar(CLAVE_REENVIO, hoy)

  const reenviados = []
  const pendientes = []
  for (const j of juegos) {
    await enviarPuntuacion(j, yaEnviado(j, semana, clase))
    if (leer(clavePendiente(j)) === true) pendientes.push(j)
    else reenviados.push(j)
  }
  return { reenviados, pendientes }
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
