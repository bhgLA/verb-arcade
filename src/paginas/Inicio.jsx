import { useMemo } from 'react'
import { Enlace } from '../rutas.jsx'
import { textos } from '../textos.js'
import { semanaISO, mundoDeLaSemana } from '../motor/semana.js'
import { PantallaMundo } from '../componentes/Pantalla.jsx'
import { Chip } from '../componentes/Piezas.jsx'

const DESTINOS = [
  ['/estudio', 'estudio'],
  ['/reto', 'reto'],
  ['/cartas', 'cartas'],
  ['/ranking', 'ranking'],
]

export default function Inicio() {
  const mundo = useMemo(() => mundoDeLaSemana(semanaISO()), [])
  return (
    <PantallaMundo mundo={mundo} className="inicio">
      <Chip mundo={mundo} />
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
