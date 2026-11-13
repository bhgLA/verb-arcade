import { textos } from '../../textos.js'
import Corazones from './Corazones.jsx'

export function Hud({ puntos, restante, total, vidas, vidasTotal }) {
  return (
    <div className="hud">
      <div className="hud__score">
        <span className="hud__etiqueta">{textos.verbPop.score}</span>
        <span className="hud__valor">{String(puntos).padStart(5, '0')}</span>
      </div>
      <div className="hud__tiempo">
        <span className="hud__etiqueta">{textos.verbPop.tiempo}</span>
        <span className="barra barra--tiempo" role="progressbar" aria-valuemin={0} aria-valuemax={Math.round(total / 1000)} aria-valuenow={Math.ceil(restante / 1000)}>
          <span className="barra__relleno" style={{ width: `${(restante / total) * 100}%` }} />
        </span>
      </div>
      <Corazones vidas={vidas} total={vidasTotal} />
    </div>
  )
}

export function BarraCombo({ combo, racha, comboCada, comboMax }) {
  const enNivel = combo >= comboMax ? comboCada : racha % comboCada
  return (
    <div className="combo">
      <span className="combo__etiqueta">{textos.verbPop.combo}</span>
      <span className={`combo__valor combo__valor--${combo}`}>x{combo}</span>
      <span className="combo__puntos" aria-hidden="true">
        {Array.from({ length: comboCada }, (_, i) => (
          <span key={i} className={`combo__punto ${i < enNivel ? 'combo__punto--lleno' : ''}`} />
        ))}
      </span>
    </div>
  )
}
