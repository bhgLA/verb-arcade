import { useEffect, useState } from 'react'

// Lienzo fijo de 1366×768 (la base de la referencia) escalado para caber en
// la ventana sin deformarse. Lo que sobra alrededor lleva el color del mundo.
// `fondo` es una capa opcional a sangre: ocupa toda la ventana, va detrás del
// lienzo y puede usar --escala para alinearse con él.
export const ANCHO = 1366
export const ALTO = 768

function escalaActual() {
  if (typeof window === 'undefined') return 1
  return Math.min(window.innerWidth / ANCHO, window.innerHeight / ALTO)
}

export default function Escenario({ mundo, fondo = null, className = '', children }) {
  const [escala, setEscala] = useState(escalaActual)
  useEffect(() => {
    const ajustar = () => setEscala(escalaActual())
    window.addEventListener('resize', ajustar)
    return () => window.removeEventListener('resize', ajustar)
  }, [])
  return (
    <div className={`escenario superficie-mundo ${className}`} data-mundo={mundo} style={{ '--escala': escala }}>
      {fondo}
      <div className="escenario__lienzo superficie-mundo">
        {children}
      </div>
    </div>
  )
}
