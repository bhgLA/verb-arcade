import { useRuta, Enlace } from './rutas.jsx'
import { textos } from './textos.js'
import Inicio from './paginas/Inicio.jsx'
import Estudio from './paginas/Estudio.jsx'
import Reto from './paginas/Reto.jsx'
import Cartas from './paginas/Cartas.jsx'
import Ranking from './paginas/Ranking.jsx'

const PAGINAS = {
  '/': Inicio,
  '/estudio': Estudio,
  '/reto': Reto,
  '/cartas': Cartas,
  '/ranking': Ranking,
}

function NoEncontrada() {
  return (
    <main className="pagina">
      <h1>{textos.noEncontrada}</h1>
      <Enlace a="/" className="boton">{textos.volver}</Enlace>
    </main>
  )
}

export default function App() {
  const ruta = useRuta()
  const Pagina = PAGINAS[ruta.replace(/\/+$/, '') || '/'] ?? NoEncontrada
  return <Pagina />
}
