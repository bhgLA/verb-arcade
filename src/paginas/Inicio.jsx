import { useEffect, useMemo, useState } from 'react'
import { textos } from '../textos.js'
import { verbos, verbosDelMundo, leerProgreso, leerRanking } from '../datos/index.js'
import { numeroMejorSemana } from '../componentes/mejorSemana.js'
import { progresoDe, contarDesbloqueadas } from '../motor/estudio.js'
import { semanaISO, numeroDeSemana, mundoDeLaSemana, diasHastaElLunes } from '../motor/semana.js'
import Escenario from '../componentes/Escenario.jsx'
import { FichaMenu, Barra, TopRanking } from '../componentes/FichasInicio.jsx'

// Portada fija en Reef (mundo 2), como diseno/referencia-home-reef.html.
// El mundo de la semana se enseña en /reto y en la ficha Challenge.
const MUNDO_INICIO = 2

// Mundo de estudio: el más alto con alguna respuesta guardada; si no hay, el 1.
function mundoDeEstudio(progreso) {
  let mundo = 1
  for (const v of verbos) {
    const p = progresoDe(progreso, v.verb)
    if (p.aciertos + p.fallos > 0 && v.world > mundo) mundo = v.world
  }
  return mundo
}

// Orden de pintado de la referencia: swam debajo, went encima, ate delante.
const ORDEN_FICHAS = [1, 0, 2]

// Fondo a sangre: círculos en coordenadas del lienzo (escalados con él, pero
// sin recortar en sus bordes), olas repetidas a todo el ancho y arena debajo
// del lienzo si la ventana es más alta que 16:9.
function FondoInicio() {
  return (
    <div className="inicio-fondo" aria-hidden="true">
      <svg className="inicio-fondo__formas" viewBox="0 0 1366 768">
        <circle className="fondo-mundo__forma" cx="130" cy="120" r="360" />
        <circle className="fondo-mundo__anillo" cx="130" cy="120" r="250" />
        <circle className="fondo-mundo__forma" cx="1280" cy="360" r="300" />
        <circle className="fondo-mundo__anillo" cx="1280" cy="360" r="190" />
        <rect className="fondo-mundo__forma" x="610" y="470" width="140" height="140" rx="40" transform="rotate(18 680 540)" />
        <circle className="fondo-mundo__anillo" cx="120" cy="560" r="14" />
        <circle className="fondo-mundo__anillo" cx="196" cy="604" r="8" />
        <circle className="fondo-mundo__anillo" cx="1236" cy="590" r="12" />
        <circle className="fondo-mundo__anillo" cx="1296" cy="540" r="7" />
      </svg>
      <div className="inicio-fondo__olas" />
      <div className="inicio-fondo__arena" />
    </div>
  )
}

// Líder de la semana en Verb Pop. Si no carga, la ficha enseña una línea neutra.
function useLider() {
  const [lider, setLider] = useState({ filas: [], vacio: false })
  useEffect(() => {
    let vivo = true
    leerRanking('verb_pop', { limite: 1 }).then((r) => {
      if (vivo && r.ok) setLider({ filas: r.filas.slice(0, 1), vacio: r.filas.length === 0 })
    })
    return () => {
      vivo = false
    }
  }, [])
  return lider
}

export default function Inicio() {
  const datos = useMemo(() => {
    const progreso = leerProgreso()
    const mundo = mundoDeEstudio(progreso)
    const delMundo = verbosDelMundo(mundo)
    const semana = semanaISO()
    return {
      mundo,
      cartasMundo: contarDesbloqueadas(progreso, delMundo),
      totalMundo: delMundo.length,
      cartas: contarDesbloqueadas(progreso, verbos),
      numeroSemana: numeroDeSemana(semana),
      mundoSemana: mundoDeLaSemana(semana),
      dias: diasHastaElLunes(),
      mejorSemana: numeroMejorSemana('verb_pop', semana),
    }
  }, [])
  const lider = useLider()

  return (
    <Escenario mundo={MUNDO_INICIO} className="escenario--a-sangre" fondo={<FondoInicio />}>
      <main className="inicio">
        <header className="inicio__cabecera">
          <h1 className="inicio__titulo">{textos.titulo}</h1>
          <p className="inicio__lema">{textos.inicio.lema}</p>
        </header>

        <div className="inicio__sello" aria-hidden="true">
          <span className="inicio__sello-texto">{textos.inicio.sello}</span>
          <span className="inicio__sello-numero">{datos.numeroSemana}</span>
        </div>

        {ORDEN_FICHAS.map((i) => (
          <span key={i} className={`inicio__verbo inicio__verbo--${i + 1}`} aria-hidden="true">
            {textos.inicio.fichas[i]}
          </span>
        ))}

        <nav className="inicio__menu" aria-label={textos.inicio.menu}>
          <FichaMenu a="/estudio" icono="libro" titulo={textos.nav.estudio} subtitulo={textos.inicio.estudio.subtitulo}>
            <span className="ficha-inicio__dato">
              {textos.inicio.estudio.progreso(datos.mundo, datos.cartasMundo, datos.totalMundo)}
            </span>
            <Barra valor={datos.cartasMundo} total={datos.totalMundo} />
          </FichaMenu>

          <FichaMenu
            a="/reto"
            icono="rayo"
            titulo={textos.nav.reto}
            subtitulo={textos.inicio.reto.subtitulo(datos.numeroSemana, datos.mundoSemana)}
            destacada
          >
            <span className="ficha-inicio__reto">
              <span className="ficha-inicio__mejor">
                <span className="ficha-inicio__dato">{textos.verbPop.mejorSemana}</span>
                {datos.mejorSemana ? (
                  <span className="ficha-inicio__numero">{datos.mejorSemana}</span>
                ) : (
                  <span className="ficha-inicio__numero ficha-inicio__numero--vacio">{textos.inicio.reto.sinPuntos}</span>
                )}
              </span>
              <span className="ficha-inicio__pildora">{textos.inicio.reto.dias(datos.dias)}</span>
            </span>
          </FichaMenu>

          <FichaMenu a="/cartas" icono="cartas" titulo={textos.nav.cartas} subtitulo={textos.inicio.cartas.subtitulo}>
            <span className="ficha-inicio__numero">
              {datos.cartas} <span className="ficha-inicio__de">{textos.inicio.cartas.de(verbos.length)}</span>
            </span>
            <Barra valor={datos.cartas} total={verbos.length} className="ficha-inicio__barra--cartas" />
          </FichaMenu>

          <FichaMenu a="/ranking" icono="podio" titulo={textos.nav.ranking} subtitulo={textos.ranking.portada.subtitulo}>
            <TopRanking filas={lider.filas} vacio={lider.vacio} />
          </FichaMenu>
        </nav>
      </main>
    </Escenario>
  )
}
