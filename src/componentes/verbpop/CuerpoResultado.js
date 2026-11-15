// Fin de una partida de Challenge: la puntuación, la mejor de la semana, dónde se
// ha guardado y tres salidas (Play again, Ranking, Home). Sin párrafos.
// Sin JSX a propósito, como CuerpoRanking: los tests lo pintan en node. El enlace
// llega por props porque el de la app (rutas.jsx) es JSX.
import { createElement as h, Fragment, useEffect, useRef } from 'react'
import { textos } from '../../textos.js'
import { FASE } from '../../motor/partida.js'

// Motivos en los que tiene sentido volver a enviar la misma partida.
export const REINTENTABLES = ['muyRapido', 'sinConexion']

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

// resultado: { fase: FASE.FIN_TIEMPO | FASE.FIN_VIDAS, puntos, mejorSemana }
export function CuerpoResultado({ resultado, envio, alReintentar, alRepetir, Enlace = EnlaceSimple }) {
  const v = textos.verbPop
  const principal = useRef(null)
  useEffect(() => principal.current?.focus(), [])

  return h(
    Fragment,
    null,
    h('h1', { className: 'titulo-grande' }, resultado.fase === FASE.FIN_TIEMPO ? v.finTiempo : v.finVidas),
    h(
      'dl',
      { className: 'resultado-final__datos resultado-final__datos--dos' },
      h('div', { className: 'tarjeta' }, h('dt', null, v.puntos), h('dd', null, textos.numero(resultado.puntos))),
      h('div', { className: 'tarjeta' }, h('dt', null, v.mejorSemana), h('dd', null, textos.numero(resultado.mejorSemana))),
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
