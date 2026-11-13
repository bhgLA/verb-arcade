import { useMemo } from 'react'
import { Enlace } from '../rutas.jsx'
import { textos } from '../textos.js'
import { verbos, leerProgreso } from '../datos/index.js'
import { contarDesbloqueadas } from '../motor/estudio.js'
import Cabecera from '../componentes/Cabecera.jsx'

const MUNDOS = Array.from({ length: 10 }, (_, i) => i + 1)

export default function Estudio() {
  const progreso = useMemo(() => leerProgreso(), [])
  return (
    <main className="pagina pagina--arriba">
      <Cabecera titulo={textos.nav.estudio} />
      <p className="subtitulo">{textos.estudio.elegirMundo}</p>
      <ul className="mundos">
        {MUNDOS.map((n) => {
          const delMundo = verbos.filter((v) => v.world === n)
          const hechas = contarDesbloqueadas(progreso, delMundo)
          return (
            <li key={n} className="mundo">
              <span className="mundo__nombre">{textos.mundo(n)}</span>
              <span className="mundo__progreso">{textos.estudio.cartasDelMundo(hechas, delMundo.length)}</span>
              <span className="barra" aria-hidden="true">
                <span className="barra__relleno" style={{ width: `${(hechas / delMundo.length) * 100}%` }} />
              </span>
              <span className="mundo__juegos">
                <Enlace a={`/estudio/${n}`} className="boton boton--pequeño">{textos.verbPop.quiz}</Enlace>
                <Enlace a={`/estudio/${n}/pop`} className="boton boton--pequeño">{textos.verbPop.titulo}</Enlace>
              </span>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
