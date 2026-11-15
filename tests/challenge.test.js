// Challenge: apodo elegido en el primer uso y pantalla de fin de partida.
// localStorage simulado; no hay llamadas al servidor.
import { test, describe, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import {
  ADJETIVOS,
  ANIMALES,
  apodoElegido,
  apodoParaElegir,
  cambiarApodo,
  elegirApodo,
  leerApodo,
  piezasDelApodo,
  componerApodo,
} from '../src/datos/apodo.js'
import { leerMejorSemana, guardarMejorSemana } from '../src/datos/record.js'
import { CuerpoResultado } from '../src/componentes/verbpop/CuerpoResultado.js'
import { SelectorApodo } from '../src/componentes/ranking/SelectorApodo.js'
import { FASE } from '../src/motor/partida.js'
import { textos } from '../src/textos.js'

const v = textos.verbPop
let almacen

function almacenFalso() {
  const m = new Map()
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, valor) => m.set(k, String(valor)),
    removeItem: (k) => m.delete(k),
  }
}
const poner = (clave, valor) => almacen.setItem(`verb-arcade:${clave}`, JSON.stringify(valor))

beforeEach(() => {
  almacen = almacenFalso()
  globalThis.window = { localStorage: almacen }
})

after(() => {
  delete globalThis.window
})

describe('apodo elegido o generado', () => {
  test('el generado por defecto no cuenta como elegido', () => {
    assert.equal(apodoElegido(), false)
    leerApodo()
    assert.equal(apodoElegido(), false)
  })

  test('el que cambia el juego si el servidor rechaza el apodo tampoco', () => {
    cambiarApodo()
    assert.equal(apodoElegido(), false)
  })

  test('elegirlo con el selector pone la marca', () => {
    leerApodo()
    assert.ok(elegirApodo('Magic', 'Owl'))
    assert.equal(apodoElegido(), true)
  })

  test('una elección con piezas de fuera no pone la marca', () => {
    assert.equal(elegirApodo('Zippy', 'Owl'), null)
    assert.equal(apodoElegido(), false)
  })

  test('primer uso: propone el apodo generado si sus piezas son de las listas', () => {
    poner('apodo', 'SunnyKoala31')
    assert.equal(apodoParaElegir(), 'SunnyKoala31')
  })

  test('primer uso: con palabras antiguas propone otra combinación al azar con el mismo número', () => {
    poner('apodo', 'ZippySquid42')
    const propuesto = apodoParaElegir(() => 0.5)
    const p = piezasDelApodo(propuesto)
    assert.equal(componerApodo(p), propuesto)
    assert.ok(ADJETIVOS.includes(p.adjetivo) && ANIMALES.includes(p.animal))
    assert.equal(p.numero, '42')
    assert.equal(propuesto, `${ADJETIVOS[6]}${ANIMALES[6]}42`)
  })
})

describe('mejor de la semana', () => {
  test('se queda con la mayor y empieza de cero otra semana', () => {
    assert.equal(leerMejorSemana('verb_pop', '2026-W46'), 0)
    assert.equal(guardarMejorSemana('verb_pop', '2026-W46', 2100), 2100)
    assert.equal(guardarMejorSemana('verb_pop', '2026-W46', 900), 2100)
    assert.equal(guardarMejorSemana('verb_pop', '2026-W46', 3000), 3000)
    assert.equal(leerMejorSemana('verb_pop', '2026-W47'), 0)
    assert.equal(guardarMejorSemana('verb_pop', '2026-W47', 500), 500)
  })
})

describe('pantalla de fin de Challenge', () => {
  const resultado = { fase: FASE.FIN_TIEMPO, puntos: 1850, mejorSemana: 3200 }
  const pintar = (envio, otro = resultado) =>
    renderToStaticMarkup(createElement(CuerpoResultado, { resultado: otro, envio, alReintentar: () => {}, alRepetir: () => {} }))
  const texto = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

  test('puntuación y mejor de la semana, sin las tarjetas de antes', () => {
    const html = texto(pintar(null))
    assert.match(html, new RegExp(`${v.puntos} ${textos.numero(1850)}`))
    assert.match(html, new RegExp(`${v.mejorSemana} ${textos.numero(3200)}`))
    for (const fuera of [v.aciertos, v.mejorCombo, v.record, v.nuevoRecord]) assert.ok(!html.includes(fuera), fuera)
  })

  test('título según cómo acabó', () => {
    assert.match(pintar(null), new RegExp(v.finTiempo))
    assert.match(pintar(null, { ...resultado, fase: FASE.FIN_VIDAS }), new RegExp(v.finVidas))
  })

  test('tres salidas: Play again, Ranking y Home', () => {
    const html = pintar(null)
    assert.match(html, new RegExp(`<button[^>]*>${v.otraVez}</button>`))
    assert.match(html, new RegExp(`<a href="/ranking"[^>]*>${v.irARanking}</a>`))
    assert.match(html, new RegExp(`<a href="/"[^>]*>${v.irAInicio}</a>`))
    assert.equal(html.match(/<button/g).length, 1)
    assert.equal(html.match(/<a /g).length, 2)
  })

  test('guardada: "Saved as" con el apodo, y la clase si hay', () => {
    assert.match(pintar({ estado: 'guardada', apodo: 'MagicOwl12', clase: null }), />Saved as MagicOwl12</)
    assert.match(pintar({ estado: 'igual', apodo: 'MagicOwl12', clase: 'CLASE1' }), />Saved as MagicOwl12 · Class CLASE1</)
  })

  test('sin párrafos: como mucho la línea del ranking', () => {
    assert.equal((pintar(null).match(/<p/g) ?? []).length, 0)
    assert.equal(pintar({ estado: 'guardada', apodo: 'MagicOwl12', clase: null }).match(/<p/g).length, 1)
  })

  test('enviando y error con reintento', () => {
    assert.match(pintar({ estado: 'enviando' }), new RegExp(textos.ranking.enviando))
    const html = pintar({ estado: 'error', motivo: 'sinConexion' })
    assert.ok(html.includes(textos.ranking.errores.sinConexion))
    assert.match(html, new RegExp(`>${textos.ranking.reintentar}</button>`))
    assert.doesNotMatch(pintar({ estado: 'error', motivo: 'limiteDiario' }), new RegExp(textos.ranking.reintentar))
  })
})

describe('selector en el primer uso', () => {
  test('botón Start, sin Cancel y sin campos de texto', () => {
    const html = renderToStaticMarkup(
      createElement(SelectorApodo, { apodo: 'SunnyKoala31', alGuardar: () => {}, accion: v.empezar }),
    )
    assert.match(html, new RegExp(`>${v.empezar}</button>`))
    assert.ok(!html.includes(textos.ranking.cancelar))
    assert.doesNotMatch(html, /role="dialog"|<input|<textarea/)
    assert.match(html, />SunnyKoala31</)
  })
})
