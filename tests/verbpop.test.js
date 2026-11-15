import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { VERB_POP } from '../src/motor/config.js'
import {
  multiplicador,
  bonusRapidez,
  puntosAcierto,
  tiempoDeCaida,
  maximoTeorico,
  limiteServidor,
} from '../src/motor/puntuacion.js'
import { crearPartida, partidaReducer, retoActivo, alturaBloques, preguntaActual, FASE } from '../src/motor/partida.js'
import { secuenciaSemanal } from '../src/motor/secuencia.js'
import { crearAleatorio } from '../src/motor/aleatorio.js'

const { verbs: VERBOS } = JSON.parse(readFileSync(new URL('../src/contenido/verbos.json', import.meta.url), 'utf8'))
const SEMANA = '2026-W46'
const PREGUNTAS = secuenciaSemanal(VERBOS, 'verb_pop', SEMANA)
const { bloqueoMs: BLOQUEO, pausaMs: PAUSA, duracionMs: DURACION } = VERB_POP

const nueva = (opciones = {}) => crearPartida({ modo: 'competicion', preguntas: PREGUNTAS, mundo: 1, ...opciones })
const tick = (s, t) => partidaReducer(s, { type: 'tick', t })
const responder = (s, t, opcion) => partidaReducer(s, { type: 'responder', t, opcion })
const correcta = (s) => s.reto.pregunta.correcta
const incorrecta = (s) => s.reto.pregunta.opciones.find((o) => o !== s.reto.pregunta.correcta)

// Juega hasta el final con una estrategia: (s, rng) => { espera, acierta }.
// Graba las acciones para poder repetirlas.
function jugar(s, estrategia, rng, acciones = []) {
  for (let i = 0; i < 10_000 && s.fase === FASE.JUGANDO; i++) {
    let accion
    if (retoActivo(s)) {
      const { espera, acierta } = estrategia(s, rng)
      const t = s.reto.aparecio + espera
      accion = { type: 'responder', t, opcion: acierta ? correcta(s) : incorrecta(s) }
      if (espera >= s.caidaMs) accion = { type: 'tick', t }
    } else {
      accion = { type: 'tick', t: s.siguienteEn ?? s.t + 1000 }
    }
    acciones.push(accion)
    s = partidaReducer(s, accion)
  }
  return s
}

const perfecta = () => ({ espera: BLOQUEO, acierta: true })

describe('puntuación', () => {
  test('el combo sube cada 3 aciertos seguidos hasta x4', () => {
    const esperado = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 4]
    assert.deepEqual(esperado.map((_, racha) => multiplicador(racha)), esperado)
  })

  test('bonus por rapidez de 0 a 50 según lo que quedaba de caída', () => {
    assert.equal(bonusRapidez(BLOQUEO, 6000), 50)
    assert.equal(bonusRapidez(0, 6000), 50) // nunca más de 50
    assert.equal(bonusRapidez(3600, 6000), 25)
    assert.equal(bonusRapidez(6000, 6000), 0)
    assert.equal(bonusRapidez(9000, 6000), 0)
  })

  test('acierto = 100 x combo + bonus', () => {
    assert.equal(puntosAcierto(0, BLOQUEO, 6000), 150)
    assert.equal(puntosAcierto(3, 3600, 6000), 225)
    assert.equal(puntosAcierto(12, 6000, 6000), 400)
  })

  test('la caída es fija en el mundo 1 y se acelera un poco con cada mundo', () => {
    assert.equal(tiempoDeCaida(1), VERB_POP.caidaBaseMs)
    for (let m = 2; m <= 10; m++) assert.ok(tiempoDeCaida(m) < tiempoDeCaida(m - 1))
    assert.ok(tiempoDeCaida(10) > 2 * BLOQUEO, 'en el mundo 10 tiene que dar tiempo a leer')
  })

  test('máximo teórico de 75 s y límite del servidor con un 10 % de margen', () => {
    assert.equal(maximoTeorico(), 14850)
    assert.equal(limiteServidor(), 16335)
  })

  test('schema.sql usa el mismo límite para verb_pop', () => {
    const sql = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8')
    const m = /\('verb_pop',\s*(\d+)\s*[,)]/.exec(sql)
    assert.ok(m, 'no encuentro verb_pop en game_limits')
    assert.equal(Number(m[1]), limiteServidor())
  })
})

