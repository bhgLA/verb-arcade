import { Enlace } from '../rutas.jsx'
import { textos } from '../textos.js'

export default function Cabecera({ titulo, atras = '/', extra = null }) {
  return (
    <header className="cabecera">
      <Enlace a={atras} className="boton boton--pequeño">{textos.volver}</Enlace>
      <h1 className="cabecera__titulo">{titulo}</h1>
      <div className="cabecera__extra">{extra}</div>
    </header>
  )
}
