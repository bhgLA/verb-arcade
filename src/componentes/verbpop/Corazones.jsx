import Pixeles from './Pixeles.jsx'
import { textos } from '../../textos.js'

const CORAZON = ['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...']
const LLENO = { R: '#FF4D6D' }
const VACIO = { R: '#3B2F7F' }

export default function Corazones({ vidas, total }) {
  return (
    <div className="corazones" role="img" aria-label={textos.verbPop.vidas(vidas)}>
      {Array.from({ length: total }, (_, i) => (
        <Pixeles key={i} filas={CORAZON} colores={i < vidas ? LLENO : VACIO} className="corazon" />
      ))}
    </div>
  )
}
