// Pantalla de ranking y código de clase, con fetch simulado: nunca llama al servidor real.
import { test, describe, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { configurarSupabase } from '../src/datos/supabase.js'
import { validarYGuardarClase, leerClase } from '../src/datos/clase.js'
import { CuerpoRanking } from '../src/componentes/ranking/CuerpoRanking.js'
import { aEstado, cargarVista, filasVisibles, CARGANDO, VISTA, TOP } from '../src/componentes/ranking/estado.js'
import { textos } from '../src/textos.js'

const r = textos.ranking
const pintar = (estado, miApodo = 'BraveFox12') =>
  renderToStaticMarkup(createElement(CuerpoRanking, { estado, miApodo, alReintentar: () => {} }))

// --- fetch y localStorage simulados ---------------------------------------------

let llamadas = []
let responder = () => new Response('null', { status: 200 })
const fetchOriginal = globalThis.fetch

function almacenFalso() {
  const m = new Map()
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  }
}

beforeEach(() => {
  configurarSupabase({ url: 'https://prueba.invalid', clave: 'sb_publishable_prueba' })
  llamadas = []
  globalThis.window = { localStorage: almacenFalso() }
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

const json = (datos, status = 200) => () => new Response(JSON.stringify(datos), { status })
const filasServidor = (n) =>
  Array.from({ length: n }, (_, i) => ({ pos: i + 1, nick: `Nick${i + 1}`, score: 5000 - i * 100 }))

// --- Estados --------------------------------------------------------------------

describe('estados de la pantalla', () => {
  test('cargando: una línea', () => {
    const html = pintar(CARGANDO)
    assert.match(html, new RegExp(r.cargando))
    assert.doesNotMatch(html, /<li/)
  })

  test('vacío: una línea, sin lista', async () => {
    responder = json([])
    const estado = await cargarVista('verb_pop', VISTA.TODOS, null)
    assert.deepEqual(estado, { fase: 'vacio' })
    const html = pintar(estado)
    assert.match(html, new RegExp(r.vacio))
    assert.doesNotMatch(html, /<li|<button/)
  })

  test('sin conexión: línea corta y botón Try again', async () => {
    responder = () => {
      throw new TypeError('fetch failed')
    }
    const estado = await cargarVista('verb_pop', VISTA.TODOS, null)
    assert.equal(estado.fase, 'error')
    const html = pintar(estado)
    assert.match(html, new RegExp(r.sinConexion))
    assert.match(html, new RegExp(`<button[^>]*>${r.reintentar}</button>`))
  })

  test('servidor caído (500) o respuesta rara: error, no se rompe', async () => {
    responder = () => new Response('<html>oops</html>', { status: 500 })
    assert.equal((await cargarVista('verb_pop', VISTA.TODOS, null)).fase, 'error')
    responder = json({ no: 'es una lista' })
    assert.deepEqual(await cargarVista('verb_pop', VISTA.TODOS, null), { fase: 'vacio' })
  })

  test('sin Supabase configurado: error, sin llamar a fetch', async () => {
    configurarSupabase()
    assert.equal((await cargarVista('verb_pop', VISTA.TODOS, null)).fase, 'error')
    assert.equal(llamadas.length, 0)
  })

  test('lista: top 20 en dos columnas, la segunda empieza en el 11', async () => {
    responder = json(filasServidor(TOP))
    const estado = await cargarVista('verb_pop', VISTA.TODOS, null)
    assert.equal(estado.fase, 'lista')
    assert.deepEqual(llamadas[0], {
      funcion: 'get_leaderboard',
      args: { p_game: 'verb_pop', p_class_code: null, p_limit: TOP },
    })
    const html = pintar(estado)
    assert.equal(html.match(/<li/g).length, 20)
    assert.equal(html.match(/<ol/g).length, 2)
    assert.match(html, /<ol class="lista-ranking__columna" start="11">/)
    assert.match(html, /5,000/)
  })

  test('menos de 11 filas: una sola columna', () => {
    const html = pintar(aEstado({ ok: true, filas: [{ posicion: 1, nick: 'A1b', puntos: 10 }] }))
    assert.equal(html.match(/<ol/g).length, 1)
  })

  test('resalta la fila del propio jugador por su apodo', () => {
    const estado = aEstado({
      ok: true,
      filas: [
        { posicion: 1, nick: 'HappyOtter33', puntos: 900 },
        { posicion: 2, nick: 'BraveFox12', puntos: 800 },
      ],
    })
    const html = pintar(estado, 'BraveFox12')
    assert.equal(html.match(/fila-ranking--mia/g).length, 1)
    assert.match(html, /<li class="fila-ranking fila-ranking--mia" aria-current="true">.*BraveFox12/)
  })

  test('el juego es un parámetro', async () => {
    responder = json([])
    await cargarVista('mimica', VISTA.TODOS, null)
    assert.equal(llamadas[0].args.p_game, 'mimica')
  })
})

// --- Mi clase -------------------------------------------------------------------

describe('vista Mi clase', () => {
  test('sin código guardado no llama al servidor y pide el código', async () => {
    assert.deepEqual(await cargarVista('verb_pop', VISTA.CLASE, null), { fase: 'sinClase' })
    assert.equal(llamadas.length, 0)
  })

  test('con código pide el ranking de esa clase', async () => {
    responder = json(filasServidor(3))
    const estado = await cargarVista('verb_pop', VISTA.CLASE, 'CLASE1')
    assert.equal(estado.fase, 'lista')
    assert.equal(llamadas[0].args.p_class_code, 'CLASE1')
  })
})

// --- Solo posición, apodo y puntos ---------------------------------------------

describe('la lista nunca pinta otros campos', () => {
  const SECRETOS = {
    player_id: '9f648b15-7f23-41ae-ad11-924d65a110f0',
    class_code: 'QWZX',
    created_at: '2026-11-15T10:00:00Z',
  }

  test('aunque el servidor devolviera más columnas', async () => {
    responder = json(filasServidor(12).map((f) => ({ ...f, ...SECRETOS })))
    const estado = await cargarVista('verb_pop', VISTA.TODOS, null)
    for (const f of estado.filas) assert.deepEqual(Object.keys(f).sort(), ['nick', 'posicion', 'puntos'])
    const html = pintar(estado)
    for (const [campo, valor] of Object.entries(SECRETOS)) {
      assert.ok(!html.includes(valor), `se ha colado ${campo}`)
      assert.ok(!html.includes(campo), `se ha colado el nombre ${campo}`)
    }
  })

  test('filasVisibles descarta lo que sobra y lo que no tiene forma de fila', () => {
    const filas = filasVisibles([
      { posicion: 1, nick: 'BraveFox12', puntos: 900, player_id: 'x', class_code: 'y' },
      { posicion: 2, nick: null, puntos: 10 },
      null,
      { posicion: '3', nick: 'Zed12', puntos: 5 },
    ])
    assert.deepEqual(filas, [{ posicion: 1, nick: 'BraveFox12', puntos: 900 }])
  })

  test('cada fila tiene exactamente tres celdas: puesto, apodo y puntos', () => {
    const html = pintar(aEstado({ ok: true, filas: [{ posicion: 1, nick: 'BraveFox12', puntos: 900 }] }))
    const fila = /<li[^>]*>(.*?)<\/li>/.exec(html)[1]
    assert.deepEqual(
      [...fila.matchAll(/<span class="([^"]+)">([^<]*)<\/span>/g)].map((m) => [m[1].trim(), m[2]]),
      [
        ['fila-ranking__puesto fila-ranking__puesto--podio', '1'],
        ['fila-ranking__nick', 'BraveFox12'],
        ['fila-ranking__puntos', '900'],
      ],
    )
  })
})

// --- Código de clase ------------------------------------------------------------

describe('validar el código de clase con class_exists', () => {
  test('existe: se guarda normalizado', async () => {
    responder = json(true)
    assert.deepEqual(await validarYGuardarClase(' clase1 '), { ok: true, clase: 'CLASE1' })
    assert.deepEqual(llamadas, [{ funcion: 'class_exists', args: { p_code: 'CLASE1' } }])
    assert.equal(leerClase(), 'CLASE1')
  })

  test('no existe: "Ese código no existe" y no se guarda', async () => {
    responder = json(false)
    assert.deepEqual(await validarYGuardarClase('ZZZZ'), { ok: false, motivo: 'claseDesconocida' })
    assert.equal(leerClase(), null)
    assert.ok(r.codigoNoExiste)
  })

  test('formato inválido: ni siquiera llama al servidor', async () => {
    for (const malo of ['A', 'AB-12', 'DEMASIADOLARGO', '']) {
      assert.deepEqual(await validarYGuardarClase(malo), { ok: false, motivo: 'codigoClase' })
    }
    assert.equal(llamadas.length, 0)
  })

  test('sin conexión: no se guarda y el motivo es sinConexion', async () => {
    responder = () => {
      throw new TypeError('fetch failed')
    }
    assert.deepEqual(await validarYGuardarClase('CLASE1'), { ok: false, motivo: 'sinConexion' })
    assert.equal(leerClase(), null)
  })

  test('sin localStorage (modo privado) no se rompe', async () => {
    globalThis.window = {
      get localStorage() {
        throw new Error('SecurityError')
      },
    }
    responder = json(true)
    assert.deepEqual(await validarYGuardarClase('CLASE1'), { ok: true, clase: 'CLASE1' })
    assert.equal(leerClase(), null)
  })
})
