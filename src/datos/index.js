// Punto de entrada único a los datos del juego.
// El resto de la app importa de aquí y nunca de contenido/ ni de localStorage.
export { verbos, buscarVerbo, verbosDelMundo, verbosMimica } from './verbos.js'
export { idJugador } from './jugador.js'
export { leerProgreso, guardarProgreso } from './progreso.js'
export { supabaseConfigurado, llamarRpc } from './supabase.js'
export { leerRecord, guardarRecordSiMejor } from './record.js'
export { leerApodo, cambiarApodo, elegirApodo, piezasDelApodo, ADJETIVOS, ANIMALES } from './apodo.js'
export { leerClase, guardarClase, comprobarClase, validarYGuardarClase, normalizarClase } from './clase.js'
export { enviarPuntuacion, leerRanking, avisarCambioApodo } from './ranking.js'
export { MOTIVOS } from './errores.js'
