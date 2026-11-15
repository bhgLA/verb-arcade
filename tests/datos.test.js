import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { motivoDeError, MOTIVOS } from '../src/datos/errores.js'
import { leerRespuesta } from '../src/datos/supabase.js'
import { generarApodo, ADJETIVOS, ANIMALES, FORMATO_APODO } from '../src/datos/apodo.js'
import { normalizarClase, guardarClase, FORMATO_CLASE } from '../src/datos/clase.js'
import { enviarPuntuacion, leerRanking } from '../src/datos/ranking.js'
import { textos } from '../src/textos.js'

const SCHEMA = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8')

describe('errores de submit_score', () => {
  // Todos los "raise exception" del schema, para que un error nuevo no se cuele sin texto.
  const mensajes = [...SCHEMA.matchAll(/raise exception '([^']+)'/g)].map((m) => m[1])

  test('el schema tiene los errores del comentario', () => {
    const comentario = /Errores posibles:([\s\S]*?)\ncreate/.exec(SCHEMA)[1]
    const listados = comentario.replace(/--/g, '').split('|').map((s) => s.trim())
    assert.deepEqual([...new Set(mensajes)].sort(), [...listados].sort())
  })

  test('cada error tiene un motivo propio y un texto', () => {
    const vistos = new Set()
    for (const mensaje of mensajes) {
      const motivo = motivoDeError({ ok: false, motivo: 'http-400', mensaje })
      assert.notEqual(motivo, 'desconocido', mensaje)
      vistos.add(motivo)
    }
    assert.equal(vistos.size, new Set(mensajes).size)
  })

  test('todos los motivos tienen texto', () => {
    for (const m of MOTIVOS) assert.ok(textos.ranking.errores[m], m)
  })

  test('sin red o sin configurar es sinConexion; lo raro, desconocido', () => {
    assert.equal(motivoDeError({ motivo: 'sin-config' }), 'sinConexion')
    assert.equal(motivoDeError({ motivo: 'sin-conexion' }), 'sinConexion')
    assert.equal(motivoDeError({ motivo: 'http-503' }), 'sinConexion')
    assert.equal(motivoDeError({ motivo: 'http-400', mensaje: 'otra cosa' }), 'desconocido')
    assert.equal(motivoDeError(undefined), 'desconocido')
  })
})

describe('leerRespuesta', () => {
  test('204 sin cuerpo (función void) es éxito', async () => {
    assert.deepEqual(await leerRespuesta(new Response(null, { status: 204 })), { ok: true, datos: null })
  })

  test('200 con JSON', async () => {
    const r = await leerRespuesta(new Response('[{"pos":1,"nick":"BraveFox12","score":900}]', { status: 200 }))
    assert.equal(r.ok, true)
    assert.equal(r.datos[0].nick, 'BraveFox12')
  })

  test('400 de raise exception trae el mensaje', async () => {
    const cuerpo = JSON.stringify({ code: 'P0001', message: 'daily limit', details: null, hint: null })
    const r = await leerRespuesta(new Response(cuerpo, { status: 400 }))
    assert.deepEqual(r, { ok: false, motivo: 'http-400', mensaje: 'daily limit' })
    assert.equal(motivoDeError(r), 'limiteDiario')
  })

  test('error con cuerpo que no es JSON', async () => {
    const r = await leerRespuesta(new Response('<html>Bad gateway</html>', { status: 502 }))
    assert.deepEqual(r, { ok: false, motivo: 'http-502', mensaje: '' })
  })
})

describe('apodo', () => {
  test('todas las combinaciones pasan el check del servidor', () => {
    for (const a of ADJETIVOS) for (const b of ANIMALES) for (const n of [10, 99]) {
      assert.match(`${a}${b}${n}`, FORMATO_APODO)
    }
  })

  test('generarApodo usa las listas cerradas', () => {
    assert.equal(generarApodo(() => 0), `${ADJETIVOS[0]}${ANIMALES[0]}10`)
    assert.equal(generarApodo(() => 0.9999), `${ADJETIVOS.at(-1)}${ANIMALES.at(-1)}99`)
  })
})

describe('código de clase', () => {
  test('se normaliza a mayúsculas sin espacios', () => {
    assert.equal(normalizarClase('  ab12 '), 'AB12')
    assert.equal(normalizarClase(''), null)
    assert.equal(normalizarClase(null), null)
  })

  test('mismo formato que el schema', () => {
    assert.ok(SCHEMA.includes(`'${FORMATO_CLASE.source}'`))
    assert.deepEqual(guardarClase('a'), { ok: false, motivo: 'codigoClase' })
    assert.deepEqual(guardarClase('ab-1'), { ok: false, motivo: 'codigoClase' })
    assert.equal(guardarClase('ab12').ok, true)
  })
})

describe('sin Supabase el juego sigue', () => {
  test('enviarPuntuacion y leerRanking no lanzan', async () => {
    assert.deepEqual(await enviarPuntuacion('verb_pop', 1200), { ok: false, motivo: 'sinConexion' })
    assert.deepEqual(await leerRanking('verb_pop'), { ok: false, motivo: 'sinConexion' })
    assert.deepEqual(await enviarPuntuacion('verb_pop', -5), { ok: false, motivo: 'puntuacion' })
    assert.deepEqual(await enviarPuntuacion('tetris', 5), { ok: false, motivo: 'juego' })
  })
})
