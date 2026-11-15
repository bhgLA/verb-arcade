// Récord personal por juego, solo en este navegador.
import { leer, guardar } from './almacen.js'

const clave = (juego) => `record:${juego}`

export function leerRecord(juego) {
  const r = leer(clave(juego), 0)
  return Number.isInteger(r) && r > 0 ? r : 0
}

// Guarda la puntuación si mejora el récord. Devuelve { record, nuevo }.
export function guardarRecordSiMejor(juego, puntos) {
  const anterior = leerRecord(juego)
  if (!Number.isInteger(puntos) || puntos <= anterior) return { record: anterior, nuevo: false }
  guardar(clave(juego), puntos)
  return { record: puntos, nuevo: true }
}

// Mejor puntuación de la semana en este navegador, con o sin conexión.
// { semana, puntos } por juego; otra semana empieza de cero.
const claveSemana = (juego) => `mejorSemana:${juego}`

export function leerMejorSemana(juego, semana) {
  const m = leer(claveSemana(juego))
  return m && m.semana === semana && Number.isInteger(m.puntos) && m.puntos > 0 ? m.puntos : 0
}

// Devuelve la mejor de la semana después de contar esta partida.
export function guardarMejorSemana(juego, semana, puntos) {
  const anterior = leerMejorSemana(juego, semana)
  if (!Number.isInteger(puntos) || puntos <= anterior) return anterior
  guardar(claveSemana(juego), { semana, puntos })
  return puntos
}
