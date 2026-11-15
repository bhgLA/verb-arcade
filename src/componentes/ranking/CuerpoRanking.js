// Contenido de la tarjeta del ranking: cargando, vacío, error o la lista.
// Sin JSX a propósito: así los tests de node lo pintan con react-dom/server sin compilar nada.
import { createElement as h } from 'react'
import { textos } from '../../textos.js'

// Diez filas por columna: el top 20 cabe en dos columnas a 1366×768.
const POR_COLUMNA = 10

function Fila({ fila, mia }) {
  return h(
    'li',
    { className: `fila-ranking ${mia ? 'fila-ranking--mia' : ''}`, 'aria-current': mia ? 'true' : undefined },
    h('span', { className: `fila-ranking__puesto ${fila.posicion <= 3 ? 'fila-ranking__puesto--podio' : ''}` }, fila.posicion),
    h('span', { className: 'fila-ranking__nick' }, fila.nick),
    h('span', { className: 'fila-ranking__puntos' }, textos.numero(fila.puntos)),
  )
}

// filas: [{ posicion, nick, puntos }] ya filtradas por filasVisibles.
export function ListaRanking({ filas, miApodo }) {
  const columnas = [filas.slice(0, POR_COLUMNA), filas.slice(POR_COLUMNA)].filter((c) => c.length > 0)
  return h(
    'div',
    { className: 'lista-ranking' },
    columnas.map((columna, i) =>
      h(
        'ol',
        { key: i, className: 'lista-ranking__columna', start: columna[0].posicion },
        columna.map((f) => h(Fila, { key: f.posicion, fila: f, mia: f.nick === miApodo })),
      ),
    ),
  )
}

export function CuerpoRanking({ estado, miApodo, alReintentar }) {
  const r = textos.ranking
  if (estado.fase === 'cargando') return h('p', { className: 'ranking__linea', role: 'status' }, r.cargando)
  if (estado.fase === 'vacio') return h('p', { className: 'ranking__linea' }, r.vacio)
  if (estado.fase === 'error') {
    return h(
      'div',
      { className: 'ranking__error' },
      h('p', { className: 'ranking__linea', role: 'status' }, r.sinConexion),
      h('button', { type: 'button', className: 'pildora pildora--pequena pildora--acento', onClick: alReintentar }, r.reintentar),
    )
  }
  if (estado.fase === 'lista') return h(ListaRanking, { filas: estado.filas, miApodo })
  return null
}
