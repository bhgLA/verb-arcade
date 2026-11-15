// Apodo generado por el juego: adjetivo + animal + número, de listas cerradas.
// Sin texto libre, para que nadie ponga su nombre real ni palabras feas.
// Tiene que pasar el check de submit_score: ^[A-Za-z0-9 _-]{3,20}$
import { leer, guardar } from './almacen.js'

export const ADJETIVOS = [
  'Brave', 'Happy', 'Swift', 'Clever', 'Sunny', 'Lucky', 'Mighty', 'Jolly',
  'Bright', 'Calm', 'Cosmic', 'Fuzzy', 'Gentle', 'Magic', 'Noble', 'Quick',
  'Silver', 'Golden', 'Super', 'Turbo', 'Witty', 'Zippy', 'Bold', 'Cool',
]

export const ANIMALES = [
  'Fox', 'Otter', 'Panda', 'Tiger', 'Koala', 'Eagle', 'Dolphin', 'Owl',
  'Rabbit', 'Turtle', 'Penguin', 'Lynx', 'Falcon', 'Gecko', 'Lemur', 'Moose',
  'Puffin', 'Seal', 'Squid', 'Whale', 'Zebra', 'Bison', 'Crab', 'Hippo',
]

export const FORMATO_APODO = /^[A-Za-z0-9 _-]{3,20}$/

const CLAVE = 'apodo'

// azar: función que devuelve [0, 1). Se puede pasar una con semilla en los tests.
export function generarApodo(azar = Math.random) {
  const de = (lista) => lista[Math.floor(azar() * lista.length)]
  const numero = 10 + Math.floor(azar() * 90)
  return `${de(ADJETIVOS)}${de(ANIMALES)}${numero}`
}

// El apodo guardado; si no hay o no vale, se crea uno nuevo.
export function leerApodo() {
  const guardado = leer(CLAVE)
  if (typeof guardado === 'string' && FORMATO_APODO.test(guardado)) return guardado
  return cambiarApodo()
}

// Otro apodo al azar (botón "otro nombre", o si el servidor rechaza el actual).
export function cambiarApodo() {
  const nuevo = generarApodo()
  guardar(CLAVE, nuevo)
  return nuevo
}
