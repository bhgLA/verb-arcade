import { useMemo } from 'react'
import { textos } from '../textos.js'
import { Enlace } from '../rutas.jsx'
import { lineaMejorSemana } from '../componentes/mejorSemana.js'
import { semanaISO, mundoDeLaSemana } from '../motor/semana.js'
import { PantallaMundo, BarraSuperior } from '../componentes/Pantalla.jsx'
import { Chip } from '../componentes/Piezas.jsx'

export default function Reto() {
  const semana = useMemo(() => semanaISO(), [])
  const mundo = mundoDeLaSemana(semana)
  const mejorSemana = lineaMejorSemana('verb_pop', semana)
  return (
    <PantallaMundo mundo={mundo} className="menu-reto">
      <BarraSuperior izquierda={<Chip>{textos.chipSemana(mundo)}</Chip>} />
      <h1 className="titulo-grande">{textos.nav.reto}</h1>
      <p className="texto-mundo">{textos.verbPop.semana(semana, mundo)}</p>
      <nav className="menu-reto__juegos" aria-label={textos.verbPop.elegirJuego}>
        <Enlace a="/reto/verb-pop" className="tesela menu-reto__tesela">
          <span className="menu-reto__nombre">{textos.verbPop.titulo}</span>
          {mejorSemana && <span className="menu-reto__record">{mejorSemana}</span>}
        </Enlace>
        <span className="tesela menu-reto__tesela menu-reto__tesela--inactiva" aria-disabled="true">
          <span className="menu-reto__pronto">{textos.verbPop.mimicaPronto}</span>
        </span>
      </nav>
    </PantallaMundo>
  )
}
