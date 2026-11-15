// Llamadas RPC a Supabase con fetch, sin cliente externo.
// La tabla nunca se toca directamente: solo funciones RPC con la clave anon.
let URL_BASE = import.meta.env?.VITE_SUPABASE_URL
let CLAVE_ANON = import.meta.env?.VITE_SUPABASE_ANON_KEY
const ESPERA_MS = 6000

export let supabaseConfigurado = Boolean(URL_BASE && CLAVE_ANON)

// Solo para los tests (con fetch simulado): la app usa las variables de entorno.
export function configurarSupabase({ url = '', clave = '' } = {}) {
  URL_BASE = url
  CLAVE_ANON = clave
  supabaseConfigurado = Boolean(url && clave)
}

// Exportada para scripts/probar-supabase.mjs, que llama con las mismas cabeceras que el juego.
export function cabeceras(clave = CLAVE_ANON) {
  const h = { apikey: clave, 'Content-Type': 'application/json' }
  // Las claves anon antiguas son JWT y van también como Bearer. Las nuevas
  // (sb_publishable_...) no son JWT y el servidor las rechaza en Authorization.
  if (clave.startsWith('eyJ')) h.Authorization = `Bearer ${clave}`
  return h
}

// Convierte la respuesta HTTP en { ok: true, datos } o { ok: false, motivo, mensaje }.
// Una función que devuelve void responde 204 sin cuerpo: eso también es éxito.
// Un "raise exception" llega como 400 con { message: 'daily limit', ... }.
export async function leerRespuesta(r) {
  let cuerpo = null
  try {
    const texto = await r.text()
    cuerpo = texto ? JSON.parse(texto) : null
  } catch {
    cuerpo = null
  }
  if (r.ok) return { ok: true, datos: cuerpo }
  const mensaje = typeof cuerpo?.message === 'string' ? cuerpo.message : ''
  return { ok: false, motivo: `http-${r.status}`, mensaje }
}

// Nunca lanza.
export async function llamarRpc(funcion, argumentos = {}) {
  if (!supabaseConfigurado) return { ok: false, motivo: 'sin-config', mensaje: '' }
  const control = new AbortController()
  const temporizador = setTimeout(() => control.abort(), ESPERA_MS)
  try {
    const r = await fetch(`${URL_BASE}/rest/v1/rpc/${funcion}`, {
      method: 'POST',
      headers: cabeceras(),
      body: JSON.stringify(argumentos),
      signal: control.signal,
    })
    return await leerRespuesta(r)
  } catch {
    return { ok: false, motivo: 'sin-conexion', mensaje: '' }
  } finally {
    clearTimeout(temporizador)
  }
}
