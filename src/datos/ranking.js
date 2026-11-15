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
// límite diario en partidas que no cambian nada: { semana, puntos, clase, nick }.
// La fila del servidor es una por jugador, juego y semana, sea cual sea la clase.
const claveEnviado = (juego) => `enviado:${juego}`

function registroDeLaSemana(juego, semana) {
  const e = leer(claveEnviado(juego))
  if (!e || e.semana !== semana || !Number.isInteger(e.puntos)) return null
  return e
}

// El servidor solo cambia apodo y clase dentro de submit_score. Si el niño cambia
// cualquiera de los dos y no se ha podido reenviar, queda esta marca ("perfil
// pendiente") y la próxima partida se envía aunque no mejore.
const clavePendiente = (juego) => `perfilPendiente:${juego}`
// Día (Madrid) del último reenvío inmediato, compartido entre apodo y clase:
// solo el primer cambio del día se reenvía al momento.
const CLAVE_REENVIO = 'perfilReenviado'

function hayPendiente(juego, registro, clase) {
  if (leer(clavePendiente(juego)) === true) return true
  // Clase cambiada por otro camino: el servidor aún tiene la de antes.
  return registro !== null && (registro.clase ?? null) !== clase
}

// Devuelve { ok: true, enviada } (enviada: false si no mejoraba lo ya enviado)
// o { ok: false, motivo }.
export async function enviarPuntuacion(juego, puntos) {
  if (!JUEGOS.includes(juego)) return { ok: false, motivo: 'juego' }
  if (!Number.isInteger(puntos) || puntos < 0) return { ok: false, motivo: 'puntuacion' }

  const semana = semanaISO()
  // Siempre la clase guardada ahora mismo en el navegador, o vacío si no hay.
  const clase = leerClase()
  const registro = registroDeLaSemana(juego, semana)
  const anterior = registro?.puntos ?? null
  const mejora = anterior === null || puntos > anterior
  if (!mejora && !hayPendiente(juego, registro, clase)) return { ok: true, enviada: false }

  const enviar = (nick) =>
    llamarRpc('submit_score', {
      p_player_id: idJugador(),
      p_nick: nick,
      p_class_code: clase ?? '',
      p_game: juego,
      p_score: puntos,
    })
  let nick = leerApodo()
  let r = await enviar(nick)
  // Un apodo rechazado no gasta intento (se comprueba antes del límite): se cambia y se reintenta una vez.
  if (!r.ok && motivoDeError(r) === 'apodo') r = await enviar((nick = cambiarApodo()))
  if (!r.ok) {
    // Envío solo por el perfil: la puntuación ya estaba en el ranking. La marca sigue para otra vez.
    if (!mejora) {
      guardar(clavePendiente(juego), true)
      return { ok: true, enviada: false }
    }
    return { ok: false, motivo: motivoDeError(r) }
  }

  guardar(clavePendiente(juego), false)
  // Un envío por perfil pendiente lleva una puntuación más baja: se guarda la mejor, nunca la última.
  guardar(claveEnviado(juego), { semana, puntos: mejora ? puntos : anterior, clase, nick })
  return { ok: true, enviada: mejora }
}

// Tras cambiar de apodo o de clase. Solo afecta a los juegos con puntuación esta
// semana; en los demás, el perfil nuevo saldrá con el primer envío.
// Primer cambio del día: se reenvía al momento la mejor puntuación ya enviada (el
// servidor se queda con la mayor y no mueve el desempate). Siguientes cambios del
// día, o si el reenvío falla: queda pendiente para la próxima partida de Challenge.
// Devuelve { reenviados: [juego], pendientes: [juego] }.
export async function avisarCambioPerfil() {
  const semana = semanaISO()
  const juegos = JUEGOS.filter((j) => registroDeLaSemana(j, semana) !== null)
  for (const j of juegos) guardar(clavePendiente(j), true)
  if (juegos.length === 0) return { reenviados: [], pendientes: [] }

  const hoy = diaMadrid()
  if (leer(CLAVE_REENVIO) === hoy) return { reenviados: [], pendientes: juegos }
  guardar(CLAVE_REENVIO, hoy)

  const reenviados = []
  const pendientes = []
  for (const j of juegos) {
    await enviarPuntuacion(j, registroDeLaSemana(j, semana).puntos)
    if (leer(clavePendiente(j)) === true) pendientes.push(j)
    else reenviados.push(j)
  }
  return { reenviados, pendientes }
}

// Mientras haya perfil pendiente, la fila que el servidor tiene del jugador lleva
// el apodo viejo. Devuelve { nick, puntos } de lo último aceptado, o null si no
// hay nada pendiente esta semana.
export function filaPropiaPendiente(juego) {
  const registro = registroDeLaSemana(juego, semanaISO())
  if (!registro || typeof registro.nick !== 'string') return null
  if (!hayPendiente(juego, registro, leerClase())) return null
  return { nick: registro.nick, puntos: registro.puntos }
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
