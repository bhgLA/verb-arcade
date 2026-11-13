// Identificador anónimo del dispositivo. Nunca se guardan datos personales.
import { leer, guardar } from './almacen.js'

function uuid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID()
  // Respaldo para navegadores sin randomUUID (contexto no seguro).
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

export function idJugador() {
  let id = leer('player_id')
  if (typeof id !== 'string' || id.length !== 36) {
    id = uuid()
    guardar('player_id', id)
  }
  return id
}
