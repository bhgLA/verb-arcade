// Selector de apodo: listas cerradas, conservar el número y reenvío al servidor.
// fetch y localStorage simulados: nunca llama al servidor real.
import { test, describe, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { configurarSupabase } from '../src/datos/supabase.js'
import { ADJETIVOS, ANIMALES, piezasDelApodo, elegirApodo, leerApodo } from '../src/datos/apodo.js'
import { enviarPuntuacion, avisarCambioPerfil } from '../src/datos/ranking.js'
import { guardarClase } from '../src/datos/clase.js'
import { aEstado, cargarVista, VISTA } from '../src/componentes/ranking/estado.js'
import { SelectorApodo } from '../src/componentes/ranking/SelectorApodo.js'
import { CuerpoRanking } from '../src/componentes/ranking/CuerpoRanking.js'
import { semanaISO } from '../src/motor/semana.js'

const SCHEMA = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8')
const LISTAS = JSON.parse(readFileSync(new URL('../src/contenido/apodos.json', import.meta.url), 'utf8'))
// El regex sale del propio check de submit_score, no de una copia.
const REGEX_SERVIDOR = new RegExp(/p_nick !~ '([^']+)'/.exec(SCHEMA)[1])

let llamadas = []
let responder = () => new Response(null, { status: 204 })
const fetchOriginal = globalThis.fetch
let almacen

function almacenFalso() {
  const m = new Map()
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  }
}
const poner = (clave, valor) => almacen.setItem(`verb-arcade:${clave}`, JSON.stringify(valor))
const sacar = (clave) => JSON.parse(almacen.getItem(`verb-arcade:${clave}`))
const error = (mensaje) => () => new Response(JSON.stringify({ message: mensaje }), { status: 400 })
const envios = () => llamadas.filter((l) => l.funcion === 'submit_score')

beforeEach(() => {
  configurarSupabase({ url: 'https://prueba.invalid', clave: 'sb_publishable_prueba' })
  llamadas = []
  responder = () => new Response(null, { status: 204 })
  almacen = almacenFalso()
  globalThis.window = { localStorage: almacen }
  globalThis.fetch = async (url, opciones) => {
    const llamada = { funcion: String(url).split('/rpc/')[1], args: JSON.parse(opciones.body) }
    llamadas.push(llamada)
    return responder(llamada)
  }
})

after(() => {
  globalThis.fetch = fetchOriginal
  delete globalThis.window
  configurarSupabase()
})

describe('listas de apodos', () => {
  test('salen del fichero de contenido, 12 y 12', () => {
    assert.deepEqual([...ADJETIVOS], LISTAS.adjetivos)
    assert.deepEqual([...ANIMALES], LISTAS.animales)
    assert.equal(ADJETIVOS.length, 12)
    assert.equal(ANIMALES.length, 12)
  })

  test('sin duplicados, tampoco ignorando mayúsculas ni entre listas', () => {
    const todas = [...ADJETIVOS, ...ANIMALES].map((p) => p.toLowerCase())
    assert.equal(new Set(todas).size, todas.length)
  })

  test('toda combinación posible pasa el regex del servidor y cabe en 20', () => {
    assert.ok(REGEX_SERVIDOR.test('BraveFox12'))
    for (const a of ADJETIVOS) for (const b of ANIMALES) for (let n = 10; n <= 99; n++) {
      const apodo = `${a}${b}${n}`
      assert.ok(REGEX_SERVIDOR.test(apodo), apodo)
      assert.ok(apodo.length <= 20, apodo)
    }
  })
})

