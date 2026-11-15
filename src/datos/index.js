// Punto de entrada único a los datos del juego.
// El resto de la app importa de aquí y nunca de contenido/ ni de localStorage.
export { verbos, buscarVerbo, verbosDelMundo, verbosMimica } from './verbos.js'
export { idJugador } from './jugador.js'
export { leerProgreso, guardarProgreso } from './progreso.js'
export { supabaseConfigurado, llamarRpc } from './supabase.js'
export { leerRecord, guardarRecordSiMejor, leerMejorSemana, guardarMejorSemana } from './record.js'
export { leerApodo, cambiarApodo, elegirApodo, apodoElegido, apodoParaElegir, piezasDelApodo, ADJETIVOS, ANIMALES } from './apodo.js'
export { leerClase, guardarClase, comprobarClase, validarYGuardarClase, normalizarClase } from './clase.js'
export { enviarPuntuacion, leerRanking, avisarCambioPerfil, filaPropiaPendiente } from './ranking.js'
export { MOTIVOS } from './errores.js'
