// Lógica del modo estudio: progreso por verbo, elección del siguiente verbo,
// desbloqueo de cartas y pistas. Pura: no toca localStorage ni el DOM.
//
// Progreso: { [verb]: { aciertos, fallos, desbloqueada } }
import { ACIERTOS_PARA_CARTA, TIPOS_ESTUDIO } from './config.js'
import { elegir } from './aleatorio.js'
import { crearPregunta } from './preguntas.js'
import { textos } from '../textos.js'

const VACIO = Object.freeze({ aciertos: 0, fallos: 0, desbloqueada: false })

const contador = (n) => (Number.isInteger(n) && n > 0 ? n : 0)

// Limpia lo que venga de localStorage: valores raros cuentan como 0.
export function normalizarProgreso(crudo) {
  const limpio = {}
  if (!crudo || typeof crudo !== 'object' || Array.isArray(crudo)) return limpio
  for (const [verb, d] of Object.entries(crudo)) {
    if (!d || typeof d !== 'object') continue
    const aciertos = contador(d.aciertos)
    limpio[verb] = {
      aciertos,
      fallos: contador(d.fallos),
      desbloqueada: d.desbloqueada === true || aciertos >= ACIERTOS_PARA_CARTA,
    }
  }
  return limpio
}

export function progresoDe(progreso, verb) {
  return progreso[verb] ?? VACIO
}

export function estaDesbloqueada(progreso, verb) {
  return progresoDe(progreso, verb).desbloqueada === true
}

export function contarDesbloqueadas(progreso, verbos) {
  return verbos.filter((v) => estaDesbloqueada(progreso, v.verb)).length
}

// El mundo pasa de incompleto a completo entre `antes` y `despues`. Si ya estaba
// completo antes, no cuenta: el aviso solo sale con la carta que lo cierra.
export function completaElMundo(antes, despues, delMundo) {
  const total = delMundo.length
  return total > 0 && contarDesbloqueadas(antes, delMundo) < total && contarDesbloqueadas(despues, delMundo) === total
}

// Devuelve un progreso nuevo (no modifica el original). Un fallo no resta aciertos.
// Con `delMundo` (los verbos del mundo que se juega) dice también si esta
// respuesta ha desbloqueado la última carta del mundo.
export function registrarRespuesta(progreso, verb, acierto, delMundo = []) {
  const actual = progresoDe(progreso, verb)
  const siguiente = acierto
    ? { ...actual, aciertos: actual.aciertos + 1 }
    : { ...actual, fallos: actual.fallos + 1 }
  const desbloqueadaAhora = !actual.desbloqueada && siguiente.aciertos >= ACIERTOS_PARA_CARTA
  if (desbloqueadaAhora) siguiente.desbloqueada = true
  const nuevo = { ...progreso, [verb]: siguiente }
  const mundoCompletadoAhora = desbloqueadaAhora && completaElMundo(progreso, nuevo, delMundo)
  return { progreso: nuevo, desbloqueadaAhora, mundoCompletadoAhora }
}

// Prioridad a los verbos con menos aciertos; empate al azar. Nunca repite el anterior
// (salvo que solo haya un verbo).
export function elegirVerbo(candidatos, progreso, anterior, rng) {
  if (!candidatos.length) throw new Error('elegirVerbo: no hay verbos.')
  const posibles = candidatos.length > 1 ? candidatos.filter((v) => v.verb !== anterior) : candidatos
  const minimo = Math.min(...posibles.map((v) => progresoDe(progreso, v.verb).aciertos))
  return elegir(
    posibles.filter((v) => progresoDe(progreso, v.verb).aciertos === minimo),
    rng,
  )
}

export function tiposDeEstudio(verbo) {
  return TIPOS_ESTUDIO.filter((t) => t !== 'mimica' || (verbo.mimica === true && Boolean(verbo.emoji)))
}

// Los distractores salen de los mundos 1..mundo, como en competición:
// algunos mundos sueltos no tienen 4 verbos de mímica.
export function poolDeEstudio(verbos, mundo) {
  return verbos.filter((v) => v.world >= 1 && v.world <= mundo)
}

// `tipos` limita los tipos posibles (Verb Pop no usa mímica).
export function crearPreguntaEstudio(verbo, verbos, mundo, rng, tipos = null) {
  const pool = poolDeEstudio(verbos, mundo)
  const posibles = tiposDeEstudio(verbo).filter((t) => !tipos || tipos.includes(t))
  if (!posibles.length) throw new Error(`"${verbo.verb}" no tiene tipos de pregunta posibles.`)
  return crearPregunta(elegir(posibles, rng), verbo, pool, rng)
}

// Pista en español y una opción incorrecta que se puede tachar.
export function pistaDe(pregunta, verbo) {
  const p = textos.pistas
  let texto
  if (pregunta.tipo === 'pasado' || pregunta.tipo === 'participio') {
    texto = verbo.irregular ? p.irregular(pregunta.correcta.charAt(0)) : p.regular
  } else if (pregunta.tipo === 'significado') {
    texto = p.categoria(textos.categorias[verbo.category] ?? verbo.category)
  } else {
    texto = p.traduccion(verbo.es)
  }
  const descartar = pregunta.opciones.find((o) => o !== pregunta.correcta) ?? null
  return { texto, descartar }
}
