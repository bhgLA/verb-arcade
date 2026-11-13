// Iconos de trazo (24×24), heredan el color con currentColor.
const TRAZOS = {
  volver: <path d="M15 5l-7 7 7 7" />,
  pausa: (
    <>
      <path d="M9 5v14" />
      <path d="M15 5v14" />
    </>
  ),
  pista: (
    <>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
    </>
  ),
  escuchar: (
    <>
      <path d="M4 10v4h4l5 4V6L8 10H4z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 6a8.5 8.5 0 0 1 0 12" />
    </>
  ),
  traducir: (
    <>
      <path d="M4 5h9" />
      <path d="M8.5 3v2" />
      <path d="M11 5c-1 4-3.5 7-7 9" />
      <path d="M6.5 9c1 2 2.8 3.6 5 4.5" />
      <path d="M13 21l4-9 4 9" />
      <path d="M14.5 18h5" />
    </>
  ),
  cerrar: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
}

export default function Icono({ nombre, tam = 26 }) {
  return (
    <svg
      aria-hidden="true"
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {TRAZOS[nombre]}
    </svg>
  )
}
