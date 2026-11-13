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
import { PantallaMundo, BarraSuperior } from '../componentes/Pantalla.jsx'
import { Chip, Medidor, EmojiCirculo } from '../componentes/Piezas.jsx'
import BotonRedondo from '../componentes/BotonRedondo.jsx'
import BotonAudio from '../componentes/BotonAudio.jsx'
import Tesela from '../componentes/Tesela.jsx'
import { letras } from '../componentes/ajusteTexto.js'

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
  const [numero, setNumero] = useState(0)
  const [respuesta, setRespuesta] = useState(null)
  const [pista, setPista] = useState(null)
  const [traduccion, setTraduccion] = useState(false)
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
    setNumero((n) => n + 1)
    setRespuesta(null)
    setPista(null)
    setTraduccion(false)
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
  const conTraduccion = pregunta.tipo === 'pasado' || pregunta.tipo === 'participio'
  const hechas = contarDesbloqueadas(progreso, delMundo)

  const estadoDe = (o) => {
    if (!respondida) return o === pista?.descartar ? 'descartada' : ''
    if (o === pregunta.correcta) return acertada ? 'correcta' : 'solucion'
    return o === respuesta ? 'fallada' : 'apagada'
  }

  return (
    <PantallaMundo mundo={mundo} olas className="sesion">
      <BarraSuperior
        atras="/estudio"
        izquierda={<Chip mundo={mundo} />}
        derecha={
          <div className="sesion__cartas">
            <span>{textos.estudio.cartasDelMundo(hechas, delMundo.length)}</span>
            <Medidor valor={hechas / delMundo.length} etiqueta={textos.nav.cartas} ancho={200} />
          </div>
        }
      />

      <section className="sesion__reto" aria-labelledby="enunciado">
        <p className="sesion__etiqueta">{textos.etiquetas[pregunta.tipo]}</p>
        {esMimica ? (
          <>
            <EmojiCirculo verbo={verbo} tam={176} />
            <h1 id="enunciado" className="visualmente-oculto">
              {textos.estudio.mimicaPregunta}
            </h1>
          </>
        ) : (
          <h1 id="enunciado" className="sesion__verbo" style={{ '--letras': letras(pregunta.verbo) }}>
            {pregunta.verbo}
          </h1>
        )}
      </section>

      <div className={`sesion__opciones sesion__opciones--${pregunta.opciones.length}`}>
        {pregunta.opciones.map((o, i) => (
          <Tesela
            key={`${numero}-${o}`}
            tecla={i + 1}
            texto={o}
            estado={estadoDe(o)}
            entra
            className="sesion__tesela"
            onClick={() => responder(o)}
            disabled={respondida || o === pista?.descartar}
          />
        ))}
      </div>

      <div className="sesion__ayudas">
        {!respondida && (
          <BotonRedondo
            icono="pista"
            etiqueta={textos.botones.pista}
            conEtiqueta
            onClick={() => setPista(pistaDe(pregunta, verbo))}
            disabled={pista !== null}
          />
        )}
        {!respondida && conTraduccion && (
          <BotonRedondo
            icono="traducir"
            etiqueta={textos.botones.traducir}
            conEtiqueta
            onClick={() => setTraduccion(true)}
            disabled={traduccion}
          />
        )}
        {/* En mímica el audio diría la respuesta: solo aparece después de responder. */}
        {(!esMimica || respondida) && (
          <BotonAudio texto={respondida ? paraVoz(`${verbo.verb}. ${verbo.past}. ${verbo.participle}.`) : verbo.verb} />
        )}
      </div>

      <div className="sesion__mensajes" aria-live="polite">
        {!respondida && (traduccion || pista) && (
          <div className="tarjeta sesion__ayuda">
            {traduccion && <p>{textos.estudio.traduccion(verbo.verb, verbo.es)}</p>}
            {pista && <p>{pista.texto}</p>}
          </div>
        )}
        {respondida && (
          <div className="tarjeta sesion__resultado">
            <p className="sesion__resultado-titulo">
              {acertada ? textos.estudio.bien : textos.estudio.mal(pregunta.correcta)}
            </p>
            <p className="sesion__resultado-formas">
              {verbo.verb} · {verbo.past} · {verbo.participle}
            </p>
            <p>{verbo.es}</p>
          </div>
        )}
        {cartaNueva && <p className="aviso-acento">{textos.estudio.cartaNueva(cartaNueva)}</p>}
        {respondida && (
          <button ref={botonSiguiente} type="button" className="pildora" onClick={siguiente}>
            {textos.estudio.siguiente}
          </button>
        )}
      </div>
    </PantallaMundo>
  )
}
