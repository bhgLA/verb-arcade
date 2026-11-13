import { crearAleatorio } from '../../motor/aleatorio.js'

// Posiciones fijas: el cielo es siempre el mismo.
const rng = crearAleatorio('estrellas')
const ESTRELLAS = Array.from({ length: 36 }, () => ({
  x: Math.round(rng() * 1000) / 10,
  y: Math.round(rng() * 700) / 10,
  grande: rng() < 0.25,
}))

export default function Estrellas() {
  return (
    <div className="estrellas" aria-hidden="true">
      {ESTRELLAS.map((e, i) => (
        <span key={i} className={`estrella ${e.grande ? 'estrella--grande' : ''}`} style={{ left: `${e.x}%`, top: `${e.y}%` }} />
      ))}
    </div>
  )
}
