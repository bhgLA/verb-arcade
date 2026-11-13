// Máquina de estados de una partida de Verb Pop, como reducer puro.
//
// El tiempo lo pone quien despacha las acciones (`t`, ms desde el inicio), así
// que la misma secuencia de acciones da siempre el mismo resultado, se haga
// tick cada fotograma o una sola vez.
//
// Acciones:
//   { type: 'tick', t }
//   { type: 'responder', t, opcion }
//   { type: 'siguiente', t, pregunta }   (solo estudio: pone el siguiente reto)
//
// Competición: 75 s, vidas, combo; un bloque que llega al suelo es un fallo.
// Estudio: sin tiempo, sin vidas y sin suelo; el reto espera a 'siguiente'.
import { VERB_POP } from './config.js'
import { multiplicador, puntosAcierto, tiempoDeCaida } from './puntuacion.js'

export const FASE = Object.freeze({ JUGANDO: 'jugando', FIN_TIEMPO: 'fin_tiempo', FIN_VIDAS: 'fin_vidas' })

function nuevoReto(pregunta, t) {
  return { pregunta, aparecio: t, respuesta: null, acierto: null, tRespuesta: null, suelo: false, puntos: 0 }
}

export function crearPartida({ modo = 'competicion', preguntas, mundo = 1, config = VERB_POP }) {
  if (modo !== 'competicion' && modo !== 'estudio') throw new Error(`Modo desconocido: "${modo}".`)
  if (!Array.isArray(preguntas) || preguntas.length === 0) throw new Error('crearPartida: faltan preguntas.')
  return {
    modo,
    cfg: { ...config },
    caidaMs: tiempoDeCaida(mundo, config),
    fase: FASE.JUGANDO,
    t: 0,
    puntos: 0,
    vidas: config.vidas,
    racha: 0,
    combo: 1,
    mejorRacha: 0,
    mejorCombo: 1,
    aciertos: 0,
    fallos: 0,
    preguntas,
    indice: 0,
    reto: nuevoReto(preguntas[0], 0),
    siguienteEn: null,
  }
}

export function retoActivo(s) {
  return s.reto !== null && s.reto.respuesta === null && !s.reto.suelo
}

export function sePuedeResponder(s) {
  return s.fase === FASE.JUGANDO && retoActivo(s) && s.t - s.reto.aparecio >= s.cfg.bloqueoMs
}

export function tiempoRestante(s) {
  return Math.max(0, s.cfg.duracionMs - s.t)
}

// Altura del bloque: 0 = arriba, 1 = suelo.
export function alturaBloques(s) {
  if (!s.reto) return 0
  const fin = s.reto.tRespuesta ?? s.t
  if (s.modo === 'estudio') {
    return s.cfg.lineaSeguraEstudio * Math.min(1, (fin - s.reto.aparecio) / s.cfg.bloqueoMs)
  }
  if (s.reto.suelo) return 1
  return Math.min(1, Math.max(0, (fin - s.reto.aparecio) / s.caidaMs))
}

function fallo(s, t, cambiosReto) {
  const vidas = s.modo === 'competicion' ? s.vidas - 1 : s.vidas
  const sinVidas = vidas <= 0
  return {
    ...s,
    vidas,
    racha: 0,
    combo: 1,
    fallos: s.fallos + 1,
    reto: { ...s.reto, ...cambiosReto },
    fase: sinVidas ? FASE.FIN_VIDAS : s.fase,
    siguienteEn: sinVidas || s.modo === 'estudio' ? null : t + s.cfg.pausaMs,
  }
}

function aparecer(s, t) {
  const indice = (s.indice + 1) % s.preguntas.length
  return { ...s, indice, reto: nuevoReto(s.preguntas[indice], t), siguienteEn: null }
}

// Procesa en orden los sucesos pendientes hasta `t`: bloque en el suelo,
// aparición del siguiente reto y fin de tiempo.
function avanzar(s, tPedido) {
  if (s.fase !== FASE.JUGANDO) return s
  const t = Math.max(tPedido, s.t)
  if (s.modo === 'estudio') return { ...s, t }

  let e = s
  for (;;) {
    const fin = e.cfg.duracionMs
    const suelo = retoActivo(e) ? e.reto.aparecio + e.caidaMs : Infinity
    const aparicion = e.siguienteEn ?? Infinity
    const proximo = Math.min(suelo, aparicion)
    if (fin <= t && fin <= proximo) return { ...e, t: fin, fase: FASE.FIN_TIEMPO }
    if (proximo > t) break
    e = proximo === suelo ? fallo(e, suelo, { suelo: true }) : aparecer(e, aparicion)
    if (e.fase !== FASE.JUGANDO) return { ...e, t: proximo }
  }
  return { ...e, t }
}

function responder(s0, t, opcion) {
  const s = avanzar(s0, t)
  if (!sePuedeResponder(s) || !s.reto.pregunta.opciones.includes(opcion)) return s
  const transcurrido = s.t - s.reto.aparecio
  const acierto = opcion === s.reto.pregunta.correcta
  const cambios = { respuesta: opcion, acierto, tRespuesta: s.t }

  if (!acierto) return fallo(s, s.t, cambios)

  const puntos = s.modo === 'competicion' ? puntosAcierto(s.racha, transcurrido, s.caidaMs, s.cfg) : 0
  const racha = s.racha + 1
  const combo = multiplicador(racha, s.cfg)
  return {
    ...s,
    puntos: s.puntos + puntos,
    racha,
    combo,
    mejorRacha: Math.max(s.mejorRacha, racha),
    mejorCombo: Math.max(s.mejorCombo, combo),
    aciertos: s.aciertos + 1,
    reto: { ...s.reto, ...cambios, puntos },
    siguienteEn: s.modo === 'competicion' ? s.t + s.cfg.pausaMs : null,
  }
}

function siguiente(s, t, pregunta) {
  if (s.modo !== 'estudio' || !pregunta || retoActivo(s)) return s
  const ahora = Math.max(t, s.t)
  return { ...s, t: ahora, reto: nuevoReto(pregunta, ahora) }
}

export function partidaReducer(s, accion) {
  switch (accion?.type) {
    case 'tick':
      return avanzar(s, accion.t)
    case 'responder':
      return responder(s, accion.t, accion.opcion)
    case 'siguiente':
      return siguiente(s, accion.t, accion.pregunta)
    default:
      return s
  }
}
