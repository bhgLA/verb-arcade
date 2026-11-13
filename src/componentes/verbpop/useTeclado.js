// Teclado de Verb Pop: ← → mueven al personaje, Intro atrapa, 1-3 responde directo.
// Con el reto ya respondido, Intro llama a alSeguir (si lo hay).
import { useEffect } from 'react'

export function useTeclado({ opciones, columna, setColumna, alResponder, alSeguir, respondido }) {
  useEffect(() => {
    const enBoton = (e) => e.target instanceof HTMLElement && e.target.closest('button, a')
    const alPulsar = (e) => {
      const n = Number(e.key)
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setColumna((c) => Math.max(0, c - 1))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setColumna((c) => Math.min(opciones - 1, c + 1))
      } else if (n >= 1 && n <= opciones) {
        if (!respondido) alResponder(n - 1)
      } else if (e.key === 'Enter' && !enBoton(e)) {
        if (respondido) alSeguir?.()
        else alResponder(columna)
      }
    }
    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [opciones, columna, setColumna, alResponder, alSeguir, respondido])
}
