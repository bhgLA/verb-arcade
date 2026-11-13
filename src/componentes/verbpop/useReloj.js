// Reloj de la partida: despacha 'tick' en cada fotograma mientras `activo`.
// Devuelve ahora(): ms desde que se montó el componente.
import { useCallback, useEffect, useRef } from 'react'

export function useReloj(dispatch, activo) {
  const inicio = useRef(null)
  if (inicio.current === null) inicio.current = performance.now()
  const ahora = useCallback(() => performance.now() - inicio.current, [])
  useEffect(() => {
    if (!activo) return undefined
    let id = requestAnimationFrame(function fotograma() {
      dispatch({ type: 'tick', t: ahora() })
      id = requestAnimationFrame(fotograma)
    })
    return () => cancelAnimationFrame(id)
  }, [activo, dispatch, ahora])
  return ahora
}
