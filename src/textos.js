// Todos los textos de pantalla en un único sitio.
// Para pasar la interfaz a español basta con cambiar este fichero.
// Etiquetas de la interfaz en inglés y cortas; las ayudas del modo estudio, en español.
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
  noEncontrada: 'Page not found',
  volver: 'Back',
  mundo: (n) => `World ${n}`,
  fraccion: (x, total) => `${x}/${total}`,

  // Enunciados de las preguntas. En mímica el enunciado es el propio emoji.
  preguntas: {
    pasado: (verbo) => `Past of ${verbo}`,
    participio: (verbo) => `Participle of ${verbo}`,
    significado: (verbo) => `¿Qué significa "${verbo}"?`,
  },

  estudio: {
    elegirMundo: 'Elige un mundo',
    cartasDelMundo: (x, total) => `Cartas ${x}/${total}`,
    pista: 'Hint',
    escuchar: 'Listen',
    escucharAyuda: 'Escuchar en inglés',
    siguiente: 'Next',
    salir: 'Exit',
    bien: '¡Bien!',
    mal: (correcta) => `Era: ${correcta}`,
    cartaNueva: (verbo) => `¡Carta nueva: ${verbo}!`,
    traduccion: (verbo, es) => `${verbo} = ${es}`,
    mimicaPregunta: '¿Qué verbo es?',
    teclas: 'Teclas 1-4 para responder, Intro para seguir',
  },

  pistas: {
    irregular: (letra) => `Es irregular. Empieza por "${letra}".`,
    regular: 'Es regular: termina en -ed.',
    categoria: (cat) => `Tiene que ver con: ${cat}.`,
    traduccion: (es) => `En español: ${es}.`,
  },

  categorias: {
    basico: 'verbos básicos',
    cambio: 'empezar y cambiar',
    comunicacion: 'hablar con otros',
    cuerpo: 'el cuerpo',
    escuela: 'la escuela',
    mente: 'pensar y sentir',
    movimiento: 'moverse',
    objetos: 'usar cosas',
    ocio: 'jugar y divertirse',
    rutina: 'el día a día',
    sentidos: 'los sentidos',
  },

  verbPop: {
    titulo: 'Verb Pop',
    quiz: 'Quiz',
    score: 'Score',
    tiempo: 'Time',
    vidas: (n) => `${n} vidas`,
    combo: 'Combo',
    semana: (semana, mundo) => (mundo === 1 ? `${semana} · world 1` : `${semana} · worlds 1-${mundo}`),
    empezar: 'Start',
    instrucciones: 'Atrapa el bloque correcto. Tócalo o usa ← → e Intro, o 1-3.',
    finTiempo: 'Time up!',
    finVidas: 'Game over',
    puntos: 'Points',
    aciertos: 'Correct',
    mejorCombo: 'Best combo',
    seguidos: (n) => `${n} seguidos`,
    record: 'Best',
    nuevoRecord: 'New record!',
    otraVez: 'Play again',
    opcion: (n, texto) => `Opción ${n}: ${texto}`,
    cuentaAtras: 'Tiempo del bloque',
    elegirJuego: 'Choose a game',
    mimicaPronto: 'Mímica · coming soon',
  },

  cartas: {
    total: (x, total) => `${x}/${total}`,
    bloqueada: 'Carta bloqueada',
    past: 'past',
    participle: 'participle',
    cerrar: 'Close',
  },
}
