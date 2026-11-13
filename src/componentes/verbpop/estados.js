// Estado visual de cada tesela a partir del estado de la partida (puro).
//   correcta  → la elegida y acertada (sube y se escala)
//   fallada   → la elegida y equivocada (se sacude)
//   solucion  → la correcta cuando se ha fallado o el bloque llegó al suelo
//   apagada   → el resto, una vez respondido
//   descartada→ tachada por la pista
//   bloqueada → aún no se puede responder (anti-spam)
import { sePuedeResponder } from '../../motor/partida.js'

export function estadosDeBloques(s, descartada = null) {
  const { reto } = s
  if (!reto) return []
  const { opciones, correcta } = reto.pregunta
  const terminado = reto.respuesta !== null || reto.suelo
  return opciones.map((o) => {
    if (terminado) {
      if (o === correcta) return reto.acierto ? 'correcta' : 'solucion'
      if (o === reto.respuesta) return 'fallada'
      return 'apagada'
    }
    if (o === descartada) return 'descartada'
    return sePuedeResponder(s) ? '' : 'bloqueada'
  })
}