describe('anti-spam', () => {
  test('un bloque nuevo no se puede responder hasta 1,2 s después de aparecer', () => {
    const s0 = nueva()
    const s1 = responder(s0, BLOQUEO - 1, correcta(s0))
    assert.equal(s1.reto.respuesta, null)
    assert.equal(s1.puntos, 0)
    const s2 = responder(s1, BLOQUEO, correcta(s1))
    assert.equal(s2.reto.acierto, true)
    assert.equal(s2.puntos, 150)
  })

  test('hay 0,8 s entre un reto y el siguiente, y no se responde dos veces', () => {
    let s = responder(nueva(), BLOQUEO, correcta(nueva()))
    assert.equal(s.siguienteEn, BLOQUEO + PAUSA)
    const otra = responder(s, BLOQUEO + 300, correcta(s))
    assert.equal(otra.puntos, s.puntos)
    s = tick(s, BLOQUEO + PAUSA - 1)
    assert.equal(s.indice, 0)
    s = tick(s, BLOQUEO + PAUSA)
    assert.equal(s.indice, 1)
    assert.equal(s.reto.aparecio, BLOQUEO + PAUSA)
    assert.equal(responder(s, s.reto.aparecio + BLOQUEO - 1, correcta(s)).reto.respuesta, null)
  })

  test('una opción que no está en el reto se ignora', () => {
    const s = responder(nueva(), BLOQUEO, 'no existe')
    assert.equal(s.reto.respuesta, null)
  })
})

describe('combo y vidas', () => {
  test('tres aciertos suben a x2; un fallo devuelve a x1 y quita una vida', () => {
    let s = nueva()
    for (let i = 0; i < 3; i++) {
      s = responder(s, s.reto.aparecio + BLOQUEO, correcta(s))
      s = tick(s, s.siguienteEn)
    }
    assert.equal(s.combo, 2)
    assert.equal(s.puntos, 3 * 150)
    s = responder(s, s.reto.aparecio + BLOQUEO, correcta(s))
    assert.equal(s.reto.puntos, 250)
    s = tick(s, s.siguienteEn)
    s = responder(s, s.reto.aparecio + BLOQUEO, incorrecta(s))
    assert.equal(s.combo, 1)
    assert.equal(s.racha, 0)
    assert.equal(s.vidas, 2)
    assert.equal(s.mejorRacha, 4)
    assert.equal(s.mejorCombo, 2)
  })

  test('un bloque que llega al suelo es un fallo y quita una vida', () => {
    const caida = nueva().caidaMs
    let s = tick(nueva(), caida - 1)
    assert.equal(s.vidas, 3)
    s = tick(s, caida)
    assert.equal(s.vidas, 2)
    assert.equal(s.fallos, 1)
    assert.equal(s.reto.suelo, true)
    assert.equal(s.siguienteEn, caida + PAUSA)
    assert.equal(responder(s, caida + 10, correcta(s)).reto.respuesta, null)
  })

  test('fin por vidas con tres fallos; después todo se ignora', () => {
    let s = nueva()
    for (let i = 0; i < 3; i++) {
      s = responder(s, s.reto.aparecio + BLOQUEO, incorrecta(s))
      if (s.fase === FASE.JUGANDO) s = tick(s, s.siguienteEn)
    }
    assert.equal(s.fase, FASE.FIN_VIDAS)
    assert.equal(s.vidas, 0)
    assert.deepEqual(tick(s, 70_000), s)
    assert.deepEqual(responder(s, 70_000, 'x'), s)
  })

  test('fin por vidas con tres bloques en el suelo, de un solo tick o fotograma a fotograma', () => {
    const deGolpe = tick(nueva(), 60_000)
    let poco = nueva()
    for (let t = 0; t <= 60_000; t += 16) poco = tick(poco, t)
    assert.equal(deGolpe.fase, FASE.FIN_VIDAS)
    const caida = nueva().caidaMs
    assert.equal(deGolpe.t, 3 * caida + 2 * PAUSA)
    assert.deepEqual(poco, deGolpe)
  })

  test('fin por tiempo: a los 75 s se acaba y ya no se puede responder', () => {
    const corta = nueva({ config: { ...VERB_POP, duracionMs: 5000 } })
    let s = tick(corta, 4999)
    assert.equal(s.fase, FASE.JUGANDO)
    s = responder(s, 5000, correcta(s))
    assert.equal(s.fase, FASE.FIN_TIEMPO)
    assert.equal(s.puntos, 0)
    assert.equal(s.vidas, 3)
  })

  test('si el bloque toca el suelo justo al acabar el tiempo, no se pierde vida', () => {
    const s = tick(nueva({ config: { ...VERB_POP, duracionMs: VERB_POP.caidaBaseMs } }), 99_999)
    assert.equal(s.fase, FASE.FIN_TIEMPO)
    assert.equal(s.vidas, 3)
  })
})

