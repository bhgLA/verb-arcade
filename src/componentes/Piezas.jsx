// Piezas pequeñas del sistema: chip, medidor, vidas, insignia de combo y emoji.
import { textos } from '../textos.js'

export function Chip({ mundo, children }) {
  return <span className="chip">{children ?? textos.chipMundo(mundo)}</span>
}

// Medidor de tiempo o progreso: pista negra al 25 %, relleno --acento.
export function Medidor({ valor, etiqueta, ancho, className = '' }) {
  const v = Math.max(0, Math.min(1, valor))
  return (
    <span
      className={`medidor ${className}`}
      style={ancho ? { width: ancho } : undefined}
      role="progressbar"
      aria-label={etiqueta}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
    >
      <span className="medidor__relleno" style={{ width: `${v * 100}%` }} />
    </span>
  )
}

const CORAZON =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'

export function Vidas({ quedan, total }) {
  return (
    <div className="vidas" role="img" aria-label={textos.verbPop.vidasRestantes(quedan, total)}>
      {Array.from({ length: total }, (_, i) => (
        <svg
          key={i}
          className={`vidas__corazon ${i < quedan ? 'vidas__corazon--lleno' : 'vidas__corazon--perdido'}`}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d={CORAZON} />
        </svg>
      ))}
    </div>
  )
}

export function InsigniaCombo({ combo, className = '' }) {
  return (
    <div className={`insignia-combo ${className}`}>
      <span className="insignia-combo__valor">x{combo}</span>
      <span className="insignia-combo__etiqueta">{textos.verbPop.combo}</span>
    </div>
  )
}

// Emoji en círculo --clave. Los verbos sin emoji muestran su inicial.
export function EmojiCirculo({ verbo, tam = 88 }) {
  return (
    <span className="emoji-circulo" style={{ '--tam': `${tam}px` }} aria-hidden="true">
      {verbo.emoji ? (
        <span className="emoji-circulo__emoji">{verbo.emoji}</span>
      ) : (
        <span className="emoji-circulo__letra">{verbo.verb.charAt(0).toUpperCase()}</span>
      )}
    </span>
  )
}
