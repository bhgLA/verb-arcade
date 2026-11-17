import { useRuta } from './rutas.jsx'
import { textos } from './textos.js'
import { PantallaNeutra, BarraSuperior } from './componentes/Pantalla.jsx'
import Inicio from './paginas/Inicio.jsx'
import Estudio from './paginas/Estudio.jsx'
import SesionEstudio from './paginas/SesionEstudio.jsx'
import EstudioVerbPop from './paginas/EstudioVerbPop.jsx'
import RetoVerbPop from './paginas/RetoVerbPop.jsx'
import Reto from './paginas/Reto.jsx'
import Cartas from './paginas/Cartas.jsx'
import Ranking from './paginas/Ranking.jsx'
import GuardaApodo from './componentes/GuardaApodo.jsx'

// Juegos de Challenge: todos pasan por la guarda del apodo en el primer uso.
const JUEGOS_RETO = {
  '/reto/verb-pop': { Pagina: RetoVerbPop, titulo: textos.verbPop.titulo },
}

const PAGINAS = {
  '/': Inicio,
  '/estudio': Estudio,
  '/reto': Reto,
  '/cartas': Cartas,
  '/ranking': Ranking,
}

function NoEncontrada() {
  return (
    <PantallaNeutra>
      <BarraSuperior neutro />
      <h1 className="titulo-neutro">{textos.noEncontrada}</h1>
    </PantallaNeutra>
  )
}

export default function App() {
  const ruta = useRuta().replace(/\/+$/, '') || '/'
  const sesion = /^\/estudio\/(\d{1,2})(\/pop)?$/.exec(ruta)
  const mundo = sesion ? Number(sesion[1]) : 0
  if (mundo >= 1 && mundo <= 10) {
    return sesion[2] ? <EstudioVerbPop key={`pop-${mundo}`} mundo={mundo} /> : <SesionEstudio key={mundo} mundo={mundo} />
  }
  const juego = JUEGOS_RETO[ruta]
  if (juego) return <GuardaApodo key={ruta} ruta={ruta} {...juego} />
  const Pagina = PAGINAS[ruta] ?? NoEncontrada
  return <Pagina />
}
