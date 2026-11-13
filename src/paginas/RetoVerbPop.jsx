import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { textos } from '../textos.js'
import { verbos, guardarRecordSiMejor, leerRecord } from '../datos/index.js'
import { semanaISO, mundoDeLaSemana } from '../motor/semana.js'
import { secuenciaSemanal } from '../motor/secuencia.js'
import { crearPartida, partidaReducer, alturaBloques, tiempoRestante, FASE } from '../motor/partida.js'
import { useMenosMovimiento } from '../movimiento.js'
import Cabecera from '../componentes/Cabecera.jsx'
import Escena from '../componentes/verbpop/Escena.jsx'
import { Hud, BarraCombo } from '../componentes/verbpop/Hud.jsx'
import { useReloj } from '../componentes/verbpop/useReloj.js'
import { useTeclado } from '../componentes/verbpop/useTeclado.js'
import { estadosDeBloques } from '../componentes/verbpop/estados.js'

const JUEGO = 'verb_pop'
// Con menos movimiento los bloques se quedan a esta altura y una barra marca la cuenta atrás.
const ALTURA_QUIETA = 0.3

function Partida({ preguntas, mundo, semana, alTerminar }) {
  const [s, dispatch] = useReducer(partidaReducer, undefined, () =>
    crearPartida({ modo: 'competicion', preguntas, mundo }),
  )
  const jugando = s.fase === FASE.JUGANDO
  const ahora = useReloj(dispatch, jugando)
  const menosMovimiento = useMenosMovimiento()
  const [columna, setColumna] = useState(1)
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

  const respondido = s.reto.respuesta !== null || s.reto.suelo
  useTeclado({ opciones: opciones.length, columna, setColumna, alResponder: responder, respondido })

  const altura = alturaBloques(s)
  const atrapado = s.reto.respuesta !== null ? opciones.indexOf(s.reto.respuesta) : null

  return (
    <div className="verbpop">
      <Hud
        puntos={s.puntos}
        restante={tiempoRestante(s)}
        total={s.cfg.duracionMs}
        vidas={s.vidas}
        vidasTotal={s.cfg.vidas}
      />
      <div className="panel-reto">
        <p className="panel-reto__semana">{textos.verbPop.semana(semana, mundo)}</p>
        <h1 className="panel-reto__enunciado">{s.reto.pregunta.enunciado}</h1>
        {menosMovimiento && (
          <span
            className="barra barra--cuenta"
            role="progressbar"
            aria-label={textos.verbPop.cuentaAtras}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((1 - altura) * 100)}
          >
            <span className="barra__relleno" style={{ width: `${(1 - altura) * 100}%` }} />
          </span>
        )}
        <p className="panel-reto__puntos" aria-live="polite">
          {s.reto.acierto ? `+${s.reto.puntos}` : ''}
        </p>
      </div>
      <Escena
        opciones={opciones}
        estados={estadosDeBloques(s)}
        altura={menosMovimiento && atrapado === null ? ALTURA_QUIETA : altura}
        atrapado={atrapado}
        columna={columna}
        alElegir={responder}
      />
      <BarraCombo combo={s.combo} racha={s.racha} comboCada={s.cfg.comboCada} comboMax={s.cfg.comboMax} />
    </div>
  )
}

function Resultado({ resultado, alRepetir }) {
  const v = textos.verbPop
  return (
    <main className="pagina pagina--arriba">
      <Cabecera titulo={resultado.fase === FASE.FIN_TIEMPO ? v.finTiempo : v.finVidas} atras="/reto" />
      <dl className="resultado-final">
        <div>
          <dt>{v.puntos}</dt>
          <dd className="resultado-final__puntos">{resultado.puntos}</dd>
        </div>
        <div>
          <dt>{v.aciertos}</dt>
          <dd>{resultado.aciertos}</dd>
        </div>
        <div>
          <dt>{v.mejorCombo}</dt>
          <dd>
            x{resultado.mejorCombo} · {v.seguidos(resultado.mejorRacha)}
          </dd>
        </div>
        <div>
          <dt>{v.record}</dt>
          <dd>{resultado.record}</dd>
        </div>
      </dl>
      {resultado.nuevo && <p className="aviso-carta">{v.nuevoRecord}</p>}
      <button type="button" className="boton boton--principal" onClick={alRepetir} autoFocus>
        {v.otraVez}
      </button>
    </main>
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

  if (fase === 'juego') {
    return <Partida key={partida} preguntas={preguntas} mundo={mundo} semana={semana} alTerminar={alTerminar} />
  }
  if (fase === 'resultado') return <Resultado resultado={resultado} alRepetir={empezar} />

  const record = leerRecord(JUEGO)
  return (
    <main className="pagina pagina--arriba">
      <Cabecera titulo={textos.verbPop.titulo} atras="/reto" />
      <p className="subtitulo">{textos.verbPop.semana(semana, mundo)}</p>
      <p className="subtitulo">{textos.verbPop.instrucciones}</p>
      {record > 0 && (
        <p className="subtitulo">
          {textos.verbPop.record}: {record}
        </p>
      )}
      <button type="button" className="boton boton--principal" onClick={empezar} autoFocus>
        {textos.verbPop.empezar}
      </button>
    </main>
  )
}