describe('partidas completas', () => {
  test('respuestas perfectas y rápidas dan exactamente el máximo teórico, en todos los mundos', () => {
    for (let mundo = 1; mundo <= 10; mundo++) {
      const s = jugar(nueva({ mundo }), perfecta, null)
      assert.equal(s.fase, FASE.FIN_TIEMPO)
      assert.equal(s.vidas, 3)
      assert.equal(s.aciertos, 37)
      assert.equal(s.puntos, maximoTeorico(), `mundo ${mundo}`)
    }
  })

  test('ninguna partida supera el máximo teórico', () => {
    const rng = crearAleatorio('partidas')
    for (let i = 0; i < 300; i++) {
      const fallar = rng() * 0.3
      const estrategia = (s, r) => {
        const transcurrido = s.t - s.reto.aparecio
        // A veces intenta responder antes de tiempo (anti-spam), a veces deja caer el bloque.
        return { espera: transcurrido + 1 + Math.floor(r() * (s.caidaMs + 400)), acierta: r() >= fallar }
      }
      const s = jugar(nueva({ mundo: 1 + (i % 10) }), estrategia, rng)
      assert.notEqual(s.fase, FASE.JUGANDO)
      assert.ok(s.puntos <= maximoTeorico(), `partida ${i}: ${s.puntos}`)
    }
  })

  test('determinismo: las mismas acciones dan la misma partida, con o sin ticks intermedios', () => {
    const acciones = []
    const rng = crearAleatorio('det')
    const estrategia = (s, r) => ({ espera: BLOQUEO + Math.floor(r() * 3000), acierta: r() > 0.15 })
    const original = jugar(nueva({ mundo: 4 }), estrategia, rng, acciones)

    const repetir = (conTicks) => {
      let s = nueva({ mundo: 4 })
      let anterior = 0
      for (const a of acciones) {
        if (conTicks) for (let t = anterior; t < a.t; t += 50) s = tick(s, t)
        s = partidaReducer(s, a)
        anterior = a.t
      }
      return s
    }
    assert.deepEqual(repetir(false), original)
    assert.deepEqual(repetir(true), original)
  })
})

describe('modo estudio', () => {
  const [p1, p2] = PREGUNTAS
  const estudio = () => crearPartida({ modo: 'estudio', preguntas: [p1], mundo: 3 })

  test('sin tiempo, sin vidas y sin suelo: los bloques se quedan en la línea segura', () => {
    const s = tick(estudio(), 500_000)
    assert.equal(s.fase, FASE.JUGANDO)
    assert.equal(s.vidas, VERB_POP.vidas)
    assert.ok(retoActivo(s))
    assert.equal(alturaBloques(s), VERB_POP.lineaSeguraEstudio)
  })

  test('responde con el mismo anti-spam, no suma puntos y espera a "siguiente"', () => {
    let s = responder(estudio(), BLOQUEO - 1, p1.correcta)
    assert.equal(s.reto.respuesta, null)
    s = responder(s, BLOQUEO, incorrecta(s))
    assert.equal(s.reto.acierto, false)
    assert.equal(s.vidas, VERB_POP.vidas)
    assert.equal(s.puntos, 0)
    s = tick(s, 100_000)
    assert.equal(s.reto.pregunta, p1)
    s = partidaReducer(s, { type: 'siguiente', t: 100_000, pregunta: p2 })
    assert.equal(s.reto.pregunta, p2)
    assert.equal(s.reto.aparecio, 100_000)
    const otra = partidaReducer(s, { type: 'siguiente', t: 100_001, pregunta: p1 })
    assert.equal(otra.reto.pregunta, p2, 'no se salta un reto sin responder')
  })

  test('la ronda termina al responder la 10.ª pregunta y no genera más', () => {
    const total = VERB_POP.preguntasEstudio
    assert.equal(total, 10)
    let s = estudio()
    for (let i = 0; i < total; i++) {
      assert.equal(s.fase, FASE.JUGANDO, `sigue jugando antes de la respuesta ${i + 1}`)
      if (i > 0) s = partidaReducer(s, { type: 'siguiente', t: s.t + 500, pregunta: PREGUNTAS[i] })
      assert.equal(preguntaActual(s), i + 1)
      const t = s.reto.aparecio + BLOQUEO
      s = responder(s, t, i % 3 === 0 ? incorrecta(s) : correcta(s)) // acierto y fallo cuentan igual
      assert.notEqual(s.reto.respuesta, null)
    }
    assert.equal(s.fase, FASE.TERMINADA)
    assert.equal(s.aciertos + s.fallos, total)
    assert.equal(s.aciertos, 6)
    assert.equal(preguntaActual(s), total)
    assert.notEqual(s.reto.respuesta, null, 'la última respuesta sigue visible para el feedback')

    const final = s
    for (const accion of [
      { type: 'siguiente', t: s.t + 1000, pregunta: PREGUNTAS[total] },
      { type: 'responder', t: s.t + 5000, opcion: s.reto.pregunta.correcta },
      { type: 'tick', t: s.t + 100_000 },
    ]) {
      s = partidaReducer(s, accion)
      assert.equal(s, final, `"${accion.type}" no cambia una ronda terminada`)
    }
  })

  test('el límite de preguntas no afecta a competición', () => {
    let s = nueva()
    for (let i = 0; i < VERB_POP.preguntasEstudio + 5; i++) {
      s = responder(s, s.reto.aparecio + BLOQUEO, correcta(s))
      s = tick(s, s.siguienteEn)
    }
    assert.equal(s.fase, FASE.JUGANDO)
    assert.equal(s.aciertos, VERB_POP.preguntasEstudio + 5)
  })
})
