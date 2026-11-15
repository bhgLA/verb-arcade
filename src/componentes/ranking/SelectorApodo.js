// Selector de apodo: una fila de adjetivos y otra de animales, de listas cerradas.
// Sin campo de texto. El número es el que ya tenía el niño.
// En /ranking se abre con "Change" (Save y Cancel); en el primer Challenge va
// dentro de la pantalla, con accion = "Start" y sin alCancelar.
// Sin JSX a propósito, como CuerpoRanking: los tests lo pintan en node.
import { createElement as h, useEffect, useRef, useState } from 'react'
import { textos } from '../../textos.js'
import { ADJETIVOS, ANIMALES, piezasDelApodo, componerApodo } from '../../datos/apodo.js'

function Grupo({ etiqueta, opciones, elegida, alElegir }) {
  return h(
    'div',
    { className: 'selector-apodo__grupo', role: 'group', 'aria-label': etiqueta },
    opciones.map((o) =>
      h(
        'button',
        {
          key: o,
          type: 'button',
          className: `selector-apodo__pieza ${o === elegida ? 'selector-apodo__pieza--elegida' : ''}`,
          'aria-pressed': o === elegida,
          onClick: () => alElegir(o),
        },
        o,
      ),
    ),
  )
}

export function SelectorApodo({ apodo, alGuardar, alCancelar = null, accion = null }) {
  const r = textos.ranking
  const [inicio] = useState(() => piezasDelApodo(apodo))
  const [adjetivo, setAdjetivo] = useState(inicio.adjetivo)
  const [animal, setAnimal] = useState(inicio.animal)
  const caja = useRef(null)

  // Al abrir, el foco va al adjetivo elegido, para poder seguir con el teclado.
  useEffect(() => {
    caja.current?.querySelector('[aria-pressed="true"]')?.focus()
  }, [])

  return h(
    'div',
    {
      ref: caja,
      className: 'selector-apodo',
      role: alCancelar ? 'dialog' : 'group',
      'aria-label': r.elegirApodo,
      onKeyDown: (e) => {
        if (e.key === 'Escape' && alCancelar) alCancelar()
      },
    },
    // La única etiqueta visible: cómo queda el apodo.
    h('p', { className: 'selector-apodo__vista', 'aria-live': 'polite' }, componerApodo({ adjetivo, animal, numero: inicio.numero })),
    h(Grupo, { etiqueta: r.adjetivo, opciones: ADJETIVOS, elegida: adjetivo, alElegir: setAdjetivo }),
    h(Grupo, { etiqueta: r.animal, opciones: ANIMALES, elegida: animal, alElegir: setAnimal }),
    h(
      'div',
      { className: 'selector-apodo__acciones' },
      h(
        'button',
        {
          type: 'button',
          className: accion ? 'pildora resumen__principal' : 'pildora pildora--pequena pildora--acento',
          onClick: () => alGuardar(adjetivo, animal),
        },
        accion ?? r.guardar,
      ),
      alCancelar && h('button', { type: 'button', className: 'ranking__quitar', onClick: alCancelar }, r.cancelar),
    ),
  )
}
