import { useEffect, useMemo, useRef, useState } from 'react'
import { textos } from '../textos.js'
import { verbos, leerProgreso } from '../datos/index.js'
import { estaDesbloqueada, contarDesbloqueadas } from '../motor/estudio.js'
import Cabecera from '../componentes/Cabecera.jsx'
import Cartucho from '../componentes/Cartucho.jsx'
import BotonAudio from '../componentes/BotonAudio.jsx'

const MUNDOS = Array.from({ length: 10 }, (_, i) => i + 1)
const paraVoz = (texto) => texto.replace(/\s*\/\s*/g, ', ')

function CartaGrande({ verbo, alCerrar }) {
  const dialogo = useRef(null)
  // Sin cleanup: al desmontar, el <dialog> sale del DOM y el modal termina solo.
  // Cerrarlo aquí haría que StrictMode cerrase la carta recién abierta.
  useEffect(() => {
    const d = dialogo.current
    if (d && !d.open) d.showModal()
  }, [])
  return (
    <dialog
      ref={dialogo}
      className="carta-grande"
      aria-labelledby="carta-grande-titulo"
      onClose={alCerrar}
      onClick={(e) => e.target === dialogo.current && dialogo.current.close()}
    >
      <div className="carta-grande__cuerpo">
        <Cartucho verbo={verbo} tamaño="grande" />
        <h2 id="carta-grande-titulo" className="carta-grande__verbo">{verbo.verb}</h2>
        <p className="carta-grande__es">{verbo.es}</p>
        <dl className="formas">
          <div><dt>{textos.cartas.past}</dt><dd>{verbo.past}</dd></div>
          <div><dt>{textos.cartas.participle}</dt><dd>{verbo.participle}</dd></div>
        </dl>
        <p className="carta-grande__categoria">{textos.categorias[verbo.category] ?? verbo.category}</p>
        <div className="ayudas">
          <BotonAudio texto={paraVoz(`${verbo.verb}. ${verbo.past}. ${verbo.participle}.`)} />
          <button type="button" className="boton" onClick={() => dialogo.current.close()} autoFocus>
            {textos.cartas.cerrar}
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default function Cartas() {
  const progreso = useMemo(() => leerProgreso(), [])
  const [abierta, setAbierta] = useState(null)

  return (
    <main className="pagina pagina--arriba">
      <Cabecera
        titulo={textos.nav.cartas}
        extra={textos.cartas.total(contarDesbloqueadas(progreso, verbos), verbos.length)}
      />
      {MUNDOS.map((n) => {
        const delMundo = verbos.filter((v) => v.world === n)
        return (
          <section key={n} className="grupo-cartas" aria-labelledby={`mundo-${n}`}>
            <h2 id={`mundo-${n}`} className="grupo-cartas__titulo">
              {textos.mundo(n)}
              <span className="grupo-cartas__cuenta">
                {textos.fraccion(contarDesbloqueadas(progreso, delMundo), delMundo.length)}
              </span>
            </h2>
            <ul className="rejilla-cartas">
              {delMundo.map((v) =>
                estaDesbloqueada(progreso, v.verb) ? (
                  <li key={v.verb}>
                    <button type="button" className="carta" onClick={() => setAbierta(v)}>
                      <Cartucho verbo={v} />
                      <span className="carta__verbo">{v.verb}</span>
                      <span className="carta__es">{v.es}</span>
                      <span className="carta__formas">{v.past} · {v.participle}</span>
                    </button>
                  </li>
                ) : (
                  <li key={v.verb}>
                    <div className="carta carta--bloqueada" role="img" aria-label={textos.cartas.bloqueada}>
                      <span className="carta__silueta" aria-hidden="true">?</span>
                    </div>
                  </li>
                ),
              )}
            </ul>
          </section>
        )
      })}
      {abierta && <CartaGrande verbo={abierta} alCerrar={() => setAbierta(null)} />}
    </main>
  )
}
