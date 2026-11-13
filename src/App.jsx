import { useRuta, Enlace } from './rutas.jsx'
import { textos } from './textos.js'
import Inicio from './paginas/Inicio.jsx'
import Estudio from './paginas/Estudio.jsx'
import SesionEstudio from './paginas/SesionEstudio.jsx'
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
  const ruta = useRuta().replace(/\/+$/, '') || '/'
  const sesion = /^\/estudio\/(\d{1,2})$/.exec(ruta)
  const mundo = sesion ? Number(sesion[1]) : 0
  if (mundo >= 1 && mundo <= 10) return <SesionEstudio key={mundo} mundo={mundo} />
  const Pagina = PAGINAS[ruta] ?? NoEncontrada
  return <Pagina />
}