describe('piezas del apodo', () => {
  test('separa adjetivo, animal y número', () => {
    assert.deepEqual(piezasDelApodo('CosmicPenguin07'), { adjetivo: 'Cosmic', animal: 'Penguin', numero: '07' })
  })

  test('palabras que ya no están: la primera de su lista, con el mismo número', () => {
    assert.deepEqual(piezasDelApodo('ZippySquid42'), { adjetivo: ADJETIVOS[0], animal: ANIMALES[0], numero: '42' })
    assert.deepEqual(piezasDelApodo('HappySquid42'), { adjetivo: 'Happy', animal: ANIMALES[0], numero: '42' })
    assert.deepEqual(piezasDelApodo('ZippyOwl42'), { adjetivo: ADJETIVOS[0], animal: 'Owl', numero: '42' })
  })

  test('elegirApodo conserva el número y rechaza piezas de fuera', () => {
    poner('apodo', 'ZippySquid42')
    assert.equal(elegirApodo('Golden', 'Whale'), 'GoldenWhale42')
    assert.equal(leerApodo(), 'GoldenWhale42')
    assert.equal(elegirApodo('Zippy', 'Whale'), null)
    assert.equal(elegirApodo('Golden', 'Squid'), null)
    assert.equal(leerApodo(), 'GoldenWhale42')
  })
})

describe('el cambio de apodo llega al servidor', () => {
  const semana = () => semanaISO()

  test('sin puntuación esta semana no envía nada', async () => {
    assert.deepEqual(await avisarCambioPerfil(), { reenviados: [], pendientes: [] })
    assert.equal(llamadas.length, 0)
  })

  test('primer cambio del día: reenvía la mejor puntuación con el apodo nuevo', async () => {
    poner('enviado:verb_pop', { semana: semana(), puntos: 3200, clase: null })
    poner('apodo', 'BraveFox12')
    elegirApodo('Magic', 'Owl')
    assert.deepEqual(await avisarCambioPerfil(), { reenviados: ['verb_pop'], pendientes: [] })
    assert.equal(envios().length, 1)
    assert.equal(envios()[0].args.p_nick, 'MagicOwl12')
    assert.equal(envios()[0].args.p_score, 3200)
    assert.equal(sacar('perfilPendiente:verb_pop'), false)
  })

  test('segundo cambio del mismo día: queda pendiente y no llama al servidor', async () => {
    poner('enviado:verb_pop', { semana: semana(), puntos: 3200, clase: null })
    await avisarCambioPerfil()
    llamadas = []
    assert.deepEqual(await avisarCambioPerfil(), { reenviados: [], pendientes: ['verb_pop'] })
    assert.equal(llamadas.length, 0)
    assert.equal(sacar('perfilPendiente:verb_pop'), true)
  })

  test('si el reenvío falla queda pendiente', async () => {
    poner('enviado:verb_pop', { semana: semana(), puntos: 3200, clase: null })
    responder = error('too fast')
    assert.deepEqual(await avisarCambioPerfil(), { reenviados: [], pendientes: ['verb_pop'] })
    assert.equal(sacar('perfilPendiente:verb_pop'), true)
  })

  test('pendiente: la próxima partida envía aunque no mejore y no baja la mejor guardada', async () => {
    poner('enviado:verb_pop', { semana: semana(), puntos: 3200, clase: null })
    poner('perfilPendiente:verb_pop', true)
    poner('apodo', 'JollyKoala55')

    assert.deepEqual(await enviarPuntuacion('verb_pop', 900), { ok: true, enviada: false })
    assert.equal(envios().length, 1)
    assert.equal(envios()[0].args.p_nick, 'JollyKoala55')
    assert.deepEqual(sacar('enviado:verb_pop'), { semana: semana(), puntos: 3200, clase: null, nick: 'JollyKoala55' })
    assert.equal(sacar('perfilPendiente:verb_pop'), false)

    // Ya sin marca, otra partida peor no gasta envío.
    llamadas = []
    assert.deepEqual(await enviarPuntuacion('verb_pop', 900), { ok: true, enviada: false })
    assert.equal(llamadas.length, 0)
  })

  test('pendiente con fallo: la partida no enseña error y la marca sigue', async () => {
    poner('enviado:verb_pop', { semana: semana(), puntos: 3200, clase: null })
    poner('perfilPendiente:verb_pop', true)
    responder = error('daily limit')
    assert.deepEqual(await enviarPuntuacion('verb_pop', 900), { ok: true, enviada: false })
    assert.equal(sacar('perfilPendiente:verb_pop'), true)
    assert.equal(sacar('enviado:verb_pop').puntos, 3200)
  })

  test('pendiente y la partida mejora: guarda la nueva mejor', async () => {
    poner('enviado:verb_pop', { semana: semana(), puntos: 3200, clase: null })
    poner('perfilPendiente:verb_pop', true)
    assert.deepEqual(await enviarPuntuacion('verb_pop', 4100), { ok: true, enviada: true })
    assert.equal(sacar('enviado:verb_pop').puntos, 4100)
    assert.equal(sacar('perfilPendiente:verb_pop'), false)
  })
})

