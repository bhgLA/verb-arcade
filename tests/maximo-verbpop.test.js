// Máximo de una partida de Verb Pop, derivado a mano y comprobado con el
// reducer real. Protege game_limits.max_score de verb_pop (16335 = 14850 + 10 %):
// si una partida legal pudiera pasar de 14850, submit_score la rechazaría.
//
// Desglose (config.js, VERB_POP):
//   - Un reto no se puede responder hasta 1200 ms después de aparecer (bloqueo)
//     y el siguiente aparece 800 ms después de la respuesta (pausa).
//     Ciclo mínimo: 2000 ms. Respuestas posibles en t = 1200 + 2000·k.
//   - La partida acaba en t = 75000 y en ese instante ya no se responde.
//     k = 0..36 -> 37 aciertos (el 36.º en 73200; el siguiente sería en 75200).
//   - Por acierto: 100 × combo + bonus. El combo usa la racha previa:
//     rachas 0-2 x1, 3-5 x2, 6-8 x3, 9-36 x4.
//       3·100 + 3·200 + 3·300 + 28·400 = 300 + 600 + 900 + 11200 = 13000
//   - Bonus por rapidez: 50 como máximo, solo si se responde nada más acabar el
//     bloqueo. 37 × 50 = 1850.
//   - Total: 13000 + 1850 = 14850. No hay otros puntos (ni vidas ni tiempo).
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { VERB_POP } from '../src/motor/config.js'
import { multiplicador } from '../src/motor/puntuacion.js'
import { crearPartida, partidaReducer, retoActivo, sePuedeResponder, FASE } from '../src/motor/partida.js'
import { secuenciaSemanal } from '../src/motor/secuencia.js'
import { crearAleatorio } from '../src/motor/aleatorio.js'

const MAXIMO = 14850
const ACIERTOS_MAX = 37
const BASE_Y_COMBO = 13000
const BONUS_TOTAL = 1850

const { verbs: VERBOS } = JSON.parse(readFileSync(new URL('../src/contenido/verbos.json', import.meta.url), 'utf8'))
const PREGUNTAS = secuenciaSemanal(VERBOS, 'verb_pop', '2026-W46')
const { bloqueoMs: BLOQUEO, pausaMs: PAUSA, duracionMs: DURACION } = VERB_POP

const nueva = (mundo) => crearPartida({ modo: 'competicion', preguntas: PREGUNTAS, mundo })
const correcta = (s) => s.reto.pregunta.correcta
const incorrecta = (s) => s.reto.pregunta.opciones.find((o) => o !== correcta(s))

// Responde cada reto `espera(i)` ms después de que aparezca (acertando o no) y
// avanza con ticks hasta el final. Devuelve el estado final y los puntos de cada acierto.
function jugar(mundo, espera, acierta = () => true) {
  let s = nueva(mundo)
  const porReto = []
  for (let vueltas = 0; s.fase === FASE.JUGANDO && vueltas < 1000; vueltas++) {
    if (retoActivo(s)) {
      const i = s.aciertos + s.fallos // número de reto, empezando en 0
      const t = s.reto.aparecio + espera(i)
      const antes = s
      s = partidaReducer(s, { type: 'responder', t, opcion: acierta(i) ? correcta(s) : incorrecta(s) })
      if (s.aciertos > antes.aciertos) porReto.push({ racha: antes.racha, puntos: s.reto.puntos })
    } else {
      s = partidaReducer(s, { type: 'tick', t: s.siguienteEn ?? s.t + 1000 })
    }
  }
  return { s, porReto }
}

