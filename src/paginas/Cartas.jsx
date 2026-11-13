import { Enlace } from '../rutas.jsx'
import { textos } from '../textos.js'

export default function Cartas() {
  return (
    <main className="pagina">
      <h1>{textos.nav.cartas}</h1>
      <p>{textos.pendiente}</p>
      <Enlace a="/" className="boton">{textos.volver}</Enlace>
    </main>
  )
}
