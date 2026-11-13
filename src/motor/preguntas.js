// Generador de preguntas. Lógica pura: recibe los verbos y un rng con semilla.
//
// Pregunta: { tipo, verbo, enunciado, opciones[], correcta }
// - verbo: el verbo en inglés (texto).
// - correcta: el texto de la opción correcta (las opciones nunca se repiten).
// - En mímica, enunciado es el emoji.
import { GRUPOS_AMBIGUOS, OPCIONES_POR_TIPO } from './config.js'
import { barajar } from './aleatorio.js'
import { textos } from '../textos.js'

export const TIPOS = ['pasado', 'participio', 'significado', 'mimica']

export function normalizar(texto) {
  return String(texto ?? '').trim().toLowerCase()
}

// --- Grupos ambiguos -------------------------------------------------------

const gruposDe = new Map()
GRUPOS_AMBIGUOS.forEach((grupo, i) => {
  for (const verbo of grupo) {
    if (!gruposDe.has(verbo)) gruposDe.set(verbo, new Set())
    gruposDe.get(verbo).add(i)
  }
})

export function mismoGrupoAmbiguo(a, b) {
  const ga = gruposDe.get(a)
  const gb = gruposDe.get(b)
  if (!ga || !gb) return false
  for (const g of ga) if (gb.has(g)) return true
  return false
}

// --- Formas erróneas plausibles -------------------------------------------

// Lo que diría un niño aplicando la regla de los regulares: "goed", "runned".
export function regularizar(verbo) {
  if (/[^aeiou]y$/.test(verbo)) return verbo.slice(0, -1) + 'ied'
  if (verbo.endsWith('e') && verbo.length > 2) return verbo + 'd'
  if (/^[^aeiou]*[aeiou][bdgklmnprtv]$/.test(verbo)) return verbo + verbo.at(-1) + 'ed'
  return verbo + 'ed'
}

// Errores de ortografía en regulares: "stoped", "cryed".
function varianteOrtografica(forma, verbo) {
  if (/([bdgklmnprtv])\1ed$/.test(forma)) return forma.replace(/(.)\1ed$/, '$1ed')
  if (forma.endsWith('ied') && verbo.endsWith('y')) return verbo + 'ed'
  return null
}

// --- Traducciones que se pisan --------------------------------------------

const PALABRAS_VACIAS = new Set(['de', 'la', 'el', 'los', 'las', 'un', 'una', 'con', 'a', 'se', 'y', 'o', 'en', 'al', 'del'])

function palabrasClave(es) {
  return new Set(
    normalizar(es)
      .replace(/\([^)]*\)/g, ' ')
      .split(/[^a-záéíóúüñ]+/)
      .filter((p) => p.length >= 2 && !PALABRAS_VACIAS.has(p)),
  )
}

// "hacer (fabricar)" y "hacer (tareas)" no pueden ser opciones de la misma pregunta.
function traduccionesSePisan(a, b) {
  const pa = palabrasClave(a)
  for (const p of palabrasClave(b)) if (pa.has(p)) return true
  return false
}

// --- Construcción ----------------------------------------------------------

function añadirSiVale(lista, candidata, correcta) {
  if (typeof candidata !== 'string' || candidata.trim() === '') return false
  const n = normalizar(candidata)
  if (n === normalizar(correcta) || lista.some((x) => normalizar(x) === n)) return false
  lista.push(candidata)
  return true
}

function distractoresDeForma(tipo, verbo, pool, rng, cuantos) {
  const campo = tipo === 'pasado' ? 'past' : 'participle'
  const correcta = verbo[campo]
  const otros = barajar(
    pool.filter((v) => v.verb !== verbo.verb),
    rng,
  ).map((v) => v[campo])

  // Plausibles: la regularizada, la otra forma (solo si es distinta) y la de otro verbo.
  const plausibles = []
  añadirSiVale(plausibles, regularizar(verbo.verb), correcta)
  if (verbo.past !== verbo.participle) {
    añadirSiVale(plausibles, tipo === 'pasado' ? verbo.participle : verbo.past, correcta)
  }
  for (const f of otros) if (añadirSiVale(plausibles, f, correcta)) break

  const elegidos = []
  for (const f of barajar(plausibles, rng).slice(0, cuantos)) añadirSiVale(elegidos, f, correcta)
  // Relleno si no bastan: la forma base, un error ortográfico y formas de otros verbos.
  const relleno = [verbo.verb, varianteOrtografica(correcta, verbo.verb), ...otros]
  for (const f of relleno) {
    if (elegidos.length >= cuantos) break
    añadirSiVale(elegidos, f, correcta)
  }
  return elegidos
}

// Candidatos del mismo category primero, cada bloque barajado.
function porCategoria(verbo, candidatos, rng) {
  const misma = candidatos.filter((v) => v.category === verbo.category)
  const resto = candidatos.filter((v) => v.category !== verbo.category)
  return [...barajar(misma, rng), ...barajar(resto, rng)]
}

function distractoresDeSignificado(verbo, pool, rng, cuantos) {
  const elegidos = []
  const candidatos = pool.filter(
    (v) => v.verb !== verbo.verb && !traduccionesSePisan(v.es, verbo.es) && !mismoGrupoAmbiguo(v.verb, verbo.verb),
  )
  for (const v of porCategoria(verbo, candidatos, rng)) {
    if (elegidos.length >= cuantos) break
    if (elegidos.some((e) => traduccionesSePisan(e, v.es))) continue
    añadirSiVale(elegidos, v.es, verbo.es)
  }
  return elegidos
}

function distractoresDeMimica(verbo, pool, rng, cuantos) {
  const elegidos = []
  const candidatos = pool.filter(
    (v) => v.mimica === true && v.verb !== verbo.verb && !mismoGrupoAmbiguo(v.verb, verbo.verb),
  )
  for (const v of porCategoria(verbo, candidatos, rng)) {
    if (elegidos.length >= cuantos) break
    if (elegidos.some((e) => mismoGrupoAmbiguo(e, v.verb))) continue
    añadirSiVale(elegidos, v.verb, verbo.verb)
  }
  return elegidos
}

export function crearPregunta(tipo, verbo, pool, rng) {
  if (!TIPOS.includes(tipo)) throw new Error(`Tipo de pregunta desconocido: "${tipo}".`)
  const cuantos = OPCIONES_POR_TIPO[tipo] - 1
  let correcta
  let enunciado
  let distractores

  if (tipo === 'pasado' || tipo === 'participio') {
    correcta = tipo === 'pasado' ? verbo.past : verbo.participle
    enunciado = textos.preguntas[tipo](verbo.verb)
    distractores = distractoresDeForma(tipo, verbo, pool, rng, cuantos)
  } else if (tipo === 'significado') {
    correcta = verbo.es
    enunciado = textos.preguntas.significado(verbo.verb)
    distractores = distractoresDeSignificado(verbo, pool, rng, cuantos)
  } else {
    if (verbo.mimica !== true || !verbo.emoji) throw new Error(`"${verbo.verb}" no se puede usar en mímica.`)
    correcta = verbo.verb
    enunciado = verbo.emoji
    distractores = distractoresDeMimica(verbo, pool, rng, cuantos)
  }

  if (distractores.length < cuantos) {
    throw new Error(
      `No hay distractores suficientes para "${verbo.verb}" (${tipo}): ${distractores.length} de ${cuantos}.`,
    )
  }
  return { tipo, verbo: verbo.verb, enunciado, opciones: barajar([correcta, ...distractores], rng), correcta }
}
