import { letras } from './ajusteTexto.js'

// Opción de respuesta: un <button> real, blanco, con relieve y pastilla de tecla.
// estado: '' | 'bloqueada' | 'descartada' | 'correcta' | 'fallada' | 'apagada'
export default function Tesela({ tecla, texto, estado = '', seleccionada = false, entra = false, className = '', ...props }) {
  const clases = [
    'tesela',
    estado && `tesela--${estado}`,
    seleccionada && 'tesela--seleccionada',
    entra && 'tesela--entra',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button type="button" className={clases} {...props}>
      {tecla != null && (
        <span className="tesela__tecla" aria-hidden="true">
          {tecla}
        </span>
      )}
      <span className="tesela__texto" style={{ '--letras': letras(texto) }}>
        {texto}
      </span>
    </button>
  )
}
