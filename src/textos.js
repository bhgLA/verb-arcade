// Todos los textos de pantalla en un único sitio.
// Para pasar la interfaz a español basta con cambiar este fichero.
export const textos = {
  titulo: 'Verb Arcade',
  nav: {
    inicio: 'Start',
    estudio: 'Study',
    reto: 'Challenge',
    cartas: 'Cards',
    ranking: 'Ranking',
  },
  pendiente: 'Coming soon',
  // Enunciados de las preguntas. En mímica el enunciado es el propio emoji.
  preguntas: {
    pasado: (verbo) => `Past of ${verbo}`,
    participio: (verbo) => `Participle of ${verbo}`,
    significado: (verbo) => `¿Qué significa "${verbo}"?`,
  },
  noEncontrada: 'Page not found',
  volver: 'Back',
}
