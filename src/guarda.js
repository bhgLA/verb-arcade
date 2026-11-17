// Guarda del primer uso: cualquier juego de Challenge (/reto/<juego>) pide antes
// el apodo si el niño todavía no lo ha elegido. No se aplica en /reto (el menú de
// juegos) ni en /estudio. Sin JSX para poder probarlo en node.
const RUTA_JUEGO = /^\/reto\/[^/]+$/

export function pideApodo(ruta, elegido) {
  const limpia = (ruta ?? '').replace(/\/+$/, '') || '/'
  return !elegido && RUTA_JUEGO.test(limpia)
}
