import { Enlace } from '../rutas.jsx'
import { textos } from '../textos.js'

export default function Inicio() {
  return (
    <main className="pagina">
      <h1>{textos.titulo}</h1>
      <nav className="menu">
        <Enlace a="/estudio" className="boton">{textos.nav.estudio}</Enlace>
        <Enlace a="/reto" className="boton">{textos.nav.reto}</Enlace>
        <Enlace a="/cartas" className="boton">{textos.nav.cartas}</Enlace>
        <Enlace a="/ranking" className="boton">{textos.nav.ranking}</Enlace>
      </nav>
    </main>
  )
}
