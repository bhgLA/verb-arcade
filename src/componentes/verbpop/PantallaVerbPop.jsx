// Composición de Verb Pop sobre el lienzo de 1366×768 (diseno/referencia-A-reef.html).
// Solo pinta: recibe datos ya calculados (de la partida o de ejemplo) y no decide nada.
import { textos } from '../../textos.js'
import Escenario from '../Escenario.jsx'
import { Formas } from '../FondoMundo.jsx'
import BotonRedondo from '../BotonRedondo.jsx'
import Tesela from '../Tesela.jsx'
import { Chip, Medidor, Vidas, InsigniaCombo } from '../Piezas.jsx'
import { letras } from '../ajusteTexto.js'

// Caída visual: con altura 0 las teselas están donde la referencia (con su
// escalonado de 0, 46 y 18 px); con altura 1 han bajado CAIDA_PX y el
// escalonado se ha cerrado, posadas sobre la arena. La altura la da el reducer.
export const CAIDA_PX = 140
export const ESCALONES = [0, 46, 18, 32]

export function desplazamiento(indice, altura) {
  const a = Math.max(0, Math.min(1, altura))
  return (ESCALONES[indice] ?? 0) * (1 - a) + a * CAIDA_PX
}

// Fondo a sangre, como en la portada: formas en coordenadas del lienzo (sin
// recortar en sus bordes), arena repetida a todo el ancho y debajo del lienzo.
function FondoVerbPop() {
  return (
    <div className="vp-fondo" aria-hidden="true">
      <div className="vp-fondo__formas">
        <Formas />
      </div>
      <div className="vp-fondo__olas" />
      <div className="vp-fondo__arena" />
    </div>
  )
}

export default function PantallaVerbPop({
  mundo,
  atras,
  // competición (null en estudio)
  reloj = null,
  vidas = null,
  puntos = null,
  combo = null,
  cuentaAtras = null,
  // reto
  etiqueta,
  verbo,
  claveReto,
  opciones,
  seleccionada = null,
  altura = 0,
  alElegir,
  // estudio
  centro = null,
  ayudas = null,
  panel = null,
}) {
  const conPanel = panel !== null
  return (
    <Escenario mundo={mundo} className="escenario--a-sangre" fondo={<FondoVerbPop />}>
      <div className="vp">
        <header className="vp__cabecera">
          <div className="vp__grupo">
            <BotonRedondo icono="volver" etiqueta={textos.botones.volver} a={atras} />
            <Chip mundo={mundo} />
          </div>

          <div className="vp__grupo">
            {reloj ? (
              <>
                <span className="vp__reloj">{textos.verbPop.reloj(reloj.restanteMs)}</span>
                <Medidor valor={reloj.restanteMs / reloj.totalMs} etiqueta={textos.verbPop.tiempo} ancho={380} />
              </>
            ) : (
              centro
            )}
          </div>

          <div className="vp__grupo vp__grupo--derecha">
            {vidas && <Vidas quedan={vidas.quedan} total={vidas.total} />}
            {puntos !== null && (
              <div className="vp__puntos">
                <span className="vp__puntos-valor">{textos.numero(puntos)}</span>
                <span className="vp__puntos-etiqueta">{textos.verbPop.score}</span>
              </div>
            )}
            {ayudas}
          </div>
        </header>

        <section className={`vp__reto ${conPanel ? 'vp__reto--con-panel' : ''}`} aria-live="polite">
          <p className="vp__etiqueta">{etiqueta}</p>
          <h1 className="vp__verbo" style={{ '--letras': letras(verbo) }}>
            {verbo}
          </h1>
          {combo !== null && <InsigniaCombo combo={combo} className="vp__combo" />}
        </section>

        <div className="vp__opciones">
          {opciones.map((o, i) => (
            <div
              key={`${claveReto}-${o.texto}`}
              className="vp__caida"
              style={{ transform: `translateY(${desplazamiento(i, altura)}px)` }}
            >
              <Tesela
                tecla={i + 1}
                texto={o.texto}
                estado={o.estado}
                seleccionada={seleccionada === i}
                entra
                className="vp__tesela"
                onClick={() => alElegir(i)}
                disabled={['descartada', 'correcta', 'fallada', 'apagada', 'solucion'].includes(o.estado)}
                aria-label={textos.verbPop.opcion(i + 1, o.texto)}
              />
            </div>
          ))}
        </div>

        {cuentaAtras !== null && (
          <Medidor className="vp__cuenta" valor={cuentaAtras} etiqueta={textos.verbPop.cuentaAtras} ancho={380} />
        )}
        {panel && <aside className="vp__panel">{panel}</aside>}
      </div>
    </Escenario>
  )
}

// Datos de ejemplo: la composición exacta de la referencia (mundo 2, Reef).
export const EJEMPLO = {
  mundo: 2,
  atras: '/',
  reloj: { restanteMs: 38_000, totalMs: 73_000 },
  vidas: { quedan: 2, total: 3 },
  puntos: 1240,
  combo: 3,
  etiqueta: 'Past of',
  verbo: 'swim',
  claveReto: 'ejemplo',
  opciones: [
    { texto: 'swimmed', estado: '' },
    { texto: 'swam', estado: '' },
    { texto: 'swum', estado: '' },
  ],
  altura: 0,
  alElegir: () => {},
}
