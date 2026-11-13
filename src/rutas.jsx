// Router mínimo sobre la History API. Cinco rutas fijas, sin dependencias.
import { useEffect, useState } from 'react'

const EVENTO = 'va:navegar'

export function navegar(ruta) {
  if (ruta === window.location.pathname) return
  window.history.pushState(null, '', ruta)
  window.dispatchEvent(new Event(EVENTO))
}

export function useRuta() {
  const [ruta, setRuta] = useState(window.location.pathname)
  useEffect(() => {
    const actualizar = () => setRuta(window.location.pathname)
    window.addEventListener('popstate', actualizar)
    window.addEventListener(EVENTO, actualizar)
    return () => {
      window.removeEventListener('popstate', actualizar)
      window.removeEventListener(EVENTO, actualizar)
    }
  }, [])
  return ruta
}

export function Enlace({ a, children, ...resto }) {
  const alPulsar = (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navegar(a)
  }
  return (
    <a href={a} onClick={alPulsar} {...resto}>
      {children}
    </a>
  )
}
