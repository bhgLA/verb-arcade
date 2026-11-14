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

// Modo estudio: aciertos acumulados (no seguidos) que desbloquean la carta.
export const ACIERTOS_PARA_CARTA = 3

// Tipos de pregunta del modo estudio. Mímica solo si el verbo se puede mimar.
export const TIPOS_ESTUDIO = ['pasado', 'participio', 'significado', 'mimica']

// Verb Pop en estudio: los tres retos del brief ("significado" solo existe en estudio).
export const TIPOS_VERB_POP_ESTUDIO = ['pasado', 'participio', 'significado']

// Verb Pop. Tiempos en milisegundos.
export const VERB_POP = {
  duracionMs: 75_000,
  vidas: 3,
  puntosBase: 100,
  bonusMax: 50, // bonus por rapidez: 50 si se responde nada más poder, 0 al llegar al suelo
  comboCada: 3, // aciertos seguidos para subir un nivel de combo
  comboMax: 4,
  bloqueoMs: 1200, // anti-spam: un bloque nuevo no se puede responder antes de esto
  pausaMs: 800, // entre un reto y el siguiente
  caidaBaseMs: 6000, // tiempo hasta el suelo en el mundo 1
  aumentoVelocidadPorMundo: 0.06, // +6 % de velocidad por cada mundo por encima del 1
  margenServidor: 0.1, // margen sobre el máximo teórico para game_limits.max_score
  preguntasEstudio: 10, // la ronda de estudio termina al responder esta pregunta
  lineaSeguraEstudio: 0.55, // en estudio los bloques se paran aquí (0 = arriba, 1 = suelo)
}

// Verbos que se confunden al representarlos: nunca salen juntos en la misma
// pregunta de Mímica. Un verbo puede estar en varios grupos.
// Pendiente de revisión (ver NOTAS_VERBOS.md).
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
  // Por parecido de emoji
  ['like', 'love'],
  ['clean', 'wash'],
  ['look', 'find'],
  ['eat', 'cook'],
  ['help', 'meet'],
  ['catch', 'hold', 'take'],
]
