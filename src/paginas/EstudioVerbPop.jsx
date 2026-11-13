import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { textos } from '../textos.js'
import { verbos, buscarVerbo, leerProgreso, guardarProgreso } from '../datos/index.js'
import { crearAleatorio } from '../motor/aleatorio.js'
import { TIPOS_VERB_POP_ESTUDIO } from '../motor/config.js'
import { crearPartida, partidaReducer, alturaBloques } from '../motor/partida.js'
import {
  elegirVerbo,
  crearPreguntaEstudio,
  registrarRespuesta,
  contarDesbloqueadas,
  pistaDe,
} from '../motor/estudio.js'
import { useMenosMovimiento } from '../movimiento.js'
import Cabecera from '../componentes/Cabecera.jsx'
import BotonAudio from '../componentes/BotonAudio.jsx'
import Escena from '../componentes/verbpop/Escena.jsx'
import { useReloj } from '../componentes/verbpop/useReloj.js'
import { useTeclado } from '../componentes/verbpop/useTeclado.js'
import { estadosDeBloques } from '../componentes/verbpop/estados.js'

// "was / were" se lee "was, were".
const paraVoz = (texto) => texto.replace(/\s*\/\s*/g, ', ')

export default function EstudioVerbPop({ mundo }) {
  const rng = useRef(null)
  if (rng.current === null) rng.current = crearAleatorio((Math.random() * 2 ** 32) >>> 0)
  const delMundo = useRef(verbos.filter((v) => v.world === mundo)).current

  const nueva = useCallback(
    (progreso, anterior) =>
      crearPreguntaEstudio(
        elegirVerbo(delMundo, progreso, anterior, rng.current),
        verbos,
        mundo,
        rng.current,
        TIPOS_VERB_POP_ESTUDIO,
      ),
    [delMundo, mundo],
  )

  const [progreso, setProgreso] = useState(() => leerProgreso())
  const [s, dispatch] = useReducer(partidaReducer, undefined, () =>
    crearPartida({ modo: 'estudio', preguntas: [nueva(progreso, null)], mundo }),
  )
  const ahora = useReloj(dispatch, true)
  const menosMovimiento = useMenosMovimiento()
  const [columna, setColumna] = useState(1)
  const [pista, setPista] = useState(null)
  const [cartaNueva, setCartaNueva] = useState(null)
  const registrado = useRef(null)
  const botonSiguiente = useRef(null)

  const { reto } = s
  const { pregunta } = reto
  const verbo = buscarVerbo(pregunta.verbo)
  const respondido = reto.respuesta !== null

  // Cada reto respondido suma (o no) al progreso una sola vez.
  useEffect(() => {
    if (!respondido || registrado.current === reto) return
    registrado.current = reto
    const r = registrarRespuesta(progreso, pregunta.verbo, reto.acierto)
    guardarProgreso(r.progreso)
    setProgreso(r.progreso)
    if (r.desbloqueadaAhora) setCartaNueva(pregunta.verbo)
    botonSiguiente.current?.focus()
  }, [respondido, reto, progreso, pregunta])

  const responder = useCallback(
    (i) => {
      const opcion = pregunta.opciones[i]
      if (opcion === pista?.descartar) return
      setColumna(i)
      dispatch({ type: 'responder', t: ahora(), opcion })
    },
    [ahora, pregunta, pista],
  )

  const siguiente = useCallback(() => {
    if (!respondido) return
    dispatch({ type: 'siguiente', t: ahora(), pregunta: nueva(progreso, pregunta.verbo) })
    setPista(null)
    setCartaNueva(null)
  }, [respondido, ahora, nueva, progreso, pregunta])

  useTeclado({
    opciones: pregunta.opciones.length,
    columna,
    setColumna,
    alResponder: responder,
    alSeguir: siguiente,
    respondido,
  })

  const atrapado = respondido ? pregunta.opciones.indexOf(reto.respuesta) : null
  const formas = `${verbo.verb} · ${verbo.past} · ${verbo.participle}`

  return (
    <div className="verbpop verbpop--estudio">
      <Cabecera
        titulo={`${textos.verbPop.titulo} · ${textos.mundo(mundo)}`}
        atras="/estudio"
        extra={textos.estudio.cartasDelMundo(contarDesbloqueadas(progreso, delMundo), delMundo.length)}
      />
      <div className="panel-reto">
        <h1 className="panel-reto__enunciado">{pregunta.enunciado}</h1>
        {(pregunta.tipo === 'pasado' || pregunta.tipo === 'participio') && (
          <p className="pregunta__traduccion">{textos.estudio.traduccion(verbo.verb, verbo.es)}</p>
        )}
        <div className="ayudas">
          {!respondido && !pista && (
            <button type="button" className="boton boton--secundario" onClick={() => setPista(pistaDe(pregunta, verbo))}>
              {textos.estudio.pista}
            </button>
          )}
          {respondido && <BotonAudio texto={paraVoz(`${verbo.verb}. ${verbo.past}. ${verbo.participle}.`)} />}
          {respondido && (
            <button ref={botonSiguiente} type="button" className="boton boton--principal" onClick={siguiente}>
              {textos.estudio.siguiente}
            </button>
          )}
        </div>
        <div className="mensajes" aria-live="polite">
          {pista && !respondido && <p className="pista">{pista.texto}</p>}
          {respondido && (
            <div className={`resultado ${reto.acierto ? 'resultado--bien' : 'resultado--mal'}`}>
              <p className="resultado__titulo">
                {reto.acierto ? textos.estudio.bien : textos.estudio.mal(pregunta.correcta)}
              </p>
              <p className="resultado__formas">{formas}</p>
              <p className="resultado__traduccion">{verbo.es}</p>
            </div>
          )}
          {cartaNueva && <p className="aviso-carta">{textos.estudio.cartaNueva(cartaNueva)}</p>}
        </div>
      </div>
      <Escena
        opciones={pregunta.opciones}
        estados={estadosDeBloques(s, pista?.descartar)}
        altura={menosMovimiento ? s.cfg.lineaSeguraEstudio : alturaBloques(s)}
        atrapado={atrapado}
        columna={columna}
        alElegir={responder}
      />
    </div>
  )
}
