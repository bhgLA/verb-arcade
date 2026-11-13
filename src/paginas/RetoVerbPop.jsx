import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { textos } from '../textos.js'
import { verbos, guardarRecordSiMejor, leerRecord } from '../datos/index.js'
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

function Resultado({ mundo, resultado, alRepetir }) {
  const v = textos.verbPop
  return (
    <PantallaMundo mundo={mundo} olas className="resultado-final">
      <BarraSuperior atras="/reto" izquierda={<Chip mundo={mundo} />} />
      <h1 className="titulo-grande">{resultado.fase === FASE.FIN_TIEMPO ? v.finTiempo : v.finVidas}</h1>
      <dl className="resultado-final__datos">
        <div className="tarjeta">
          <dt>{v.puntos}</dt>
          <dd>{textos.numero(resultado.puntos)}</dd>
        </div>
        <div className="tarjeta">
          <dt>{v.aciertos}</dt>
          <dd>{resultado.aciertos}</dd>
        </div>
        <div className="tarjeta">
          <dt>{v.mejorCombo}</dt>
          <dd>x{resultado.mejorCombo}</dd>
          <dd className="resultado-final__extra">{v.seguidos(resultado.mejorRacha)}</dd>
        </div>
        <div className="tarjeta">
          <dt>{v.record}</dt>
          <dd>{textos.numero(resultado.record)}</dd>
        </div>
      </dl>
      {resultado.nuevo && <p className="aviso-acento">{v.nuevoRecord}</p>}
      <button type="button" className="pildora" onClick={alRepetir} autoFocus>
        {v.otraVez}
      </button>
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

  const alTerminar = useCallback((s) => {
    const { record, nuevo } = guardarRecordSiMejor(JUEGO, s.puntos)
    setResultado({
      fase: s.fase,
      puntos: s.puntos,
      aciertos: s.aciertos,
      mejorCombo: s.mejorCombo,
      mejorRacha: s.mejorRacha,
      record,
      nuevo,
    })
    setFase('resultado')
  }, [])

  const empezar = () => {
    setPartida((n) => n + 1)
    setFase('juego')
  }

  if (fase === 'juego') return <Partida key={partida} preguntas={preguntas} mundo={mundo} alTerminar={alTerminar} />
  if (fase === 'resultado') return <Resultado mundo={mundo} resultado={resultado} alRepetir={empezar} />

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
