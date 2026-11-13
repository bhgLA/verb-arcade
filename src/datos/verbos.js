// Acceso de solo lectura a la lista de verbos.
import contenido from '../contenido/verbos.json'

export const verbos = Object.freeze(contenido.verbs.map((v) => Object.freeze({ ...v })))

const porVerbo = new Map(verbos.map((v) => [v.verb, v]))

export function buscarVerbo(verb) {
  return porVerbo.get(verb) ?? null
}

export function verbosDelMundo(mundo) {
  return verbos.filter((v) => v.world === mundo)
}

// Mímica solo usa verbos que se pueden representar.
export function verbosMimica(lista = verbos) {
  return lista.filter((v) => v.mimica === true)
}
