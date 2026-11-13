import { useVozInglesa, hablar } from '../audio.js'
import { textos } from '../textos.js'
import BotonRedondo from './BotonRedondo.jsx'

// Si el navegador no tiene voz inglesa, el botón no aparece.
export default function BotonAudio({ texto, conEtiqueta = true, neutro = false }) {
  const voz = useVozInglesa()
  if (!voz) return null
  return (
    <BotonRedondo
      icono="escuchar"
      etiqueta={textos.botones.escuchar}
      conEtiqueta={conEtiqueta}
      neutro={neutro}
      onClick={() => hablar(texto, voz)}
    />
  )
}
