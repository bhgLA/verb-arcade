// Challenge: apodo elegido en el primer uso, guarda de /reto/<juego>, récord
// semanal y pantalla de fin de partida.
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
import { leerMejorSemana, guardarMejorSemana, registrarPartidaSemana } from '../src/datos/record.js'
import { pideApodo } from '../src/guarda.js'
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

describe('guarda del primer uso', () => {
  test('cualquier juego bajo /reto/<juego> pide el apodo si no está elegido', () => {
    for (const ruta of ['/reto/verb-pop', '/reto/mimica', '/reto/verb-pop/']) assert.equal(pideApodo(ruta, false), true, ruta)
  })

  test('/reto (el menú de juegos) y /estudio no la activan', () => {
    for (const ruta of ['/reto', '/reto/', '/estudio', '/estudio/3', '/estudio/3/pop', '/', '/ranking']) {
      assert.equal(pideApodo(ruta, false), false, ruta)
    }
  })

  test('con el apodo ya elegido no vuelve a salir', () => {
    assert.equal(pideApodo('/reto/verb-pop', true), false)
  })

  test('la marca apodoElegido es la que decide', () => {
    leerApodo()
    assert.equal(pideApodo('/reto/verb-pop', apodoElegido()), true)
    elegirApodo('Magic', 'Owl')
    assert.equal(pideApodo('/reto/verb-pop', apodoElegido()), false)
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

  test('la primera partida de la semana no es récord', () => {
    assert.deepEqual(registrarPartidaSemana('verb_pop', '2026-W46', 1200), { mejorSemana: 1200, nuevoRecord: false })
  })

  test('mejorar la de la semana sí es récord; igualarla o bajar, no', () => {
    registrarPartidaSemana('verb_pop', '2026-W46', 1200)
    assert.deepEqual(registrarPartidaSemana('verb_pop', '2026-W46', 1200), { mejorSemana: 1200, nuevoRecord: false })
    assert.deepEqual(registrarPartidaSemana('verb_pop', '2026-W46', 800), { mejorSemana: 1200, nuevoRecord: false })
    assert.deepEqual(registrarPartidaSemana('verb_pop', '2026-W46', 1500), { mejorSemana: 1500, nuevoRecord: true })
    assert.equal(leerMejorSemana('verb_pop', '2026-W46'), 1500)
  })

  test('el cambio de semana lo reinicia: la mejor de otra semana cuenta como 0', () => {
    registrarPartidaSemana('verb_pop', '2026-W46', 3000)
    assert.equal(leerMejorSemana('verb_pop', '2026-W47'), 0)
    assert.deepEqual(registrarPartidaSemana('verb_pop', '2026-W47', 400), { mejorSemana: 400, nuevoRecord: false })
    assert.deepEqual(registrarPartidaSemana('verb_pop', '2026-W47', 450), { mejorSemana: 450, nuevoRecord: true })
  })

  test('una partida de 0 puntos no deja récord previo', () => {
    assert.deepEqual(registrarPartidaSemana('verb_pop', '2026-W46', 0), { mejorSemana: 0, nuevoRecord: false })
    assert.deepEqual(registrarPartidaSemana('verb_pop', '2026-W46', 300), { mejorSemana: 300, nuevoRecord: false })
  })
})

describe('pantalla de fin de Challenge', () => {
  const resultado = { fase: FASE.FIN_TIEMPO, puntos: 1850, mejorSemana: 3200, nuevoRecord: false, aciertos: 14, mejorCombo: 3 }
  const pintar = (envio, otro = resultado) =>
    renderToStaticMarkup(createElement(CuerpoResultado, { resultado: otro, envio, alReintentar: () => {}, alRepetir: () => {} }))
  const texto = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

  test('puntuación en grande y debajo la mejor de la semana', () => {
    const html = pintar(null)
    assert.match(html, new RegExp(`class="resultado-final__puntos"><span[^>]*>${v.puntos} </span>${textos.numero(1850)}</p>`))
    assert.match(html, new RegExp(`>${v.mejorSemanaN(textos.numero(3200))}<`))
    assert.ok(html.indexOf('resultado-final__puntos') < html.indexOf('resultado-final__mejor'))
  })

  test('una sola línea pequeña con Correct y Best combo; sin el Best de siempre', () => {
    const html = pintar(null)
    assert.equal(v.detalle(14, 3), 'Correct 14 · Best combo 3')
    assert.match(html, new RegExp(`class="resultado-final__detalle">${v.detalle(14, 3)}<`))
    assert.doesNotMatch(texto(html), new RegExp(`\\b${v.record}:`))
  })

  test('"New record!" solo cuando toca, con estrella además del color', () => {
    assert.ok(!pintar(null).includes(v.nuevoRecord))
    const html = pintar(null, { ...resultado, puntos: 3300, mejorSemana: 3300, nuevoRecord: true })
    assert.match(html, new RegExp(`class="resultado-final__record"><svg[^>]*aria-hidden="true"[^>]*>.*</svg>${v.nuevoRecord}</p>`))
  })

  test('título según cómo acabó', () => {
    assert.match(pintar(null), new RegExp(v.finTiempo))
    assert.match(pintar(null, { ...resultado, fase: FASE.FIN_VIDAS }), new RegExp(v.finVidas))
  })

  test('tres salidas con texto: Play again, Ranking y Home', () => {
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

  test('sin ranking, enviando o con error no dice "Saved as"', () => {
    assert.ok(!pintar(null).includes('Saved as'))
    assert.ok(!pintar({ estado: 'enviando' }).includes('Saved as'))
    assert.ok(!pintar({ estado: 'error', motivo: 'sinConexion' }).includes('Saved as'))
  })

  test('enviando y error con reintento', () => {
    assert.match(pintar({ estado: 'enviando' }), />Sending…</)
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
