import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  normalizarProgreso,
  progresoDe,
  registrarRespuesta,
  elegirVerbo,
  tiposDeEstudio,
  crearPreguntaEstudio,
  contarDesbloqueadas,
  completaElMundo,
  pistaDe,
} from '../src/motor/estudio.js'
import { crearAleatorio } from '../src/motor/aleatorio.js'
import { normalizar } from '../src/motor/preguntas.js'
import { ACIERTOS_PARA_CARTA, OPCIONES_POR_TIPO } from '../src/motor/config.js'

const { verbs: VERBOS } = JSON.parse(readFileSync(new URL('../src/contenido/verbos.json', import.meta.url), 'utf8'))
const delMundo = (n) => VERBOS.filter((v) => v.world === n)
const MUNDOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

describe('desbloqueo de cartas', () => {
  test('3 aciertos acumulados, no seguidos, desbloquean la carta', () => {
    let p = {}
    const pasos = [true, false, true, false, false, true]
    const avisos = []
    for (const ok of pasos) {
      const r = registrarRespuesta(p, 'go', ok)
      p = r.progreso
      avisos.push(r.desbloqueadaAhora)
    }
    assert.deepEqual(avisos, [false, false, false, false, false, true])
    assert.deepEqual(progresoDe(p, 'go'), { aciertos: 3, fallos: 3, desbloqueada: true })
  })

  test('avisa del mundo completo solo con la carta 9 -> 10', () => {
    const mundo = delMundo(1)
    const [ultimo, ...resto] = mundo
    let p = Object.fromEntries(resto.map((v) => [v.verb, { aciertos: 3, fallos: 0, desbloqueada: true }]))
    const avisos = []
    for (let i = 0; i < ACIERTOS_PARA_CARTA + 1; i++) {
      const r = registrarRespuesta(p, ultimo.verb, true, mundo)
      p = r.progreso
      avisos.push(r.mundoCompletadoAhora)
    }
    assert.deepEqual(avisos, [false, false, true, false], 'una vez completo, no vuelve a avisar')
    assert.equal(contarDesbloqueadas(p, mundo), 10)

    // Mundo ya completo al empezar: ningún acierto ni fallo avisa.
    const completo = p
    assert.equal(registrarRespuesta(completo, resto[0].verb, true, mundo).mundoCompletadoAhora, false)
    assert.equal(registrarRespuesta(completo, resto[0].verb, false, mundo).mundoCompletadoAhora, false)
    assert.equal(completaElMundo(completo, completo, mundo), false)
  })

  test('sin los verbos del mundo no hay aviso, y un fallo nunca completa', () => {
    const mundo = delMundo(2)
    const [ultimo, ...resto] = mundo
    const p = {
      ...Object.fromEntries(resto.map((v) => [v.verb, { aciertos: 3, fallos: 0, desbloqueada: true }])),
      [ultimo.verb]: { aciertos: 2, fallos: 0, desbloqueada: false },
    }
    assert.equal(registrarRespuesta(p, ultimo.verb, false, mundo).mundoCompletadoAhora, false)
    assert.equal(registrarRespuesta(p, ultimo.verb, true).mundoCompletadoAhora, false)
    assert.equal(registrarRespuesta(p, ultimo.verb, true, mundo).mundoCompletadoAhora, true)
  })

  test('un fallo no resta aciertos', () => {
    let p = registrarRespuesta({}, 'see', true).progreso
    p = registrarRespuesta(p, 'see', false).progreso
    p = registrarRespuesta(p, 'see', false).progreso
    assert.equal(progresoDe(p, 'see').aciertos, 1)
    assert.equal(progresoDe(p, 'see').fallos, 2)
  })

  test('el aviso de carta nueva sale una sola vez', () => {
    let p = {}
    let avisos = 0
    for (let i = 0; i < 6; i++) {
      const r = registrarRespuesta(p, 'eat', true)
      p = r.progreso
      if (r.desbloqueadaAhora) avisos++
    }
    assert.equal(avisos, 1)
    assert.equal(progresoDe(p, 'eat').aciertos, 6)
  })

  test('registrarRespuesta no modifica el progreso recibido', () => {
    const original = { go: { aciertos: 2, fallos: 0, desbloqueada: false } }
    registrarRespuesta(original, 'go', true)
    assert.deepEqual(original, { go: { aciertos: 2, fallos: 0, desbloqueada: false } })
  })

  test('normalizarProgreso limpia lo que venga de localStorage', () => {
    assert.deepEqual(normalizarProgreso(null), {})
    assert.deepEqual(normalizarProgreso([1, 2]), {})
    assert.deepEqual(normalizarProgreso({ go: { aciertos: -2, fallos: 'x' }, see: 5 }), {
      go: { aciertos: 0, fallos: 0, desbloqueada: false },
    })
    assert.equal(normalizarProgreso({ go: { aciertos: ACIERTOS_PARA_CARTA } }).go.desbloqueada, true)
  })
})

