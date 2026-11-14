import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { textos } from '../textos.js'
import { verbos, buscarVerbo, leerProgreso, guardarProgreso } from '../datos/index.js'
import { crearAleatorio } from '../motor/aleatorio.js'
import { TIPOS_VERB_POP_ESTUDIO } from '../motor/config.js'
import { crearPartida, partidaReducer, alturaBloques, preguntaActual, FASE } from '../motor/partida.js'
import {
  elegirVerbo,
  crearPreguntaEstudio,
  registrarRespuesta,
  contarDesbloqueadas,
  pistaDe,
} from '../motor/estudio.js'
import { useMenosMovimiento } from '../movimiento.js'
import { Enlace } from '../rutas.jsx'
import { PantallaMundo, BarraSuperior } from '../componentes/Pantalla.jsx'
import BotonAudio from '../componentes/BotonAudio.jsx'
import BotonRedondo from '../componentes/BotonRedondo.jsx'
import { Chip, Medidor } from '../componentes/Piezas.jsx'
import PantallaVerbPop from '../componentes/verbpop/PantallaVerbPop.jsx'
import { useReloj } from '../componentes/verbpop/useReloj.js'
import { useTeclado } from '../componentes/verbpop/useTeclado.js'
import { estadosDeBloques } from '../componentes/verbpop/estados.js'

// "was / were" se lee "was, were".
const paraVoz = (texto) => texto.replace(/\s*\/\s*/g, ', ')

function Ronda({ mundo, alTerminar }) {
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
  const terminada = s.fase === FASE.TERMINADA
  const ahora = useReloj(dispatch, !terminada)
  const menosMovimiento = useMenosMovimiento()
  const [columna, setColumna] = useState(1)
  const [conTeclado, setConTeclado] = useState(false)
  const [pista, setPista] = useState(null)
  const [traduccion, setTraduccion] = useState(false)
  const [cartaNueva, setCartaNueva] = useState(null)
  const [mundoCompleto, setMundoCompleto] = useState(false)
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
    const r = registrarRespuesta(progreso, pregunta.verbo, reto.acierto, delMundo)
    guardarProgreso(r.progreso)
    setProgreso(r.progreso)
    if (r.desbloqueadaAhora) setCartaNueva(pregunta.verbo)
    if (r.mundoCompletadoAhora) setMundoCompleto(true)
  }, [respondido, reto, progreso, pregunta, delMundo])

  useEffect(() => {
    if (respondido) botonSiguiente.current?.focus()
  }, [respondido])

  const responder = useCallback(
    (i) => {
      const opcion = pregunta.opciones[i]
      if (opcion === pista?.descartar) return
      setColumna(i)
      dispatch({ type: 'responder', t: ahora(), opcion })
    },
    [ahora, pregunta, pista],
  )

  // Tras la última respuesta el motor ya ha cerrado la ronda: el botón lleva al resumen.
  const siguiente = useCallback(() => {
    if (!respondido) return
    if (terminada) {
      alTerminar(s, mundoCompleto)
      return
    }
    dispatch({ type: 'siguiente', t: ahora(), pregunta: nueva(progreso, pregunta.verbo) })
    setPista(null)
    setTraduccion(false)
    setCartaNueva(null)
  }, [respondido, terminada, alTerminar, s, mundoCompleto, ahora, nueva, progreso, pregunta])

  const mover = useCallback((f) => {
    setConTeclado(true)
    setColumna(f)
  }, [])

  useTeclado({
    opciones: pregunta.opciones.length,
    columna,
    setColumna: mover,
    alResponder: responder,
    alSeguir: siguiente,
    respondido,
  })

  const estados = estadosDeBloques(s, pista?.descartar)
  const conTraduccion = pregunta.tipo === 'pasado' || pregunta.tipo === 'participio'
  const hechas = contarDesbloqueadas(progreso, delMundo)

  const centro = (
    <>
      <span className="vp__cartas">{textos.estudio.pregunta(preguntaActual(s), s.cfg.preguntasEstudio)}</span>
      <span className="vp__cartas">{textos.estudio.cartasDelMundo(hechas, delMundo.length)}</span>
      <Medidor valor={hechas / delMundo.length} etiqueta={textos.nav.cartas} ancho={240} />
    </>
  )

  const ayudas = (
    <div className="vp__ayudas">
      {!respondido && (
        <BotonRedondo
          icono="pista"
          etiqueta={textos.botones.pista}
          conEtiqueta
          onClick={() => setPista(pistaDe(pregunta, verbo))}
          disabled={pista !== null}
        />
      )}
      {!respondido && conTraduccion && (
        <BotonRedondo
          icono="traducir"
          etiqueta={textos.botones.traducir}
          conEtiqueta
          onClick={() => setTraduccion(true)}
          disabled={traduccion}
        />
      )}
      {respondido && <BotonAudio texto={paraVoz(`${verbo.verb}. ${verbo.past}. ${verbo.participle}.`)} />}
    </div>
  )

  let panel = null
  if (respondido) {
    panel = (
      <div className="tarjeta vp__resultado">
        <p className="vp__resultado-titulo">
          {reto.acierto ? textos.estudio.bien : textos.estudio.mal(pregunta.correcta)}
        </p>
        <p className="vp__resultado-formas">
          {verbo.verb} · {verbo.past} · {verbo.participle}
        </p>
        <p className="vp__resultado-es">{verbo.es}</p>
        {cartaNueva && <p className="aviso-acento">{textos.estudio.cartaNueva(cartaNueva)}</p>}
        <button ref={botonSiguiente} type="button" className="pildora pildora--pequena" onClick={siguiente}>
          {terminada ? textos.estudio.verResultado : textos.estudio.siguiente}
        </button>
      </div>
    )
  } else if (pista || traduccion) {
    panel = (
      <div className="tarjeta vp__ayuda">
        {traduccion && <p>{textos.estudio.traduccion(verbo.verb, verbo.es)}</p>}
        {pista && <p>{pista.texto}</p>}
      </div>
    )
  }

  return (
    <PantallaVerbPop
      mundo={mundo}
      atras="/estudio"
      etiqueta={textos.etiquetas[pregunta.tipo]}
      verbo={pregunta.verbo}
      claveReto={reto.aparecio}
      opciones={pregunta.opciones.map((texto, i) => ({ texto, estado: estados[i] }))}
      seleccionada={conTeclado && !respondido ? columna : null}
      altura={menosMovimiento ? s.cfg.lineaSeguraEstudio : alturaBloques(s)}
      alElegir={responder}
      centro={centro}
      ayudas={ayudas}
      panel={panel}
    />
  )
}

