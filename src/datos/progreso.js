// Progreso del modo estudio: aciertos por verbo. Se completa en el paso 2.
import { leer, guardar } from './almacen.js'

const CLAVE = 'progreso'

export function leerProgreso() {
  const p = leer(CLAVE, {})
  return p && typeof p === 'object' && !Array.isArray(p) ? p : {}
}

export function guardarProgreso(progreso) {
  return guardar(CLAVE, progreso)
}