describe('elección de verbos', () => {
  test('da prioridad al verbo con menos aciertos', () => {
    const verbos = delMundo(1)
    const p = Object.fromEntries(verbos.map((v) => [v.verb, { aciertos: 2, fallos: 0, desbloqueada: false }]))
    p.go = { aciertos: 0, fallos: 4, desbloqueada: false }
    for (let s = 0; s < 20; s++) assert.equal(elegirVerbo(verbos, p, 'say', crearAleatorio(s)).verb, 'go')
  })

  test('nunca repite el anterior, aunque sea el de menos aciertos', () => {
    const verbos = delMundo(1)
    const p = Object.fromEntries(verbos.map((v) => [v.verb, { aciertos: 2, fallos: 0, desbloqueada: false }]))
    p.go = { aciertos: 0, fallos: 4, desbloqueada: false }
    for (let s = 0; s < 20; s++) assert.notEqual(elegirVerbo(verbos, p, 'go', crearAleatorio(s)).verb, 'go')
  })

  test('con un solo verbo lo devuelve', () => {
    const uno = delMundo(1).slice(0, 1)
    assert.equal(elegirVerbo(uno, {}, uno[0].verb, crearAleatorio(1)).verb, uno[0].verb)
  })

  test('sesiones largas en los 10 mundos: nunca el mismo verbo seguido y siempre de los de menos aciertos', () => {
    for (const n of MUNDOS) {
      const verbos = delMundo(n)
      const rng = crearAleatorio(`sesion-${n}`)
      let p = {}
      let anterior = null
      for (let i = 0; i < 300; i++) {
        const v = elegirVerbo(verbos, p, anterior, rng)
        assert.notEqual(v.verb, anterior, `mundo ${n}, pregunta ${i}`)
        const minimo = Math.min(...verbos.filter((x) => x.verb !== anterior).map((x) => progresoDe(p, x.verb).aciertos))
        assert.equal(progresoDe(p, v.verb).aciertos, minimo)
        p = registrarRespuesta(p, v.verb, rng() < 0.6).progreso
        anterior = v.verb
      }
    }
  })

  test('acertándolo todo, 30 preguntas desbloquean las 10 cartas del mundo', () => {
    const verbos = delMundo(3)
    const rng = crearAleatorio(7)
    let p = {}
    let anterior = null
    for (let i = 0; i < 30; i++) {
      const v = elegirVerbo(verbos, p, anterior, rng)
      p = registrarRespuesta(p, v.verb, true).progreso
      anterior = v.verb
    }
    assert.equal(contarDesbloqueadas(p, verbos), 10)
  })
})

describe('preguntas de estudio', () => {
  test('mímica solo para verbos que se pueden mimar', () => {
    for (const v of VERBOS) {
      assert.equal(tiposDeEstudio(v).includes('mimica'), v.mimica === true && Boolean(v.emoji), v.verb)
    }
  })

  test('cada verbo de cada mundo genera preguntas válidas de todos sus tipos', () => {
    for (const n of MUNDOS) {
      for (const v of delMundo(n)) {
        for (let s = 0; s < 12; s++) {
          const p = crearPreguntaEstudio(v, VERBOS, n, crearAleatorio(`${v.verb}-${s}`))
          assert.equal(p.verbo, v.verb)
          assert.ok(tiposDeEstudio(v).includes(p.tipo))
          assert.equal(p.opciones.length, OPCIONES_POR_TIPO[p.tipo])
          assert.equal(new Set(p.opciones.map(normalizar)).size, p.opciones.length)
          assert.ok(p.opciones.includes(p.correcta))
        }
      }
    }
  })

  test('la pista tacha una opción incorrecta, nunca la correcta', () => {
    for (const v of delMundo(5)) {
      for (let s = 0; s < 8; s++) {
        const p = crearPreguntaEstudio(v, VERBOS, 5, crearAleatorio(s))
        const { texto, descartar } = pistaDe(p, v)
        assert.ok(texto.length > 0)
        assert.ok(p.opciones.includes(descartar))
        assert.notEqual(descartar, p.correcta)
      }
    }
  })
})
