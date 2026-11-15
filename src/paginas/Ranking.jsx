import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { textos } from '../textos.js'
import { leerApodo, elegirApodo, avisarCambioApodo, leerClase, guardarClase, validarYGuardarClase } from '../datos/index.js'
import { semanaISO, mundoDeLaSemana, numeroDeSemana } from '../motor/semana.js'
import { PantallaMundo, BarraSuperior } from '../componentes/Pantalla.jsx'
import { Chip } from '../componentes/Piezas.jsx'
import { CuerpoRanking } from '../componentes/ranking/CuerpoRanking.js'
import { SelectorApodo } from '../componentes/ranking/SelectorApodo.js'
import { CARGANDO, VISTA, cargarVista } from '../componentes/ranking/estado.js'

const r = textos.ranking

// Al teclear: mayúsculas y sin espacios. El resto lo valida el servidor con class_exists.
const limpiarAlTeclear = (texto) => texto.toUpperCase().replace(/\s+/g, '')

function CampoClase({ alGuardar }) {
  const [codigo, setCodigo] = useState('')
  const [comprobando, setComprobando] = useState(false)
  const [error, setError] = useState(null)

  const enviar = async (e) => {
    e.preventDefault()
    if (!codigo || comprobando) return
    setComprobando(true)
    setError(null)
    const res = await validarYGuardarClase(codigo)
    setComprobando(false)
    if (res.ok) return alGuardar(res.clase)
    setError(
      res.motivo === 'claseDesconocida' ? r.codigoNoExiste
      : res.motivo === 'codigoClase' ? r.errores.codigoClase
      : r.sinConexion,
    )
  }

  return (
    <form className="campo-clase" onSubmit={enviar}>
      <label className="campo-clase__etiqueta" htmlFor="campo-clase">
        {r.campoClase}
      </label>
      <div className="campo-clase__fila">
        <input
          id="campo-clase"
          className="campo-clase__entrada"
          value={codigo}
          onChange={(e) => {
            setCodigo(limpiarAlTeclear(e.target.value))
            setError(null)
          }}
          maxLength={8}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          enterKeyHint="done"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby="campo-clase-ayuda"
        />
        <button type="submit" className="pildora pildora--pequena pildora--acento" disabled={!codigo || comprobando}>
          {comprobando ? r.comprobando : r.guardar}
        </button>
      </div>
      {/* Una sola línea: la ayuda, o el error en su lugar. */}
      <p id="campo-clase-ayuda" className={`ranking__linea ${error ? 'ranking__linea--error' : ''}`} role={error ? 'alert' : undefined}>
        {error ?? r.ayudaClase}
      </p>
    </form>
  )
}

// juego: 'verb_pop' por ahora; Mímica entrará con la misma pantalla.
export default function Ranking({ juego = 'verb_pop' }) {
  const semana = useMemo(() => semanaISO(), [])
  const mundo = mundoDeLaSemana(semana)
  const [apodo, setApodo] = useState(() => leerApodo())
  const [eligiendo, setEligiendo] = useState(false)
  const botonCambiar = useRef(null)
  const [vista, setVista] = useState(VISTA.TODOS)
  const [clase, setClase] = useState(() => leerClase())
  const [estado, setEstado] = useState(CARGANDO)
  // Si el niño cambia de pestaña antes de que llegue la respuesta, la vieja no pisa la nueva.
  const peticion = useRef(0)

  const cargar = useCallback(async () => {
    const id = ++peticion.current
    setEstado(CARGANDO)
    const nuevo = await cargarVista(juego, vista, clase)
    if (id === peticion.current) setEstado(nuevo)
  }, [juego, vista, clase])

  useEffect(() => {
    cargar()
  }, [cargar])

  const cerrarSelector = () => {
    setEligiendo(false)
    requestAnimationFrame(() => botonCambiar.current?.focus())
  }

  // Sin avisos: si el reenvío sale, la lista se recarga con el apodo nuevo;
  // si no, queda pendiente para la próxima partida de Challenge.
  const guardarApodo = async (adjetivo, animal) => {
    const nuevo = elegirApodo(adjetivo, animal)
    cerrarSelector()
    if (!nuevo || nuevo === apodo) return
    setApodo(nuevo)
    const { reenviados } = await avisarCambioApodo()
    if (reenviados.length > 0) cargar()
  }

  const quitarClase = () => {
    guardarClase('')
    setClase(null)
  }

  const pestana = (v, etiqueta) => (
    <button
      type="button"
      role="tab"
      aria-selected={vista === v}
      className={`pestanas__boton ${vista === v ? 'pestanas__boton--activa' : ''}`}
      onClick={() => setVista(v)}
    >
      {etiqueta}
    </button>
  )

  return (
    <PantallaMundo mundo={mundo} className="ranking">
      <BarraSuperior
        izquierda={<Chip mundo={mundo} />}
        derecha={
          <div className="ranking__apodo">
            <p>
              {r.tuApodo}: <strong>{apodo}</strong>
            </p>
            {!eligiendo && (
              <button ref={botonCambiar} type="button" className="ranking__cambiar" onClick={() => setEligiendo(true)}>
                {r.cambiarApodo}
              </button>
            )}
          </div>
        }
      />
      <div className="ranking__cabecera">
        <h1 className="ranking__titulo">{textos.nav.ranking}</h1>
        <div className="pestanas" role="tablist" aria-label={r.vistas}>
          {pestana(VISTA.TODOS, r.todos)}
          {pestana(VISTA.CLASE, r.miClase)}
        </div>
      </div>

      {eligiendo ? (
        <section className="tarjeta ranking__tarjeta">
          <SelectorApodo apodo={apodo} alGuardar={guardarApodo} alCancelar={cerrarSelector} />
        </section>
      ) : (
      <section className="tarjeta ranking__tarjeta" role="tabpanel" aria-label={vista === VISTA.CLASE ? r.miClase : r.todos}>
        {estado.fase !== 'sinClase' && (
        <div className="ranking__tarjeta-cabecera">
          <h2 className="ranking__subtitulo">{r.semana(r.juegos[juego] ?? juego, numeroDeSemana(semana))}</h2>
          {vista === VISTA.CLASE && clase && (
            <span className="ranking__clase">
              {r.clase(clase)}
              <button type="button" className="ranking__quitar" onClick={quitarClase}>
                {r.quitar}
              </button>
            </span>
          )}
        </div>
        )}
        {estado.fase === 'sinClase' ? (
          <CampoClase alGuardar={setClase} />
        ) : (
          <CuerpoRanking estado={estado} miApodo={apodo} alReintentar={cargar} />
        )}
      </section>
      )}
    </PantallaMundo>
  )
}
