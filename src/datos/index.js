// Punto de entrada único a los datos del juego.
// El resto de la app importa de aquí y nunca de contenido/ ni de localStorage.
export { verbos, buscarVerbo, verbosDelMundo, verbosMimica } from './verbos.js'
export { idJugador } from './jugador.js'
export { leerProgreso, guardarProgreso } from './progreso.js'
export { supabaseConfigurado, llamarRpc } from './supabase.js'
export { leerRecord, guardarRecordSiMejor } from './record.js'
