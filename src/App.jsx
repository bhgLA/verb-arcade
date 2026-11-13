import { useRuta, Enlace } from './rutas.jsx'
import { textos } from './textos.js'
import Inicio from './paginas/Inicio.jsx'
import Estudio from './paginas/Estudio.jsx'
import SesionEstudio from './paginas/SesionEstudio.jsx'
import EstudioVerbPop from './paginas/EstudioVerbPop.jsx'
import RetoVerbPop from './paginas/RetoVerbPop.jsx'
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
  const sesion = /^\/estudio\/(\d{1,2})(\/pop)?$/.exec(ruta)
  const mundo = sesion ? Number(sesion[1]) : 0
  if (mundo >= 1 && mundo <= 10) {
    return sesion[2] ? <EstudioVerbPop key={`pop-${mundo}`} mundo={mundo} /> : <SesionEstudio key={mundo} mundo={mundo} />
  }
  if (ruta === '/reto/verb-pop') return <RetoVerbPop />
  const Pagina = PAGINAS[ruta] ?? NoEncontrada
  return <Pagina />
}
