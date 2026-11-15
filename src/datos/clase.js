// Código de clase opcional que da la profe. Se guarda en este navegador.
// Las mismas reglas que submit_score: 2-8 letras o números, en mayúsculas.
import { leer, guardar } from './almacen.js'
import { llamarRpc } from './supabase.js'
import { motivoDeError } from './errores.js'

const CLAVE = 'clase'
export const FORMATO_CLASE = /^[A-Z0-9]{2,8}$/

// "  ab12 " -> "AB12"; vacío -> null.
export function normalizarClase(codigo) {
  const limpio = String(codigo ?? '').trim().toUpperCase()
  return limpio === '' ? null : limpio
}

export function leerClase() {
  const c = normalizarClase(leer(CLAVE))
  return c && FORMATO_CLASE.test(c) ? c : null
}

// Guarda el código (o lo borra con vacío). Devuelve { ok: true, clase } o { ok: false, motivo: 'codigoClase' }.
export function guardarClase(codigo) {
  const c = normalizarClase(codigo)
  if (c !== null && !FORMATO_CLASE.test(c)) return { ok: false, motivo: 'codigoClase' }
  guardar(CLAVE, c)
  return { ok: true, clase: c }
}

// Pregunta al servidor si la clase existe, para avisar al teclearla y no al acabar la partida.
// Devuelve { ok: true, existe } o { ok: false, motivo }.
export async function comprobarClase(codigo) {
  const c = normalizarClase(codigo)
  if (c === null || !FORMATO_CLASE.test(c)) return { ok: false, motivo: 'codigoClase' }
  const r = await llamarRpc('class_exists', { p_code: c })
  if (!r.ok) return { ok: false, motivo: motivoDeError(r) }
  return { ok: true, existe: r.datos === true }
}

// Lo que hace el botón de guardar: comprueba con class_exists y solo guarda si existe.
// Devuelve { ok: true, clase } o { ok: false, motivo } ('codigoClase', 'claseDesconocida', 'sinConexion'...).
export async function validarYGuardarClase(codigo) {
  const r = await comprobarClase(codigo)
  if (!r.ok) return r
  if (!r.existe) return { ok: false, motivo: 'claseDesconocida' }
  return guardarClase(codigo)
}
