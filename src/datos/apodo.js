// Apodo de piezas cerradas: adjetivo + animal + número de dos cifras.
// Sin texto libre, para que nadie ponga su nombre real ni palabras feas.
// Tiene que pasar el check de submit_score: ^[A-Za-z0-9 _-]{3,20}$
import listas from '../contenido/apodos.json' with { type: 'json' }
import { leer, guardar } from './almacen.js'

export const ADJETIVOS = Object.freeze([...listas.adjetivos])
export const ANIMALES = Object.freeze([...listas.animales])

export const FORMATO_APODO = /^[A-Za-z0-9 _-]{3,20}$/

const CLAVE = 'apodo'

const numeroAlAzar = (azar) => 10 + Math.floor(azar() * 90)

// azar: función que devuelve [0, 1). Se puede pasar una con semilla en los tests.
export function generarApodo(azar = Math.random) {
  const de = (lista) => lista[Math.floor(azar() * lista.length)]
  return `${de(ADJETIVOS)}${de(ANIMALES)}${numeroAlAzar(azar)}`
}

// Separa un apodo en { adjetivo, animal, numero }. Si una pieza no está en las
// listas actuales (apodos de antes del recorte), esa pieza pasa a la primera de su lista.
// El número se conserva siempre que sean dos cifras; si no, uno nuevo.
export function piezasDelApodo(apodo, azar = Math.random) {
  const texto = typeof apodo === 'string' ? apodo : ''
  const cifras = /(?<!\d)\d{2}$/.exec(texto)?.[0]
  const numero = cifras ?? String(numeroAlAzar(azar))
  const letras = cifras ? texto.slice(0, -2) : texto
  const adjetivo = ADJETIVOS.find((a) => letras.startsWith(a))
  const resto = adjetivo ? letras.slice(adjetivo.length) : letras
  const animal = ANIMALES.find((a) => resto.endsWith(a))
  return { adjetivo: adjetivo ?? ADJETIVOS[0], animal: animal ?? ANIMALES[0], numero }
}

export function componerApodo({ adjetivo, animal, numero }) {
  return `${adjetivo}${animal}${numero}`
}

// El apodo guardado; si no hay o no vale, se crea uno nuevo.
export function leerApodo() {
  const guardado = leer(CLAVE)
  if (typeof guardado === 'string' && FORMATO_APODO.test(guardado)) return guardado
  return cambiarApodo()
}

// Otro apodo al azar (si el servidor rechaza el actual).
export function cambiarApodo() {
  const nuevo = generarApodo()
  guardar(CLAVE, nuevo)
  return nuevo
}

// El niño elige adjetivo y animal; el número sigue siendo el suyo.
// Devuelve el apodo nuevo, o null si alguna pieza no es de las listas.
export function elegirApodo(adjetivo, animal) {
  if (!ADJETIVOS.includes(adjetivo) || !ANIMALES.includes(animal)) return null
  const { numero } = piezasDelApodo(leerApodo())
  const nuevo = componerApodo({ adjetivo, animal, numero })
  if (!FORMATO_APODO.test(nuevo)) return null
  guardar(CLAVE, nuevo)
  return nuevo
}
