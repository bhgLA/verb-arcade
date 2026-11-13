import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { semanaISO, mundoDeLaSemana, poolDeLaSemana } from '../src/motor/semana.js'
import { crearAleatorio, barajar, elegir } from '../src/motor/aleatorio.js'
import { crearPregunta, regularizar, mismoGrupoAmbiguo, normalizar } from '../src/motor/preguntas.js'
import { secuenciaSemanal } from '../src/motor/secuencia.js'
import { GRUPOS_AMBIGUOS, OPCIONES_POR_TIPO, JUEGOS, MINIMO_POOL } from '../src/motor/config.js'

const { verbs: VERBOS } = JSON.parse(readFileSync(new URL('../src/contenido/verbos.json', import.meta.url), 'utf8'))
const porVerbo = new Map(VERBOS.map((v) => [v.verb, v]))
const MIMICA = VERBOS.filter((v) => v.mimica)
const SEMILLAS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
// Diez semanas seguidas recorren los diez mundos del ciclo.
const CICLO = Array.from({ length: 10 }, (_, i) => `2026-W${String(i + 1).padStart(2, '0')}`)

function comprobarPregunta(p) {
  const v = porVerbo.get(p.verbo)
  assert.ok(v, `verbo desconocido: ${p.verbo}`)
  assert.equal(p.opciones.length, OPCIONES_POR_TIPO[p.tipo], `${p.verbo}/${p.tipo}: número de opciones`)
  const normalizadas = p.opciones.map(normalizar)
  assert.equal(new Set(normalizadas).size, p.opciones.length, `${p.verbo}/${p.tipo}: opciones repetidas ${p.opciones}`)
  assert.equal(normalizadas.filter((o) => o === normalizar(p.correcta)).length, 1, `${p.verbo}/${p.tipo}: correcta`)
  const esperada = { pasado: v.past, participio: v.participle, significado: v.es, mimica: v.verb }[p.tipo]
  assert.equal(p.correcta, esperada, `${p.verbo}/${p.tipo}: la correcta no es la del verbo`)
  assert.ok(typeof p.enunciado === 'string' && p.enunciado.length > 0)
  if (p.tipo === 'mimica') {
    assert.equal(p.enunciado, v.emoji)
    for (const o of p.opciones) assert.ok(porVerbo.get(o)?.mimica, `${o} no es de mímica`)
    for (let i = 0; i < p.opciones.length; i++) {
      for (let j = i + 1; j < p.opciones.length; j++) {
        assert.ok(
          !mismoGrupoAmbiguo(p.opciones[i], p.opciones[j]),
          `mímica de ${p.verbo} mezcla ${p.opciones[i]} y ${p.opciones[j]}`,
        )
      }
    }
  }
}

describe('semanaISO', () => {
  test('cambio de año: 2026-12-31 y 2027-01-01 son 2026-W53', () => {
    assert.equal(semanaISO(new Date('2026-12-31T12:00:00+01:00')), '2026-W53')
    assert.equal(semanaISO(new Date('2027-01-01T12:00:00+01:00')), '2026-W53')
    assert.equal(semanaISO(new Date('2027-01-04T12:00:00+01:00')), '2027-W01')
    assert.equal(semanaISO(new Date('2025-12-29T12:00:00+01:00')), '2026-W01')
  })

  test('medianoche de Madrid en invierno (UTC+1)', () => {
    // Domingo 23:59:59 en Madrid
    assert.equal(semanaISO(new Date('2026-01-04T22:59:59Z')), '2026-W01')
    // Lunes 00:00 en Madrid, pero aún domingo en UTC
    assert.equal(semanaISO(new Date('2026-01-04T23:00:00Z')), '2026-W02')
  })

  test('medianoche de Madrid en verano (UTC+2)', () => {
    assert.equal(semanaISO(new Date('2026-06-28T21:59:59Z')), '2026-W26')
    assert.equal(semanaISO(new Date('2026-06-28T22:00:00Z')), '2026-W27')
  })

  test('cambio de año en la medianoche de Madrid', () => {
    assert.equal(semanaISO(new Date('2027-01-03T22:59:59Z')), '2026-W53')
    assert.equal(semanaISO(new Date('2027-01-03T23:00:00Z')), '2027-W01')
  })

  test('rechaza fechas no válidas', () => {
    assert.throws(() => semanaISO(new Date('no es fecha')))
  })
})

