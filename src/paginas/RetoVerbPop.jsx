import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { textos } from '../textos.js'
import {
  verbos,
  guardarRecordSiMejor,
  leerRecord,
  guardarMejorSemana,
  enviarPuntuacion,
  supabaseConfigurado,
  leerApodo,
  leerClase,
  elegirApodo,
  apodoElegido,
  apodoParaElegir,
  avisarCambioPerfil,
} from '../datos/index.js'
import { semanaISO, mundoDeLaSemana } from '../motor/semana.js'
import { secuenciaSemanal } from '../motor/secuencia.js'
import { crearPartida, partidaReducer, alturaBloques, tiempoRestante, FASE } from '../motor/partida.js'
import { useMenosMovimiento } from '../movimiento.js'
import { PantallaMundo, BarraSuperior } from '../componentes/Pantalla.jsx'
import { Chip } from '../componentes/Piezas.jsx'
import PantallaVerbPop from '../componentes/verbpop/PantallaVerbPop.jsx'
import { useReloj } from '../componentes/verbpop/useReloj.js'
import { useTeclado } from '../componentes/verbpop/useTeclado.js'
import { estadosDeBloques } from '../componentes/verbpop/estados.js'
import { CuerpoResultado } from '../componentes/verbpop/CuerpoResultado.js'
import { SelectorApodo } from '../componentes/ranking/SelectorApodo.js'
import { Enlace } from '../rutas.jsx'

const JUEGO = 'verb_pop'

function Partida({ preguntas, mundo, alTerminar }) {
  const [s, dispatch] = useReducer(partidaReducer, undefined, () =>
    crearPartida({ modo: 'competicion', preguntas, mundo }),
  )
  const jugando = s.fase === FASE.JUGANDO
  const ahora = useReloj(dispatch, jugando)
  const menosMovimiento = useMenosMovimiento()
  const [columna, setColumna] = useState(1)
  const [conTeclado, setConTeclado] = useState(false)
  const avisado = useRef(false)

  useEffect(() => {
    if (!jugando && !avisado.current) {
      avisado.current = true
      alTerminar(s)
    }
  }, [jugando, s, alTerminar])

  const opciones = s.reto.pregunta.opciones
  const responder = useCallback(
    (i) => {
      setColumna(i)
      dispatch({ type: 'responder', t: ahora(), opcion: opciones[i] })
    },
    [ahora, opciones],
  )
  const mover = useCallback((f) => {
    setConTeclado(true)
    setColumna(f)
  }, [])

  const respondido = s.reto.respuesta !== null || s.reto.suelo
  useTeclado({ opciones: opciones.length, columna, setColumna: mover, alResponder: responder, respondido })

  const estados = estadosDeBloques(s)
  const altura = alturaBloques(s)

  return (
    <PantallaVerbPop
      mundo={mundo}
      atras="/reto"
      reloj={{ restanteMs: tiempoRestante(s), totalMs: s.cfg.duracionMs }}
      vidas={{ quedan: s.vidas, total: s.cfg.vidas }}
      puntos={s.puntos}
      combo={s.combo}
      cuentaAtras={menosMovimiento ? 1 - altura : null}
      etiqueta={textos.etiquetas[s.reto.pregunta.tipo]}
      verbo={s.reto.pregunta.verbo}
      claveReto={s.reto.aparecio}
      opciones={opciones.map((texto, i) => ({ texto, estado: estados[i] }))}
      seleccionada={conTeclado && !respondido ? columna : null}
      altura={menosMovimiento ? 0 : altura}
      alElegir={responder}
    />
  )
}

function Resultado({ mundo, ...props }) {
  return (
    <PantallaMundo mundo={mundo} olas className="resultado-final resumen">
      <BarraSuperior atras="/reto" izquierda={<Chip mundo={mundo} />} />
      <CuerpoResultado {...props} Enlace={Enlace} />
    </PantallaMundo>
  )
}

