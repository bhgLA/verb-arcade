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
  // Fichas de la portada
  libro: (
    <>
      <path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5C4.7 19 4 18.3 4 17.5v-12z" />
      <path d="M20 5.5C20 4.7 19.3 4 18.5 4H13v15h5.5c.8 0 1.5-.7 1.5-1.5v-12z" />
    </>
  ),
  rayo: <path d="M13 3L5 13h6l-1 8 8-10h-6l1-8z" />,
  cartas: (
    <>
      <rect x="3" y="7" width="12" height="14" rx="2" />
      <path d="M8 4h11a2 2 0 0 1 2 2v11" />
    </>
  ),
  podio: <path d="M3 21V12h5v9M9 21V6h6v15M16 21v-9h5v9" />,
}

export default function Icono({ nombre, tam = 26, grosor = 2.6 }) {
  return (
    <svg
      aria-hidden="true"
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {TRAZOS[nombre]}
    </svg>
  )
}
