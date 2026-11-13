// Estado visual de cada bloque a partir del estado de la partida (puro).
import { sePuedeResponder } from '../../motor/partida.js'

export function estadosDeBloques(s, descartada = null) {
  const { reto } = s
  if (!reto) return []
  const { opciones, correcta } = reto.pregunta
  const terminado = reto.respuesta !== null || reto.suelo
  return opciones.map((o) => {
    if (terminado) {
      if (o === correcta) return 'correcta'
      if (o === reto.respuesta) return 'fallada'
      return 'apagada'
    }
    if (o === descartada) return 'descartada'
    return sePuedeResponder(s) ? '' : 'bloqueada'
  })
}
