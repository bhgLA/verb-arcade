// Configuración del motor de preguntas. Todo lo ajustable está aquí.

export const ZONA_HORARIA = 'Europe/Madrid'

// Nombres de juego: coinciden con game_limits.game en schema.sql.
export const JUEGOS = ['verb_pop', 'mimica']

// Tipos de pregunta que entran en la secuencia de competición de cada juego.
// "significado" es solo de estudio y no aparece aquí.
export const TIPOS_POR_JUEGO = {
  verb_pop: ['pasado', 'participio'],
  mimica: ['mimica'],
}

// Número total de opciones (correcta incluida) por tipo de pregunta.
export const OPCIONES_POR_TIPO = {
  pasado: 3,
  participio: 3,
  significado: 3,
  mimica: 4,
}

// Mínimo de verbos que necesita una pool semanal.
export const MINIMO_POOL = 4

// Verbos que se confunden al representarlos: nunca salen juntos en la misma
// pregunta de Mímica. Pendiente de revisión (ver NOTAS_VERBOS.md).
export const GRUPOS_AMBIGUOS = [
  ['see', 'look', 'watch'],
  ['hear', 'listen'],
  ['talk', 'say', 'tell', 'speak', 'ask', 'call'],
  ['go', 'come', 'leave', 'walk', 'run', 'follow'],
  ['give', 'bring', 'send', 'put', 'take', 'hold'],
  ['cry', 'laugh', 'smile'],
  ['read', 'write', 'draw', 'paint'],
  ['start', 'begin', 'stop'],
  ['make', 'build', 'cook'],
  ['sit', 'stand'],
  ['buy', 'sell'],
]
