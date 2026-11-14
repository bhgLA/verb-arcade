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
  numero: (n) => n.toLocaleString('en-US'),

  // Nombre de cada mundo (1-10) para los chips: "World 2: Reef".
  mundos: ['Sunrise', 'Reef', 'Grove', 'Plum', 'Lagoon', 'Berry', 'Dusk', 'Moss', 'Cocoa', 'Graphite'],
  chipMundo: (n) => `World ${n}: ${textos.mundos[n - 1]}`,
  chipSemana: (n) => `This week: ${textos.chipMundo(n)}`,

  // Portada (diseno/referencia-home-reef.html).
  inicio: {
    lema: 'The 100 most useful English verbs, one world at a time.',
    menu: 'Main menu',
    sello: 'Week',
    fichas: ['went', 'swam', 'ate'],
    estudio: {
      subtitulo: 'Learn at your own pace',
      progreso: (mundo, x, total) => `World ${mundo}: ${x} of ${total} cards`,
    },
    reto: {
      subtitulo: (semana, mundo) => (mundo === 1 ? `Week ${semana} · world 1` : `Week ${semana} · worlds 1 to ${mundo}`),
      mejor: 'All-time best',
      sinPuntos: 'No score yet',
      dias: (n) => (n === 1 ? '1 day left' : `${n} days left`),
    },
    cartas: {
      subtitulo: 'Verbs you have unlocked',
      de: (total) => `of ${total}`,
    },
    ranking: {
      vacio: 'Be the first to score',
    },
  },

  // Etiqueta pequeña encima del verbo del reto.
  etiquetas: {
    pasado: 'Past of',
    participio: 'Participle of',
    significado: '¿Qué significa?',
    mimica: '¿Qué verbo es?',
  },

  // Botones redondos (icono + nombre accesible).
  botones: {
    volver: 'Back',
    pausa: 'Pause',
    pista: 'Hint',
    escuchar: 'Listen',
    traducir: 'Translate',
    cerrar: 'Close',
  },

  ranking: {
    pronto: 'Weekly ranking · coming soon',
  },

  // Enunciados de las preguntas. En mímica el enunciado es el propio emoji.
  preguntas: {
    pasado: (verbo) => `Past of ${verbo}`,
    participio: (verbo) => `Participle of ${verbo}`,
    significado: (verbo) => `¿Qué significa "${verbo}"?`,
  },

  estudio: {
    elegirMundo: 'Choose a world',
    cartasDelMundo: (x, total) => `Cards ${x}/${total}`,
    pista: 'Hint',
    escuchar: 'Listen',
    escucharAyuda: 'Escuchar en inglés',
    siguiente: 'Next',
    pregunta: (n, total) => `Question ${n}/${total}`,
    verResultado: 'Results',
    finRonda: 'Round complete!',
    aciertosRonda: (x, total) => `${x}/${total}`,
    volverAEstudio: 'Back to Study',
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
    vidasRestantes: (n, total) => `${n} of ${total} lives left`,
    reloj: (ms) => {
      const s = Math.ceil(ms / 1000)
      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
    },
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
