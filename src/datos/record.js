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
