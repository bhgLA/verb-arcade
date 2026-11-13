import { Enlace } from '../rutas.jsx'
import Icono from './Iconos.jsx'

// Botón redondo de 56 px con icono de trazo. Con `a` es un enlace; con
// `conEtiqueta` muestra el nombre debajo; `neutro` es para fondos claros.
export default function BotonRedondo({ icono, etiqueta, a, conEtiqueta = false, neutro = false, className = '', ...props }) {
  const clases = `boton-redondo ${neutro ? 'boton-redondo--neutro' : ''} ${className}`
  const contenido = (
    <>
      <span className="boton-redondo__circulo">
        <Icono nombre={icono} />
      </span>
      {conEtiqueta && (
        <span className="boton-redondo__etiqueta" aria-hidden="true">
          {etiqueta}
        </span>
      )}
    </>
  )
  if (a) {
    return (
      <Enlace a={a} className={clases} aria-label={etiqueta} {...props}>
        {contenido}
      </Enlace>
    )
  }
  return (
    <button type="button" className={clases} aria-label={etiqueta} {...props}>
      {contenido}
    </button>
  )
}
