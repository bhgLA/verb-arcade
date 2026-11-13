import { useCallback, useEffect, useRef, useState } from 'react'
import { textos } from '../textos.js'
import { verbos, buscarVerbo, leerProgreso, guardarProgreso } from '../datos/index.js'
import { crearAleatorio } from '../motor/aleatorio.js'
import {
  elegirVerbo,
  crearPreguntaEstudio,
  registrarRespuesta,
  contarDesbloqueadas,
  pistaDe,
} from '../motor/estudio.js'
import Cabecera from '../componentes/Cabecera.jsx'
import Cartucho from '../componentes/Cartucho.jsx'
import BotonAudio from '../componentes/BotonAudio.jsx'

// "was / were" se lee "was, were".
const paraVoz = (texto) => texto.replace(/\s*\/\s*/g, ', ')

function nuevaPregunta(delMundo, progreso, anterior, mundo, rng) {
  const verbo = elegirVerbo(delMundo, progreso, anterior, rng)
  return crearPreguntaEstudio(verbo, verbos, mundo, rng)
}

export default function SesionEstudio({ mundo }) {
  const rng = useRef(null)
  if (rng.current === null) rng.current = crearAleatorio((Math.random() * 2 ** 32) >>> 0)
  const delMundo = useRef(verbos.filter((v) => v.world === mundo)).current

  const [progreso, setProgreso] = useState(() => leerProgreso())
  const [pregunta, setPregunta] = useState(() => nuevaPregunta(delMundo, progreso, null, mundo, rng.current))
  const [respuesta, setRespuesta] = useState(null)
  const [pista, setPista] = useState(null)
  const [cartaNueva, setCartaNueva] = useState(null)
  const botonSiguiente = useRef(null)

  const verbo = buscarVerbo(pregunta.verbo)
  const respondida = respuesta !== null
  const acertada = respuesta === pregunta.correcta

  const responder = useCallback(
    (opcion) => {
      if (respuesta !== null || opcion === pista?.descartar) return
      const r = registrarRespuesta(progreso, pregunta.verbo, opcion === pregunta.correcta)
      guardarProgreso(r.progreso)
      setProgreso(r.progreso)
      setRespuesta(opcion)
      if (r.desbloqueadaAhora) setCartaNueva(pregunta.verbo)
    },
    [respuesta, pista, progreso, pregunta],
  )

  const siguiente = useCallback(() => {
    setPregunta(nuevaPregunta(delMundo, progreso, pregunta.verbo, mundo, rng.current))
    setRespuesta(null)
    setPista(null)
    setCartaNueva(null)
  }, [delMundo, progreso, pregunta, mundo])

  // Teclado: 1-4 responde, Intro pasa a la siguiente. Si el foco está en un botón,
  // Intro lo pulsa el navegador; aquí se ignora para no avanzar dos veces.
  useEffect(() => {
    const alPulsar = (e) => {
      const n = Number(e.key)
      if (!respondida && n >= 1 && n <= pregunta.opciones.length) {
        responder(pregunta.opciones[n - 1])
      } else if (respondida && e.key === 'Enter') {
        if (e.target instanceof HTMLElement && e.target.closest('button, a')) return
        siguiente()
      }
    }
    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [respondida, pregunta, responder, siguiente])

  useEffect(() => {
    if (respondida) botonSiguiente.current?.focus()
  }, [respondida])

  const esMimica = pregunta.tipo === 'mimica'
  const formas = `${verbo.verb} · ${verbo.past} · ${verbo.participle}`
  const formasVoz = paraVoz(`${verbo.verb}. ${verbo.past}. ${verbo.participle}.`)

  return (
    <main className="pagina pagina--arriba">
      <Cabecera
        titulo={textos.mundo(mundo)}
        atras="/estudio"
        extra={textos.estudio.cartasDelMundo(contarDesbloqueadas(progreso, delMundo), delMundo.length)}
      />

      <section className="pregunta" aria-labelledby="enunciado">
        {esMimica ? (
          <>
            <Cartucho verbo={verbo} tamaño="grande" />
            <h2 id="enunciado" className="pregunta__enunciado">{textos.estudio.mimicaPregunta}</h2>
          </>
        ) : (
          <h2 id="enunciado" className="pregunta__enunciado">{pregunta.enunciado}</h2>
        )}

        {(pregunta.tipo === 'pasado' || pregunta.tipo === 'participio') && (
          <p className="pregunta__traduccion">{textos.estudio.traduccion(verbo.verb, verbo.es)}</p>
        )}

        <div className={`opciones opciones--${pregunta.opciones.length}`}>
          {pregunta.opciones.map((o, i) => {
            const estado = !respondida
              ? o === pista?.descartar ? 'descartada' : ''
              : o === pregunta.correcta ? 'correcta' : o === respuesta ? 'fallada' : 'apagada'
            return (
              <button
                key={o}
                type="button"
                className={`boton opcion ${estado ? `opcion--${estado}` : ''}`}
                onClick={() => responder(o)}
                disabled={respondida || estado === 'descartada'}
              >
                <span className="opcion__tecla" aria-hidden="true">{i + 1}</span>
                {o}
              </button>
            )
          })}
        </div>

        <div className="ayudas">
          {!respondida && !pista && (
            <button type="button" className="boton boton--secundario" onClick={() => setPista(pistaDe(pregunta, verbo))}>
              {textos.estudio.pista}
            </button>
          )}
          {/* En mímica el audio diría la respuesta: solo aparece después de responder. */}
          {(!esMimica || respondida) && <BotonAudio texto={respondida ? formasVoz : verbo.verb} />}
        </div>

        <div className="mensajes" aria-live="polite">
          {pista && !respondida && <p className="pista">{pista.texto}</p>}
          {respondida && (
            <div className={`resultado ${acertada ? 'resultado--bien' : 'resultado--mal'}`}>
              <p className="resultado__titulo">{acertada ? textos.estudio.bien : textos.estudio.mal(pregunta.correcta)}</p>
              <p className="resultado__formas">{formas}</p>
              <p className="resultado__traduccion">{verbo.es}</p>
            </div>
          )}
          {cartaNueva && <p className="aviso-carta">{textos.estudio.cartaNueva(cartaNueva)}</p>}
        </div>

        {respondida && (
          <button ref={botonSiguiente} type="button" className="boton boton--principal" onClick={siguiente}>
            {textos.estudio.siguiente}
          </button>
        )}
        <p className="nota-teclas">{textos.estudio.teclas}</p>
      </section>
    </main>
  )
}