describe('selector', () => {
  const pintar = (apodo) =>
    renderToStaticMarkup(createElement(SelectorApodo, { apodo, alGuardar: () => {}, alCancelar: () => {} }))

  test('sin campos de texto: solo botones de piezas cerradas', () => {
    const html = pintar('CosmicPenguin07')
    assert.doesNotMatch(html, /<input|<textarea|contenteditable/)
    assert.equal(html.match(/selector-apodo__pieza[ "]/g).length, ADJETIVOS.length + ANIMALES.length)
  })

  test('preselecciona las piezas del apodo y enseña cómo queda', () => {
    const html = pintar('CosmicPenguin07')
    assert.equal(html.match(/aria-pressed="true"/g).length, 2)
    assert.match(html, /aria-pressed="true"[^>]*>Cosmic</)
    assert.match(html, /aria-pressed="true"[^>]*>Penguin</)
    assert.match(html, />CosmicPenguin07</)
  })

  test('apodo con palabras antiguas: preselecciona la primera de cada lista', () => {
    const html = pintar('ZippySquid42')
    assert.match(html, new RegExp(`aria-pressed="true"[^>]*>${ADJETIVOS[0]}<`))
    assert.match(html, new RegExp(`aria-pressed="true"[^>]*>${ANIMALES[0]}<`))
    assert.match(html, new RegExp(`>${ADJETIVOS[0]}${ANIMALES[0]}42<`))
  })
})

describe('perfil pendiente: apodo y clase', () => {
  const semana = () => semanaISO()
  const registro = (extra = {}) => ({ semana: semana(), puntos: 3200, clase: null, nick: 'BraveFox12', ...extra })

  test('con clase guardada el envío lleva ese código', async () => {
    guardarClase('CLASE1')
    await enviarPuntuacion('verb_pop', 1000)
    assert.equal(envios()[0].args.p_class_code, 'CLASE1')
  })

  test('sin clase el envío lleva el código vacío', async () => {
    await enviarPuntuacion('verb_pop', 1000)
    assert.equal(envios()[0].args.p_class_code, '')
  })

  test('el reenvío lleva la clase guardada ahora y la mejor puntuación', async () => {
    poner('enviado:verb_pop', registro())
    guardarClase('CLASE1')
    assert.deepEqual(await avisarCambioPerfil(), { reenviados: ['verb_pop'], pendientes: [] })
    assert.equal(envios()[0].args.p_class_code, 'CLASE1')
    assert.equal(envios()[0].args.p_score, 3200)
    assert.equal(sacar('enviado:verb_pop').clase, 'CLASE1')
  })

  test('Remove: el reenvío lleva el código vacío', async () => {
    guardarClase('CLASE1')
    poner('enviado:verb_pop', registro({ clase: 'CLASE1' }))
    guardarClase('')
    await avisarCambioPerfil()
    assert.equal(envios()[0].args.p_class_code, '')
  })

  test('cambiar solo la clase marca pendiente igual que cambiar el apodo', async () => {
    poner('enviado:verb_pop', registro())
    poner('perfilReenviado', null)
    // Se gasta el reenvío del día con un cambio de clase...
    guardarClase('CLASE1')
    await avisarCambioPerfil()
    // ...y el siguiente cambio, también solo de clase, queda pendiente sin llamar al servidor.
    llamadas = []
    guardarClase('')
    assert.deepEqual(await avisarCambioPerfil(), { reenviados: [], pendientes: ['verb_pop'] })
    assert.equal(llamadas.length, 0)
    assert.equal(sacar('perfilPendiente:verb_pop'), true)

    // La próxima partida envía aunque no mejore, con la clase de ahora, y no baja la mejor.
    assert.deepEqual(await enviarPuntuacion('verb_pop', 500), { ok: true, enviada: false })
    assert.equal(envios().length, 1)
    assert.equal(envios()[0].args.p_class_code, '')
    assert.equal(sacar('enviado:verb_pop').puntos, 3200)
    assert.equal(sacar('perfilPendiente:verb_pop'), false)
  })

  test('el contador del día se comparte: apodo primero, clase después', async () => {
    poner('enviado:verb_pop', registro())
    poner('apodo', 'BraveFox12')
    elegirApodo('Magic', 'Owl')
    assert.deepEqual(await avisarCambioPerfil(), { reenviados: ['verb_pop'], pendientes: [] })
    llamadas = []
    guardarClase('CLASE1')
    assert.deepEqual(await avisarCambioPerfil(), { reenviados: [], pendientes: ['verb_pop'] })
    assert.equal(llamadas.length, 0)
  })

  test('el contador del día se comparte: clase primero, apodo después', async () => {
    poner('enviado:verb_pop', registro())
    guardarClase('CLASE1')
    assert.deepEqual(await avisarCambioPerfil(), { reenviados: ['verb_pop'], pendientes: [] })
    llamadas = []
    elegirApodo('Magic', 'Owl')
    assert.deepEqual(await avisarCambioPerfil(), { reenviados: [], pendientes: ['verb_pop'] })
    assert.equal(llamadas.length, 0)
  })

  test('sin nada enviado esta semana, cambiar de clase no manda nada', async () => {
    poner('enviado:verb_pop', registro({ semana: '2020-W01' }))
    guardarClase('CLASE1')
    assert.deepEqual(await avisarCambioPerfil(), { reenviados: [], pendientes: [] })
    assert.equal(llamadas.length, 0)
  })

  test('clase distinta de la del último envío cuenta como pendiente aunque falte la marca', async () => {
    poner('enviado:verb_pop', registro({ clase: 'CLASE1' }))
    await enviarPuntuacion('verb_pop', 500)
    assert.equal(envios().length, 1)
    assert.equal(envios()[0].args.p_class_code, '')
    assert.equal(sacar('enviado:verb_pop').puntos, 3200)
  })
})

describe('fila propia con perfil pendiente', () => {
  const semana = () => semanaISO()
  const filas = [
    { pos: 1, nick: 'TigerKing99', score: 5000 },
    { pos: 2, nick: 'BraveFox12', score: 3200 },
    { pos: 3, nick: 'BraveFox12', score: 1000 },
  ]
  const nicks = (estado) => estado.filas.map((f) => f.nick)

  test('se pinta con el apodo nuevo la fila que coincide en apodo y puntos', async () => {
    poner('enviado:verb_pop', { semana: semana(), puntos: 3200, clase: null, nick: 'BraveFox12' })
    poner('perfilPendiente:verb_pop', true)
    poner('apodo', 'MagicOwl12')
    responder = () => new Response(JSON.stringify(filas), { status: 200 })
    const estado = await cargarVista('verb_pop', VISTA.TODOS, null)
    assert.deepEqual(nicks(estado), ['TigerKing99', 'MagicOwl12', 'BraveFox12'])
    const html = renderToStaticMarkup(createElement(CuerpoRanking, { estado, miApodo: 'MagicOwl12', alReintentar: () => {} }))
    assert.equal(html.match(/fila-ranking--mia/g).length, 1)
    assert.match(html, /fila-ranking--mia[^>]*>.*?MagicOwl12/)
  })

  test('sin pendiente la lista sale tal cual la da el servidor', async () => {
    poner('enviado:verb_pop', { semana: semana(), puntos: 3200, clase: null, nick: 'BraveFox12' })
    poner('apodo', 'MagicOwl12')
    responder = () => new Response(JSON.stringify(filas), { status: 200 })
    const estado = await cargarVista('verb_pop', VISTA.TODOS, null)
    assert.deepEqual(nicks(estado), ['TigerKing99', 'BraveFox12', 'BraveFox12'])
  })

  test('aEstado sin datos de pendiente no toca nada', () => {
    const estado = aEstado({ ok: true, filas: [{ posicion: 1, nick: 'BraveFox12', puntos: 3200 }] })
    assert.deepEqual(nicks(estado), ['BraveFox12'])
  })
})
