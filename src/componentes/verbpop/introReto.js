// Intro de Challenge: la línea "Your best this week: N" con la mejor de la semana
// de este navegador (la misma que la pantalla final). Con 0, o si lo guardado es
// de otra semana, no hay línea. Sin JSX para probarlo en node.
import { textos } from '../../textos.js'
import { leerMejorSemana } from '../../datos/record.js'

export function lineaMejorSemana(juego, semana) {
  const n = leerMejorSemana(juego, semana)
  return n > 0 ? textos.verbPop.mejorSemanaN(textos.numero(n)) : null
}
