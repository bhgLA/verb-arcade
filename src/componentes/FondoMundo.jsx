// Fondo del mundo: círculos y aros con --forma y --anillo, como en la referencia.
// Con `olas`, dos franjas de arena abajo (pantallas de juego y de sesión).
export function Formas() {
  return (
    <svg className="fondo-mundo" viewBox="0 0 1366 768" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <circle className="fondo-mundo__forma" cx="130" cy="120" r="360" />
      <circle className="fondo-mundo__anillo" cx="130" cy="120" r="250" />
      <circle className="fondo-mundo__forma" cx="1280" cy="330" r="300" />
      <circle className="fondo-mundo__anillo" cx="1280" cy="330" r="190" />
      <rect className="fondo-mundo__forma" x="610" y="440" width="140" height="140" rx="40" transform="rotate(18 680 510)" />
    </svg>
  )
}

export function Olas({ className = '' }) {
  return (
    <svg className={`olas ${className}`} viewBox="0 0 1366 150" preserveAspectRatio="none" aria-hidden="true">
      <path
        className="olas__1"
        d="M0 40 Q 85 0 171 40 T 341 40 T 512 40 T 683 40 T 854 40 T 1025 40 T 1195 40 T 1366 40 L1366 150 L0 150 Z"
      />
      <path
        className="olas__2"
        d="M0 78 Q 85 40 171 78 T 341 78 T 512 78 T 683 78 T 854 78 T 1025 78 T 1195 78 T 1366 78 L1366 150 L0 150 Z"
      />
    </svg>
  )
}

export default function FondoMundo({ olas = false }) {
  return (
    <>
      <Formas />
      {olas && <Olas />}
    </>
  )
}
