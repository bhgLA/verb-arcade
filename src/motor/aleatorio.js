// Generador pseudoaleatorio con semilla: la misma semilla da siempre la misma serie.

// FNV-1a de 32 bits: convierte la semilla de texto en un entero.
export function hashCadena(texto) {
  let h = 0x811c9dc5
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function mulberry32(semilla) {
  let a = semilla >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Devuelve una función que da números en [0, 1).
export function crearAleatorio(semilla) {
  const numero = typeof semilla === 'number' ? semilla : hashCadena(String(semilla))
  return mulberry32(numero)
}

export function entero(rng, n) {
  return Math.floor(rng() * n)
}

export function elegir(lista, rng) {
  if (!lista.length) throw new Error('elegir: la lista está vacía.')
  return lista[entero(rng, lista.length)]
}

// Fisher-Yates sobre una copia; no modifica la lista original.
export function barajar(lista, rng) {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = entero(rng, i + 1)
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}
