// Secuencia semanal de competición: todos los jugadores reciben las mismas
// preguntas en el mismo orden durante toda la semana.
import { TIPOS_POR_JUEGO } from './config.js'
import { crearAleatorio, barajar, elegir } from './aleatorio.js'
import { poolDeLaSemana } from './semana.js'
import { crearPregunta } from './preguntas.js'

export function semillaSemanal(juego, semana) {
  return `${juego}|${semana}`
}

export function secuenciaSemanal(verbos, juego, semana, n = 200) {
  const pool = poolDeLaSemana(verbos, semana, juego)
  const rng = crearAleatorio(semillaSemanal(juego, semana))
  const tipos = TIPOS_POR_JUEGO[juego]

  // Bolsa barajada: salen todos los verbos de la pool antes de repetir
  // y nunca el mismo verbo dos veces seguidas.
  let bolsa = []
  let anterior = null
  const siguienteVerbo = () => {
    if (bolsa.length === 0) {
      bolsa = barajar(pool, rng)
      if (bolsa[0] === anterior && bolsa.length > 1) [bolsa[0], bolsa[1]] = [bolsa[1], bolsa[0]]
    }
    anterior = bolsa.shift()
    return anterior
  }

  const preguntas = []
  for (let i = 0; i < n; i++) {
    const verbo = siguienteVerbo()
    const tipo = tipos.length > 1 ? elegir(tipos, rng) : tipos[0]
    preguntas.push(crearPregunta(tipo, verbo, pool, rng))
  }
  return preguntas
}
