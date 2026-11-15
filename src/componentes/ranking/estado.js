// Estados de la pantalla de ranking, sin React, para poder probarlos en node.
import { leerRanking, filaPropiaPendiente } from '../../datos/ranking.js'
import { leerApodo } from '../../datos/apodo.js'

export const TOP = 20

export const VISTA = { TODOS: 'todos', CLASE: 'clase' }

// { fase: 'cargando' } | { fase: 'lista', filas } | { fase: 'vacio' } | { fase: 'error', motivo }
export const CARGANDO = Object.freeze({ fase: 'cargando' })

// Solo pasan posición, apodo y puntos: lo demás que traiga el servidor se descarta aquí.
export function filasVisibles(filas) {
  return (Array.isArray(filas) ? filas : [])
    .filter((f) => f && Number.isInteger(f.posicion) && typeof f.nick === 'string' && Number.isFinite(f.puntos))
    .map(({ posicion, nick, puntos }) => ({ posicion, nick, puntos }))
}

// Con perfil pendiente, el servidor aún tiene el apodo viejo: la fila que coincide
// con lo último enviado (apodo y puntos) se pinta con el apodo actual, y así sale
// resaltada. pendiente: { nick, puntos } o null.
export function conFilaPropia(filas, pendiente, apodo) {
  if (!pendiente || !apodo) return filas
  let hecha = false
  return filas.map((f) => {
    if (hecha || f.nick !== pendiente.nick || f.puntos !== pendiente.puntos) return f
    hecha = true
    return { ...f, nick: apodo }
  })
}

export function aEstado(resultado, pendiente = null, apodo = null) {
  if (!resultado?.ok) return { fase: 'error', motivo: resultado?.motivo ?? 'desconocido' }
  const filas = conFilaPropia(filasVisibles(resultado.filas), pendiente, apodo)
  return filas.length > 0 ? { fase: 'lista', filas } : { fase: 'vacio' }
}

// Carga una vista. En "Mi clase" sin código no se llama al servidor: la pantalla pide el código.
export async function cargarVista(juego, vista, clase) {
  if (vista === VISTA.CLASE && !clase) return { fase: 'sinClase' }
  const r = await leerRanking(juego, { clase: vista === VISTA.CLASE ? clase : null, limite: TOP })
  return aEstado(r, filaPropiaPendiente(juego), leerApodo())
}
