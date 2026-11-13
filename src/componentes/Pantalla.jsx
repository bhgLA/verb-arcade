import { textos } from '../textos.js'
import FondoMundo from './FondoMundo.jsx'
import BotonRedondo from './BotonRedondo.jsx'

// Pantalla con el color de un mundo (data-mundo) o neutra (sin mundo).
export function PantallaMundo({ mundo, olas = false, className = '', children }) {
  return (
    <div
      className={`pantalla pantalla--mundo superficie-mundo ${olas ? 'pantalla--olas' : ''} ${className}`}
      data-mundo={mundo}
    >
      <FondoMundo olas={olas} />
      <main className="pantalla__contenido">{children}</main>
    </div>
  )
}

export function PantallaNeutra({ className = '', children }) {
  return (
    <div className={`pantalla pantalla--neutra ${className}`}>
      <main className="pantalla__contenido">{children}</main>
    </div>
  )
}

// Barra superior: volver, lo que vaya a la izquierda (chip) y lo que vaya a la derecha.
export function BarraSuperior({ atras = '/', neutro = false, izquierda = null, derecha = null }) {
  return (
    <header className="barra-superior">
      <div className="barra-superior__lado">
        <BotonRedondo icono="volver" etiqueta={textos.botones.volver} a={atras} neutro={neutro} />
        {izquierda}
      </div>
      <div className="barra-superior__lado barra-superior__lado--derecha">{derecha}</div>
    </header>
  )
}
