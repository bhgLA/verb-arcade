// Fin de una partida de Challenge: la puntuación en grande, la mejor de la semana,
// "New record!" si toca, una línea pequeña con aciertos y mejor combo, dónde se ha
// guardado y tres salidas (Play again, Ranking, Home). Sin párrafos de ayuda.
// Sin JSX a propósito, como CuerpoRanking: los tests lo pintan en node. El enlace
// llega por props porque el de la app (rutas.jsx) es JSX.
import { createElement as h, Fragment, useEffect, useRef } from 'react'
import { textos } from '../../textos.js'
import { FASE } from '../../motor/partida.js'

// Motivos en los que tiene sentido volver a enviar la misma partida. Con 'apodo'
// el juego ya ha cambiado el apodo, así que el reintento sale con el nuevo.
export const REINTENTABLES = ['muyRapido', 'sinConexion', 'apodo', 'desconocido']

const EnlaceSimple = ({ a, children, ...resto }) => h('a', { href: a, ...resto }, children)

// envio: null (sin ranking) | { estado: 'enviando' } | { estado: 'guardada' | 'igual', apodo, clase }
//        | { estado: 'error', motivo }
function LineaRanking({ envio, alReintentar }) {
  if (!envio) return null
  const r = textos.ranking
  const guardada = envio.estado === 'guardada' || envio.estado === 'igual'
  const texto =
    envio.estado === 'enviando' ? r.enviando
    : guardada ? textos.verbPop.guardadaComo(envio.apodo, envio.clase)
    : r.errores[envio.motivo] ?? r.errores.desconocido
  return h(
    'div',
    { className: 'resultado-final__ranking' },
    h('p', { className: 'texto-mundo', role: 'status' }, texto),
    envio.estado === 'error' &&
      REINTENTABLES.includes(envio.motivo) &&
      h('button', { type: 'button', className: 'pildora pildora--pequena', onClick: alReintentar }, r.reintentar),
  )
}

// Estrella para "New record!": el aviso no depende solo del color.
const Estrella = () =>
  h(
    'svg',
    { className: 'resultado-final__estrella', viewBox: '0 0 24 24', width: 28, height: 28, 'aria-hidden': 'true', focusable: 'false' },
    h('path', { d: 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z', fill: 'currentColor' }),
  )

// resultado: { fase: FASE.FIN_TIEMPO | FASE.FIN_VIDAS, puntos, mejorSemana, nuevoRecord, aciertos, mejorCombo }
export function CuerpoResultado({ resultado, envio, alReintentar, alRepetir, Enlace = EnlaceSimple }) {
  const v = textos.verbPop
  const principal = useRef(null)
  useEffect(() => principal.current?.focus(), [])

  return h(
    Fragment,
    null,
    h('h1', { className: 'titulo-grande' }, resultado.fase === FASE.FIN_TIEMPO ? v.finTiempo : v.finVidas),
    h(
      'div',
      { className: 'resultado-final__marcador' },
      h(
        'p',
        { className: 'resultado-final__puntos' },
        h('span', { className: 'visualmente-oculto' }, `${v.puntos} `),
        textos.numero(resultado.puntos),
      ),
      h('p', { className: 'resultado-final__mejor' }, v.mejorSemanaN(textos.numero(resultado.mejorSemana))),
      resultado.nuevoRecord &&
        h('p', { className: 'resultado-final__record' }, h(Estrella), v.nuevoRecord),
      h(
        'p',
        { className: 'resultado-final__detalle' },
        v.detalle(textos.numero(resultado.aciertos ?? 0), textos.numero(resultado.mejorCombo ?? 1)),
      ),
    ),
    h(LineaRanking, { envio, alReintentar }),
    h(
      'div',
      { className: 'resumen__botones' },
      h('button', { ref: principal, type: 'button', className: 'pildora resumen__principal', onClick: alRepetir }, v.otraVez),
      h(
        'div',
        { className: 'resumen__secundarios' },
        h(Enlace, { a: '/ranking', className: 'pildora pildora--pequena' }, v.irARanking),
        h(Enlace, { a: '/', className: 'pildora pildora--pequena' }, v.irAInicio),
      ),
    ),
  )
}