describe('máximo de Verb Pop (game_limits.max_score)', () => {
  test('las cifras del desglose salen de config.js', () => {
    assert.equal(DURACION, 75_000)
    assert.equal(BLOQUEO + PAUSA, 2000)
    const instantes = []
    for (let t = BLOQUEO; t < DURACION; t += BLOQUEO + PAUSA) instantes.push(t)
    assert.equal(instantes.length, ACIERTOS_MAX)
    assert.equal(instantes.at(-1), 73_200)

    let base = 0
    for (let racha = 0; racha < ACIERTOS_MAX; racha++) base += VERB_POP.puntosBase * multiplicador(racha)
    assert.equal(base, BASE_Y_COMBO)
    assert.equal(ACIERTOS_MAX * VERB_POP.bonusMax, BONUS_TOTAL)
    assert.equal(BASE_Y_COMBO + BONUS_TOTAL, MAXIMO)
  })

  test('la partida perfecta con el motor real da 14850 en los 10 mundos, ni un punto más', () => {
    for (let mundo = 1; mundo <= 10; mundo++) {
      const { s, porReto } = jugar(mundo, () => BLOQUEO)
      assert.equal(s.fase, FASE.FIN_TIEMPO, `mundo ${mundo}`)
      assert.equal(s.aciertos, ACIERTOS_MAX, `mundo ${mundo}`)
      assert.equal(s.mejorCombo, VERB_POP.comboMax)
      const base = porReto.reduce((n, r) => n + VERB_POP.puntosBase * multiplicador(r.racha), 0)
      const bonus = porReto.reduce((n, r) => n + r.puntos - VERB_POP.puntosBase * multiplicador(r.racha), 0)
      assert.equal(base, BASE_Y_COMBO, `mundo ${mundo}`)
      assert.equal(bonus, BONUS_TOTAL, `mundo ${mundo}`)
      assert.equal(s.puntos, MAXIMO, `mundo ${mundo}`)
      assert.ok(s.puntos <= MAXIMO)
    }
  })

  test('el acierto 38 no entra: el reto sale en 74000 y se podría responder en 75200', () => {
    const { s } = jugar(1, () => BLOQUEO)
    assert.equal(s.t, DURACION)
    const tarde = partidaReducer(s, { type: 'responder', t: 75_200, opcion: 'x' })
    assert.equal(tarde.puntos, MAXIMO)
  })

  test('con un bucle de fotogramas (16 ms) tampoco se pasa de 14850', () => {
    for (const paso of [1, 16, 17]) {
      let s = nueva(1)
      for (let t = 0; s.fase === FASE.JUGANDO && t <= DURACION + paso; t += paso) {
        s = partidaReducer(s, { type: 'tick', t })
        if (sePuedeResponder(s)) s = partidaReducer(s, { type: 'responder', t, opcion: correcta(s) })
      }
      assert.ok(s.puntos <= MAXIMO, `paso ${paso}: ${s.puntos}`)
      if (paso === 1) assert.equal(s.puntos, MAXIMO)
    }
  })

  test('spam antes del bloqueo no adelanta nada', () => {
    let s = nueva(1)
    for (let t = 0; s.fase === FASE.JUGANDO && t <= DURACION; t += 50) {
      s = partidaReducer(s, { type: 'tick', t })
      if (retoActivo(s)) s = partidaReducer(s, { type: 'responder', t, opcion: correcta(s) })
    }
    assert.ok(s.puntos <= MAXIMO, String(s.puntos))
  })

  test('responder más tarde o fallar nunca suma más de 14850', () => {
    // El bonus se redondea: unos ms de retraso siguen dando 50 (hasta 48 ms en
    // el mundo 1, 26 en el 10), pero no cabe ningún acierto más.
    for (let mundo = 1; mundo <= 10; mundo++) {
      for (const extra of [1, 10, 26]) {
        const { s } = jugar(mundo, () => BLOQUEO + extra)
        assert.ok(s.puntos <= MAXIMO, `mundo ${mundo}, +${extra} ms: ${s.puntos}`)
        assert.equal(s.aciertos, ACIERTOS_MAX)
      }
    }
    for (const extra of [100, 1000]) {
      const { s } = jugar(1, () => BLOQUEO + extra)
      assert.ok(s.puntos < MAXIMO, `+${extra} ms: ${s.puntos}`)
    }
    for (const falla of [0, 9, 36]) {
      const { s } = jugar(1, () => BLOQUEO, (i) => i !== falla)
      assert.ok(s.puntos < MAXIMO, `fallo en el reto ${falla}: ${s.puntos}`)
    }
    const rng = crearAleatorio('cerca-del-maximo')
    for (let i = 0; i < 300; i++) {
      const mundo = 1 + (i % 10)
      const { s } = jugar(mundo, () => BLOQUEO + Math.floor(rng() * 40), () => rng() > 0.02)
      assert.ok(s.puntos <= MAXIMO, `partida ${i}: ${s.puntos}`)
    }
  })

  test('schema.sql deja 14850 + 10 % para verb_pop', () => {
    const sql = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8')
    const m = /\('verb_pop',\s*(\d+)\s*[,)]/.exec(sql)
    assert.ok(m, 'no encuentro verb_pop en game_limits')
    assert.equal(Number(m[1]), Math.ceil(MAXIMO * 1.1 - 1e-6))
    assert.ok(Number(m[1]) >= MAXIMO)
  })
})
