// Traduce lo que devuelve Supabase a un motivo corto que la interfaz sabe explicar.
// Los mensajes de submit_score salen del comentario sobre la función en supabase/schema.sql.
// Los textos para el niño están en textos.ranking.errores, con la misma clave.
const POR_MENSAJE = {
  'invalid player': 'jugador',
  'unknown game': 'juego',
  'invalid score': 'puntuacion',
  'invalid nick': 'apodo',
  'invalid class code': 'codigoClase',
  'unknown class': 'claseDesconocida',
  'daily limit': 'limiteDiario',
  'too fast': 'muyRapido',
}

export const MOTIVOS = [...new Set(Object.values(POR_MENSAJE)), 'sinConexion', 'desconocido']

// resultado: lo que devuelve llamarRpc cuando ok es false.
export function motivoDeError(resultado) {
  const mensaje = (resultado?.mensaje ?? '').trim().toLowerCase()
  if (POR_MENSAJE[mensaje]) return POR_MENSAJE[mensaje]
  const motivo = resultado?.motivo ?? ''
  // Sin configurar, sin red, tiempo agotado o servidor caído: para el niño es lo mismo.
  if (motivo === 'sin-config' || motivo === 'sin-conexion' || /^http-(5\d\d|0|404|408|429)$/.test(motivo)) {
    return 'sinConexion'
  }
  return 'desconocido'
}
