import { textos } from '../textos.js'
import { Enlace } from '../rutas.jsx'
import { leerRecord } from '../datos/index.js'
import { semanaISO, mundoDeLaSemana } from '../motor/semana.js'
import Cabecera from '../componentes/Cabecera.jsx'

export default function Reto() {
  const semana = semanaISO()
  const record = leerRecord('verb_pop')
  return (
    <main className="pagina pagina--arriba">
      <Cabecera titulo={textos.nav.reto} />
      <p className="subtitulo">{textos.verbPop.semana(semana, mundoDeLaSemana(semana))}</p>
      <p className="subtitulo">{textos.verbPop.elegirJuego}</p>
      <nav className="menu">
        <Enlace a="/reto/verb-pop" className="boton juego-boton">
          <span>{textos.verbPop.titulo}</span>
          {record > 0 && (
            <span className="juego-boton__record">
              {textos.verbPop.record} {record}
            </span>
          )}
        </Enlace>
        <span className="boton boton--inactivo" aria-disabled="true">
          {textos.verbPop.mimicaPronto}
        </span>
      </nav>
    </main>
  )
}
