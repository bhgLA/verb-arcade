// Mejor puntuación de la semana en este navegador, tal como la enseñan la portada,
// el menú de /reto, la intro y el fin de Challenge. Con 0, o si lo guardado es de
// otra semana, no hay dato. Sin JSX para probarlo en node.
import { textos } from '../textos.js'
import { leerMejorSemana } from '../datos/record.js'

// '2,450', o null si esta semana no hay puntos.
export function numeroMejorSemana(juego, semana) {
  const n = leerMejorSemana(juego, semana)
  return n > 0 ? textos.numero(n) : null
}

// "Your best this week: 2,450", o null.
export function lineaMejorSemana(juego, semana) {
  const n = numeroMejorSemana(juego, semana)
  return n ? textos.verbPop.mejorSemanaN(n) : null
}
