import { useMemo } from 'react'
import { textos } from '../textos.js'
import { semanaISO, mundoDeLaSemana } from '../motor/semana.js'
import { PantallaMundo, BarraSuperior } from '../componentes/Pantalla.jsx'
import { Chip } from '../componentes/Piezas.jsx'

// Estructura y estilo; el ranking real llega en el paso 5.
export default function Ranking() {
  const semana = useMemo(() => semanaISO(), [])
  const mundo = mundoDeLaSemana(semana)
  return (
    <PantallaMundo mundo={mundo} className="ranking">
      <BarraSuperior izquierda={<Chip mundo={mundo} />} />
      <h1 className="titulo-grande">{textos.nav.ranking}</h1>
      <p className="texto-mundo">{textos.verbPop.semana(semana, mundo)}</p>
      <div className="tarjeta ranking__pronto">
        <p>{textos.ranking.pronto}</p>
      </div>
    </PantallaMundo>
  )
}
