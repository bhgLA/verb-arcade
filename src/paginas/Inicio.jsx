import { useMemo } from 'react'
import { textos } from '../textos.js'
import { verbos, verbosDelMundo, leerProgreso, leerRecord } from '../datos/index.js'
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

// Todavía no hay ranking (llega con Supabase, paso 5).
const TOP_RANKING = []

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
      record: leerRecord('verb_pop'),
    }
  }, [])

  return (
    <Escenario mundo={MUNDO_INICIO}>
      <svg className="fondo-mundo" viewBox="0 0 1366 768" aria-hidden="true">
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
      <svg className="olas inicio__olas" viewBox="0 0 1366 190" preserveAspectRatio="none" aria-hidden="true">
        <path
          className="olas__1"
          d="M0 52 Q 85 8 171 52 T 341 52 T 512 52 T 683 52 T 854 52 T 1025 52 T 1195 52 T 1366 52 L1366 190 L0 190 Z"
        />
        <path
          className="olas__2"
          d="M0 98 Q 85 56 171 98 T 341 98 T 512 98 T 683 98 T 854 98 T 1025 98 T 1195 98 T 1366 98 L1366 190 L0 190 Z"
        />
      </svg>

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
                <span className="ficha-inicio__dato">{textos.inicio.reto.mejor}</span>
                {datos.record > 0 ? (
                  <span className="ficha-inicio__numero">{textos.numero(datos.record)}</span>
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

          <FichaMenu a="/ranking" icono="podio" titulo={textos.nav.ranking}>
            <TopRanking filas={TOP_RANKING} />
          </FichaMenu>
        </nav>
      </main>
    </Escenario>
  )
}
