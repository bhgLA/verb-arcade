import { textos } from '../../textos.js'
import Estrellas from './Estrellas.jsx'
import Personaje from './Personaje.jsx'

// Pinta los bloques, el personaje y el suelo. No decide nada: recibe el estado ya calculado.
export default function Escena({ opciones, estados, altura, atrapado, columna, alElegir }) {
  return (
    <div className="escena">
      <Estrellas />
      <div className="carriles">
        {opciones.map((o, i) => {
          const estado = estados[i]
          return (
            <div key={o} className="carril">
              <button
                type="button"
                className={`bloque bloque--${i} ${estado ? `bloque--${estado}` : ''} ${atrapado === i ? 'bloque--atrapado' : ''}`}
                style={{ '--altura': altura }}
                onClick={() => alElegir(i)}
                disabled={estado === 'descartada' || estado === 'apagada' || estado === 'correcta' || estado === 'fallada'}
                aria-label={textos.verbPop.opcion(i + 1, o)}
              >
                <span className="bloque__tecla" aria-hidden="true">{i + 1}</span>
                <span className="bloque__texto">{o}</span>
              </button>
            </div>
          )
        })}
      </div>
      <div className="personaje" style={{ '--columna': columna }} aria-hidden="true">
        <Personaje />
      </div>
      <div className="suelo" aria-hidden="true" />
    </div>
  )
}