// Resumen de la ronda. El botón principal es "Play again", salvo cuando esta
// ronda ha completado el mundo: entonces lo es "See cards".
function Resumen({ mundo, resultado, alRepetir }) {
  const principal = useRef(null)
  useEffect(() => principal.current?.focus(), [])

  const completo = resultado.mundoCompleto === true
  const clase = (esPrincipal) => (esPrincipal ? 'pildora resumen__principal' : 'pildora pildora--pequena')
  const otraVez = (
    <button key="otra" ref={completo ? null : principal} type="button" className={clase(!completo)} onClick={alRepetir}>
      {textos.verbPop.otraVez}
    </button>
  )
  const cartas = (
    <Enlace key="cartas" ref={completo ? principal : null} a="/cartas" className={clase(completo)}>
      {textos.estudio.verCartas}
    </Enlace>
  )
  const volver = (
    <Enlace key="volver" a="/estudio" className={clase(false)}>
      {textos.estudio.volverAEstudio}
    </Enlace>
  )
  const [primero, ...secundarios] = completo ? [cartas, otraVez, volver] : [otraVez, cartas, volver]

  return (
    <PantallaMundo mundo={mundo} olas className="resultado-final resumen">
      <BarraSuperior atras="/estudio" izquierda={<Chip mundo={mundo} />} />
      {completo ? (
        <>
          <h1 className="resumen__mundo-completo">{textos.estudio.mundoCompleto(mundo)}</h1>
          <p className="resumen__subtitulo">{textos.estudio.finRonda}</p>
        </>
      ) : (
        <h1 className="titulo-grande">{textos.estudio.finRonda}</h1>
      )}
      <dl className="resultado-final__datos resultado-final__datos--uno">
        <div className="tarjeta">
          <dt>{textos.verbPop.aciertos}</dt>
          <dd>{textos.estudio.aciertosRonda(resultado.aciertos, resultado.total)}</dd>
        </div>
      </dl>
      <div className="resumen__botones">
        {primero}
        <div className="resumen__secundarios">{secundarios}</div>
      </div>
    </PantallaMundo>
  )
}

export default function EstudioVerbPop({ mundo }) {
  const [ronda, setRonda] = useState(0)
  const [resultado, setResultado] = useState(null)

  const alTerminar = useCallback((s, mundoCompleto) => {
    setResultado({ aciertos: s.aciertos, total: s.cfg.preguntasEstudio, mundoCompleto })
  }, [])

  const repetir = useCallback(() => {
    setResultado(null)
    setRonda((n) => n + 1)
  }, [])

  if (resultado) return <Resumen mundo={mundo} resultado={resultado} alRepetir={repetir} />
  return <Ronda key={ronda} mundo={mundo} alTerminar={alTerminar} />
}
