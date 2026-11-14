import { Enlace } from '../rutas.jsx'
import { textos } from '../textos.js'
import { PantallaMundo } from '../componentes/Pantalla.jsx'

const DESTINOS = [
  ['/estudio', 'estudio'],
  ['/reto', 'reto'],
  ['/cartas', 'cartas'],
  ['/ranking', 'ranking'],
]

// El inicio va siempre con el color de Reef (mundo 2). El mundo de la semana
// se enseña en /reto.
const MUNDO_INICIO = 2

export default function Inicio() {
  return (
    <PantallaMundo mundo={MUNDO_INICIO} className="inicio">
      <h1 className="inicio__titulo">{textos.titulo}</h1>
      <nav className="inicio__menu">
        {DESTINOS.map(([a, clave]) => (
          <Enlace key={a} a={a} className="tesela inicio__tesela">
            <span className="inicio__tesela-texto">{textos.nav[clave]}</span>
          </Enlace>
        ))}
      </nav>
    </PantallaMundo>
  )
}