describe('mundo y pool de la semana', () => {
  test('mundoDeLaSemana = (semana % 10) + 1', () => {
    assert.equal(mundoDeLaSemana('2026-W46'), 7)
    assert.equal(mundoDeLaSemana('2026-W10'), 1)
    assert.equal(mundoDeLaSemana('2026-W01'), 2)
    assert.equal(mundoDeLaSemana('2026-W53'), 4)
    assert.throws(() => mundoDeLaSemana('2026-46'))
    assert.throws(() => mundoDeLaSemana('2026-W54'))
  })

  test('la pool acumula los mundos 1..N y mímica solo lleva verbos con mimica', () => {
    for (const semana of CICLO) {
      const mundo = mundoDeLaSemana(semana)
      const pop = poolDeLaSemana(VERBOS, semana, 'verb_pop')
      assert.equal(pop.length, mundo * 10)
      assert.ok(pop.every((v) => v.world <= mundo))
      const mim = poolDeLaSemana(VERBOS, semana, 'mimica')
      assert.ok(mim.length >= MINIMO_POOL, `${semana}: solo ${mim.length} verbos de mímica`)
      assert.ok(mim.every((v) => v.mimica && v.world <= mundo))
    }
  })

  test('lanza un error claro si la pool tiene menos de 4 verbos', () => {
    const pocos = VERBOS.filter((v) => v.world === 1).slice(0, 3)
    assert.throws(() => poolDeLaSemana(pocos, '2026-W10', 'verb_pop'), /al menos 4/)
    assert.throws(() => poolDeLaSemana(VERBOS, '2026-W10', 'otro_juego'), /desconocido/)
  })
})

describe('aleatorio', () => {
  test('misma semilla, misma serie; otra semilla, otra serie', () => {
    const serie = (s) => Array.from({ length: 10 }, crearAleatorio(s))
    assert.deepEqual(serie('verb_pop|2026-W46'), serie('verb_pop|2026-W46'))
    assert.notDeepEqual(serie('verb_pop|2026-W46'), serie('verb_pop|2026-W47'))
    assert.ok(serie('x').every((n) => n >= 0 && n < 1))
  })

  test('barajar devuelve una permutación sin tocar el original', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8]
    const b = barajar(original, crearAleatorio(1))
    assert.deepEqual(original, [1, 2, 3, 4, 5, 6, 7, 8])
    assert.deepEqual([...b].sort((x, y) => x - y), original)
  })

  test('elegir devuelve un elemento de la lista', () => {
    const rng = crearAleatorio(2)
    for (let i = 0; i < 50; i++) assert.ok(['a', 'b', 'c'].includes(elegir(['a', 'b', 'c'], rng)))
    assert.throws(() => elegir([], rng))
  })
})

describe('preguntas', () => {
  test('regularizar imita el error de los regulares', () => {
    assert.equal(regularizar('go'), 'goed')
    assert.equal(regularizar('run'), 'runned')
    assert.equal(regularizar('make'), 'maked')
    assert.equal(regularizar('be'), 'beed')
    assert.equal(regularizar('cry'), 'cried')
    assert.equal(regularizar('stop'), 'stopped')
    assert.equal(regularizar('open'), 'opened')
  })

  test('pasado, participio y significado: ningún distractor repite ni iguala la correcta', () => {
    for (const v of VERBOS) {
      for (const tipo of ['pasado', 'participio', 'significado']) {
        for (const s of SEMILLAS) comprobarPregunta(crearPregunta(tipo, v, VERBOS, crearAleatorio(s)))
      }
    }
  })

  test('"was / were" es una sola opción', () => {
    const be = porVerbo.get('be')
    for (const s of SEMILLAS) {
      const p = crearPregunta('pasado', be, VERBOS, crearAleatorio(s))
      assert.equal(p.correcta, 'was / were')
      assert.equal(p.opciones.filter((o) => o === 'was / were').length, 1)
      assert.ok(!p.opciones.some((o) => o === 'was' || o === 'were'))
    }
  })

  test('los distractores de un irregular incluyen formas plausibles', () => {
    const go = porVerbo.get('go')
    for (const s of SEMILLAS) {
      const p = crearPregunta('pasado', go, VERBOS, crearAleatorio(s))
      assert.ok(p.opciones.includes('goed') || p.opciones.includes('gone'), p.opciones.join(', '))
    }
  })

  test('si past === participle, la otra forma no aparece duplicada', () => {
    const put = porVerbo.get('put')
    for (const s of SEMILLAS) {
      const p = crearPregunta('participio', put, VERBOS, crearAleatorio(s))
      assert.equal(p.opciones.filter((o) => o === 'put').length, 1)
    }
  })

  test('significado no junta traducciones que se pisan', () => {
    const make = porVerbo.get('make')
    for (const s of SEMILLAS) {
      const p = crearPregunta('significado', make, VERBOS, crearAleatorio(s))
      assert.ok(!p.opciones.some((o) => o.startsWith('hacer (tareas')), p.opciones.join(' | '))
    }
  })

  test('mímica: 4 opciones, sin verbos del mismo grupo ambiguo', () => {
    const minima = poolDeLaSemana(VERBOS, '2026-W10', 'mimica') // mundo 1, la pool más pequeña
    for (const v of MIMICA) {
      for (const s of SEMILLAS) comprobarPregunta(crearPregunta('mimica', v, MIMICA, crearAleatorio(s)))
    }
    for (const v of minima) {
      for (const s of SEMILLAS) comprobarPregunta(crearPregunta('mimica', v, minima, crearAleatorio(s)))
    }
  })

  test('mímica rechaza verbos sin mímica', () => {
    assert.throws(() => crearPregunta('mimica', porVerbo.get('have'), MIMICA, crearAleatorio(0)))
  })
})

