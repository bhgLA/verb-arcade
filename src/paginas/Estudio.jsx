import { useMemo } from 'react'
import { Enlace } from '../rutas.jsx'
import { textos } from '../textos.js'
import { verbos, leerProgreso } from '../datos/index.js'
import { contarDesbloqueadas } from '../motor/estudio.js'
import { PantallaNeutra } from '../componentes/Pantalla.jsx'
import BotonRedondo from '../componentes/BotonRedondo.jsx'
import { Medidor } from '../componentes/Piezas.jsx'

const MUNDOS = Array.from({ length: 10 }, (_, i) => i + 1)

export default function Estudio() {
  const progreso = useMemo(() => leerProgreso(), [])
  return (
    <PantallaNeutra className="lista-mundos">
      <header className="lista-mundos__cabecera">
        <BotonRedondo icono="volver" etiqueta={textos.botones.volver} a="/" neutro />
        <h1 className="lista-mundos__titulo">{textos.nav.estudio}</h1>
        <p className="lista-mundos__subtitulo">{textos.estudio.elegirMundo}</p>
      </header>
      <ul className="lista-mundos__rejilla">
        {MUNDOS.map((n) => {
          const delMundo = verbos.filter((v) => v.world === n)
          const hechas = contarDesbloqueadas(progreso, delMundo)
          return (
            <li key={n} className="tarjeta-mundo superficie-mundo" data-mundo={n}>
              <span className="tarjeta-mundo__cabeza">
                <span className="tarjeta-mundo__numero" aria-hidden="true">
                  {n}
                </span>
                <h2 className="tarjeta-mundo__nombre">{textos.chipMundo(n)}</h2>
              </span>
              <span className="tarjeta-mundo__cartas">{textos.estudio.cartasDelMundo(hechas, delMundo.length)}</span>
              <Medidor valor={hechas / delMundo.length} etiqueta={textos.estudio.cartasDelMundo(hechas, delMundo.length)} />
              <span className="tarjeta-mundo__juegos">
                <Enlace a={`/estudio/${n}`} className="pildora pildora--pequena">
                  {textos.verbPop.quiz}
                </Enlace>
                <Enlace a={`/estudio/${n}/pop`} className="pildora pildora--pequena">
                  {textos.verbPop.titulo}
                </Enlace>
              </span>
            </li>
          )
        })}
      </ul>
    </PantallaNeutra>
  )
}
