// Llamadas RPC a Supabase con fetch, sin cliente externo.
// La tabla nunca se toca directamente: solo funciones RPC con la clave anon.
const URL_BASE = import.meta.env.VITE_SUPABASE_URL
const CLAVE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY
const ESPERA_MS = 6000

export const supabaseConfigurado = Boolean(URL_BASE && CLAVE_ANON)

// Devuelve { ok: true, datos } o { ok: false, motivo }. Nunca lanza.
export async function llamarRpc(funcion, argumentos = {}) {
  if (!supabaseConfigurado) return { ok: false, motivo: 'sin-config' }
  const control = new AbortController()
  const temporizador = setTimeout(() => control.abort(), ESPERA_MS)
  try {
    const r = await fetch(`${URL_BASE}/rest/v1/rpc/${funcion}`, {
      method: 'POST',
      headers: {
        apikey: CLAVE_ANON,
        Authorization: `Bearer ${CLAVE_ANON}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(argumentos),
      signal: control.signal,
    })
    if (!r.ok) return { ok: false, motivo: `http-${r.status}` }
    return { ok: true, datos: await r.json() }
  } catch {
    return { ok: false, motivo: 'sin-conexion' }
  } finally {
    clearTimeout(temporizador)
  }
}
