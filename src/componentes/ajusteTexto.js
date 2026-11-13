// Longitud visual de un texto para ajustar su tamaño de letra en CSS (--letras).
// Si tiene varias palabras puede partirse en dos líneas: cuenta la mitad o la
// palabra más larga, lo que sea mayor.
export function letras(texto) {
  const t = String(texto ?? '').trim()
  if (!t.includes(' ')) return Math.max(1, t.length)
  const masLarga = Math.max(...t.split(/\s+/).map((p) => p.length))
  return Math.max(masLarga, Math.ceil(t.length / 2))
}
