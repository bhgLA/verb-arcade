// Progreso del modo estudio en localStorage: { [verb]: { aciertos, fallos, desbloqueada } }.
// Si el navegador no deja guardar, el juego sigue y el progreso dura lo que la pestaña.
import { leer, guardar } from './almacen.js'
import { normalizarProgreso } from '../motor/estudio.js'

const CLAVE = 'progreso'

export function leerProgreso() {
  return normalizarProgreso(leer(CLAVE, {}))
}

export function guardarProgreso(progreso) {
  return guardar(CLAVE, progreso)
}
