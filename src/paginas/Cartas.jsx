import { useEffect, useMemo, useRef, useState } from 'react'
import { textos } from '../textos.js'
import { verbos, leerProgreso } from '../datos/index.js'
import { estaDesbloqueada, contarDesbloqueadas } from '../motor/estudio.js'
import { PantallaNeutra, BarraSuperior } from '../componentes/Pantalla.jsx'
import { EmojiCirculo } from '../componentes/Piezas.jsx'
import BotonAudio from '../componentes/BotonAudio.jsx'

const MUNDOS = Array.from({ length: 10 }, (_, i) => i + 1)
const paraVoz = (texto) => texto.replace(/\s*\/\s*/g, ', ')

function Formas({ verbo }) {
  return (
    <dl className="formas">
      <div>
        <dt>{textos.cartas.past}</dt>
        <dd>{verbo.past}</dd>
      </div>
      <div>
        <dt>{textos.cartas.participle}</dt>
        <dd>{verbo.participle}</dd>
      </div>
    </dl>
  )
}

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
      className="carta-grande superficie-mundo"
      data-mundo={verbo.world}
      aria-labelledby="carta-grande-titulo"
      onClose={alCerrar}
      onClick={(e) => e.target === dialogo.current && dialogo.current.close()}
    >
      <div className="carta-grande__cuerpo">
        <EmojiCirculo verbo={verbo} tam={160} />
        <h2 id="carta-grande-titulo" className="carta-grande__verbo">
          {verbo.verb}
        </h2>
        <p className="carta-grande__es">{verbo.es}</p>
        <Formas verbo={verbo} />
        <p className="carta-grande__categoria">{textos.categorias[verbo.category] ?? verbo.category}</p>
        <div className="carta-grande__acciones">
          <BotonAudio texto={paraVoz(`${verbo.verb}. ${verbo.past}. ${verbo.participle}.`)} />
          <button type="button" className="pildora pildora--pequena" onClick={() => dialogo.current.close()} autoFocus>
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
    <PantallaNeutra className="cartas">
      <BarraSuperior
        neutro
        derecha={
          <span className="texto-neutro texto-neutro--fuerte">
            {textos.cartas.total(contarDesbloqueadas(progreso, verbos), verbos.length)}
          </span>
        }
      />
      <h1 className="titulo-neutro">{textos.nav.cartas}</h1>
      {MUNDOS.map((n) => {
        const delMundo = verbos.filter((v) => v.world === n)
        return (
          <section key={n} className="grupo-cartas" aria-labelledby={`mundo-${n}`}>
            <h2 id={`mundo-${n}`} className="grupo-cartas__cabecera superficie-mundo" data-mundo={n}>
              <span>{textos.chipMundo(n)}</span>
              <span className="grupo-cartas__cuenta">
                {textos.fraccion(contarDesbloqueadas(progreso, delMundo), delMundo.length)}
              </span>
            </h2>
            <ul className="rejilla-cartas">
              {delMundo.map((v) =>
                estaDesbloqueada(progreso, v.verb) ? (
                  <li key={v.verb}>
                    <button
                      type="button"
                      className="carta superficie-mundo"
                      data-mundo={n}
                      onClick={() => setAbierta(v)}
                    >
                      <EmojiCirculo verbo={v} tam={80} />
                      <span className="carta__verbo">{v.verb}</span>
                      <span className="carta__es">{v.es}</span>
                      <Formas verbo={v} />
                    </button>
                  </li>
                ) : (
                  <li key={v.verb}>
                    <div className="carta carta--bloqueada" role="img" aria-label={textos.cartas.bloqueada}>
                      <span className="carta__silueta" aria-hidden="true">
                        ?
                      </span>
                    </div>
                  </li>
                ),
              )}
            </ul>
          </section>
        )
      })}
      {abierta && <CartaGrande verbo={abierta} alCerrar={() => setAbierta(null)} />}
    </PantallaNeutra>
  )
}
