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
    juegos: { verb_pop: 'Verb Pop', mimica: 'Mímica' },
    semana: (juego, n) => `${juego} · Week ${n}`,
    todos: 'Everyone',
    miClase: 'My class',
    vistas: 'Ranking view',
    tuApodo: 'Your nick',
    cargando: 'Loading…',
    vacio: 'No scores yet this week',
    sinConexion: 'El ranking no está disponible ahora.',
    // Código de clase (vista "Mi clase").
    clase: (codigo) => `Class ${codigo}`,
    campoClase: 'Class code',
    guardar: 'Save',
    comprobando: 'Checking…',
    quitar: 'Remove',
    ayudaClase: 'Pide el código de clase a tu profe.',
    codigoNoExiste: 'Ese código no existe.',
    // Ficha Ranking de la portada: el líder de la semana o una línea neutra.
    portada: {
      subtitulo: 'Top player this week',
      vacio: 'No scores yet',
      sinConexion: "See who's on top",
    },
    enviando: 'Sending to the ranking…',
    guardada: "Saved in this week's ranking",
    yaEstaba: 'Your best this week is already in the ranking',
    reintentar: 'Try again',
    // Una clave por motivo de src/datos/errores.js. En ninguno se pierde la partida:
    // el récord personal ya está guardado en el navegador.
    errores: {
      jugador: 'No hemos podido guardar la partida en el ranking. Tu récord sigue guardado aquí.',
      juego: 'Este juego todavía no tiene ranking. Tu récord sigue guardado aquí.',
      puntuacion: 'Esta puntuación no ha entrado en el ranking. Tu récord sigue guardado aquí.',
      apodo: 'Tu apodo no ha funcionado. Te hemos dado otro: vuelve a intentarlo.',
      codigoClase: 'El código de clase tiene de 2 a 8 letras o números. Revísalo.',
      claseDesconocida: 'No encontramos esa clase. Pregunta el código a tu profe.',
      limiteDiario: 'Por hoy ya has enviado todas tus partidas. Mañana puedes volver a subir.',
      muyRapido: 'Espera unos segundos y vuelve a enviarla.',
      sinConexion: 'El ranking no está disponible ahora. Tu récord sigue guardado aquí.',
      desconocido: 'Algo ha fallado con el ranking. Tu récord sigue guardado aquí.',
    },
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
    verCartas: 'See cards',
    mundoCompleto: (n) => `World ${n} complete`,
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
    seguidos: (n) => (n === 1 ? '1 acierto' : `${n} aciertos seguidos`),
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
