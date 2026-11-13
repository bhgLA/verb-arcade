// Puntuación de Verb Pop. Pura y configurable desde config.js (VERB_POP).
import { VERB_POP } from './config.js'

// Multiplicador con `racha` aciertos seguidos ya conseguidos: x1, y sube un
// nivel cada `comboCada` aciertos hasta `comboMax`.
export function multiplicador(racha, cfg = VERB_POP) {
  return Math.min(cfg.comboMax, 1 + Math.floor(racha / cfg.comboCada))
}

// Tiempo que tarda un bloque en llegar al suelo. Fijo en el mundo 1; la
// velocidad sube un poco con cada mundo.
export function tiempoDeCaida(mundo, cfg = VERB_POP) {
  const m = Math.max(1, Math.trunc(mundo))
  return Math.round(cfg.caidaBaseMs / (1 + cfg.aumentoVelocidadPorMundo * (m - 1)))
}

// 0..bonusMax según lo que quedaba de la ventana en que se puede responder
// (desde el fin del bloqueo hasta el suelo). Así no depende del mundo.
export function bonusRapidez(transcurrido, caidaMs, cfg = VERB_POP) {
  const ventana = caidaMs - cfg.bloqueoMs
  if (ventana <= 0) return 0
  const fraccion = (caidaMs - transcurrido) / ventana
  return Math.max(0, Math.min(cfg.bonusMax, Math.round(cfg.bonusMax * fraccion)))
}

export function puntosAcierto(racha, transcurrido, caidaMs, cfg = VERB_POP) {
  return cfg.puntosBase * multiplicador(racha, cfg) + bonusRapidez(transcurrido, caidaMs, cfg)
}

// Lo más rápido posible: cada reto se responde justo al acabar el bloqueo
// (bonus máximo) y el siguiente aparece tras la pausa. Solo cuentan las
// respuestas antes de que se acabe el tiempo.
export function maximoTeorico(cfg = VERB_POP) {
  let puntos = 0
  let racha = 0
  for (let t = cfg.bloqueoMs; t < cfg.duracionMs; t += cfg.bloqueoMs + cfg.pausaMs) {
    puntos += cfg.puntosBase * multiplicador(racha, cfg) + cfg.bonusMax
    racha++
  }
  return puntos
}

// Valor para game_limits.max_score en schema.sql.
export function limiteServidor(cfg = VERB_POP) {
  // Redondeo previo: 14850 * 1.1 da 16335.000000000002 en coma flotante.
  const conMargen = Math.round(maximoTeorico(cfg) * (1 + cfg.margenServidor) * 1e6) / 1e6
  return Math.ceil(conMargen)
}
