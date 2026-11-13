import { Enlace } from '../rutas.jsx'
import { textos } from '../textos.js'

export default function Ranking() {
  return (
    <main className="pagina">
      <h1>{textos.nav.ranking}</h1>
      <p>{textos.pendiente}</p>
      <Enlace a="/" className="boton">{textos.volver}</Enlace>
    </main>
  )
}
