import { Enlace } from '../rutas.jsx'
import { textos } from '../textos.js'

export default function Reto() {
  return (
    <main className="pagina">
      <h1>{textos.nav.reto}</h1>
      <p>{textos.pendiente}</p>
      <Enlace a="/" className="boton">{textos.volver}</Enlace>
    </main>
  )
}