describe('secuenciaSemanal', () => {
  test('es determinista', () => {
    for (const juego of JUEGOS) {
      assert.deepEqual(
        secuenciaSemanal(VERBOS, juego, '2026-W46'),
        secuenciaSemanal(VERBOS, juego, '2026-W46'),
      )
    }
  })

  test('cambia con la semana (aunque el mundo sea el mismo) y con el juego', () => {
    const base = secuenciaSemanal(VERBOS, 'verb_pop', '2026-W01')
    assert.notDeepEqual(base, secuenciaSemanal(VERBOS, 'verb_pop', '2026-W11'))
    const mim = secuenciaSemanal(VERBOS, 'mimica', '2026-W01')
    assert.notDeepEqual(base.map((p) => p.verbo), mim.map((p) => p.verbo))
  })

  test('las 10 semanas del ciclo generan secuencias válidas en los dos juegos', () => {
    for (const semana of CICLO) {
      for (const juego of JUEGOS) {
        const pool = new Set(poolDeLaSemana(VERBOS, semana, juego).map((v) => v.verb))
        const sec = secuenciaSemanal(VERBOS, juego, semana)
        assert.equal(sec.length, 200)
        sec.forEach((p, i) => {
          comprobarPregunta(p)
          assert.ok(pool.has(p.verbo), `${semana}/${juego}: ${p.verbo} no está en la pool`)
          if (i > 0) assert.notEqual(p.verbo, sec[i - 1].verbo, `${semana}/${juego}: verbo repetido seguido`)
          if (juego === 'verb_pop') assert.ok(['pasado', 'participio'].includes(p.tipo))
        })
      }
    }
  })
})

describe('configuración', () => {
  test('los grupos ambiguos son válidos: verbos existentes, sin repetir dentro del grupo ni grupos duplicados', () => {
    const firmas = new Set()
    for (const grupo of GRUPOS_AMBIGUOS) {
      assert.ok(grupo.length >= 2, `grupo con menos de 2 verbos: ${grupo}`)
      assert.equal(new Set(grupo).size, grupo.length, `verbo repetido en el grupo ${grupo}`)
      for (const v of grupo) assert.ok(porVerbo.has(v), `${v} no está en verbos.json`)
      const firma = [...grupo].sort().join(',')
      assert.ok(!firmas.has(firma), `grupo duplicado: ${grupo}`)
      firmas.add(firma)
    }
  })

  test('un verbo en dos grupos choca con los miembros de ambos', () => {
    assert.ok(mismoGrupoAmbiguo('look', 'see'))
    assert.ok(mismoGrupoAmbiguo('look', 'find'))
    assert.ok(!mismoGrupoAmbiguo('see', 'find'))
    assert.ok(mismoGrupoAmbiguo('take', 'catch'))
    assert.ok(mismoGrupoAmbiguo('take', 'give'))
  })
})