// Primer Challenge sin apodo elegido: el selector, con el apodo generado
// preseleccionado, y "Start" guarda el apodo y empieza. Solo una vez.
function PrimerApodo({ mundo, alEmpezar }) {
  const [propuesto] = useState(() => apodoParaElegir())
  const alGuardar = (adjetivo, animal) => {
    const antes = leerApodo()
    const nuevo = elegirApodo(adjetivo, animal)
    // Si ya había enviado algo esta semana con el apodo generado, se aplica el perfil pendiente.
    if (nuevo && nuevo !== antes) avisarCambioPerfil()
    alEmpezar()
  }
  return (
    <PantallaMundo mundo={mundo} olas className="intro-juego primer-apodo">
      <BarraSuperior atras="/reto" izquierda={<Chip mundo={mundo} />} />
      <h1 className="titulo-grande">{textos.verbPop.titulo}</h1>
      <section className="tarjeta primer-apodo__tarjeta">
        <SelectorApodo apodo={propuesto} alGuardar={alGuardar} accion={textos.verbPop.empezar} />
      </section>
    </PantallaMundo>
  )
}

export default function RetoVerbPop() {
  const semana = useMemo(() => semanaISO(), [])
  const mundo = mundoDeLaSemana(semana)
  const preguntas = useMemo(() => secuenciaSemanal(verbos, JUEGO, semana), [semana])
  const [fase, setFase] = useState('intro')
  const [partida, setPartida] = useState(0)
  const [resultado, setResultado] = useState(null)
  const [envio, setEnvio] = useState(null)
  // Si llega la respuesta de una partida anterior, no pisa la de la actual.
  const ultimoEnvio = useRef(0)

  const enviar = useCallback(async (puntos) => {
    if (!supabaseConfigurado) return setEnvio(null)
    const id = ++ultimoEnvio.current
    setEnvio({ estado: 'enviando' })
    const r = await enviarPuntuacion(JUEGO, puntos)
    if (id !== ultimoEnvio.current) return
    // Apodo y clase se leen después: si el servidor rechazó el apodo, ya es el nuevo.
    if (r.ok) setEnvio({ estado: r.enviada ? 'guardada' : 'igual', apodo: leerApodo(), clase: leerClase() })
    else setEnvio({ estado: 'error', motivo: r.motivo })
  }, [])

  const alTerminar = useCallback((s) => {
    // El récord de siempre se sigue guardando: lo usan la intro y el menú de Challenge.
    guardarRecordSiMejor(JUEGO, s.puntos)
    const mejorSemana = guardarMejorSemana(JUEGO, semana, s.puntos)
    setResultado({ fase: s.fase, puntos: s.puntos, mejorSemana })
    setFase('resultado')
    enviar(s.puntos)
  }, [enviar, semana])

  const [conApodo, setConApodo] = useState(() => apodoElegido())

  const empezar = () => {
    setConApodo(true)
    ultimoEnvio.current++
    setEnvio(null)
    setPartida((n) => n + 1)
    setFase('juego')
  }

  if (fase === 'juego') return <Partida key={partida} preguntas={preguntas} mundo={mundo} alTerminar={alTerminar} />
  if (fase === 'resultado') {
    return (
      <Resultado
        mundo={mundo}
        resultado={resultado}
        envio={envio}
        alReintentar={() => enviar(resultado.puntos)}
        alRepetir={empezar}
      />
    )
  }

  if (!conApodo) return <PrimerApodo mundo={mundo} alEmpezar={empezar} />

  const record = leerRecord(JUEGO)
  return (
    <PantallaMundo mundo={mundo} olas className="intro-juego">
      <BarraSuperior atras="/reto" izquierda={<Chip mundo={mundo} />} />
      <h1 className="titulo-grande">{textos.verbPop.titulo}</h1>
      <p className="texto-mundo">{textos.verbPop.semana(semana, mundo)}</p>
      <p className="texto-mundo">{textos.verbPop.instrucciones}</p>
      {record > 0 && (
        <p className="texto-mundo">
          {textos.verbPop.record}: {textos.numero(record)}
        </p>
      )}
      <button type="button" className="pildora" onClick={empezar} autoFocus>
        {textos.verbPop.empezar}
      </button>
    </PantallaMundo>
  )
}
