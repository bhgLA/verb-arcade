import { useVozInglesa, hablar } from '../audio.js'
import { textos } from '../textos.js'

// Si el navegador no tiene voz inglesa, el botón no aparece.
export default function BotonAudio({ texto, className = '' }) {
  const voz = useVozInglesa()
  if (!voz) return null
  return (
    <button
      type="button"
      className={`boton boton--secundario ${className}`}
      onClick={() => hablar(texto, voz)}
      aria-label={textos.estudio.escucharAyuda}
    >
      {textos.estudio.escuchar}
    </button>
  )
}
