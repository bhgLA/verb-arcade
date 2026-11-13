// Envoltorio de localStorage. Si el navegador lo bloquea (modo privado,
// datos borrados), el juego sigue funcionando sin guardar nada.
const PREFIJO = 'verb-arcade:'

export function leer(clave, porDefecto = null) {
  try {
    const crudo = window.localStorage.getItem(PREFIJO + clave)
    return crudo === null ? porDefecto : JSON.parse(crudo)
  } catch {
    return porDefecto
  }
}

export function guardar(clave, valor) {
  try {
    window.localStorage.setItem(PREFIJO + clave, JSON.stringify(valor))
    return true
  } catch {
    return false
  }
}
