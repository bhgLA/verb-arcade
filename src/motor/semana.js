// Semana ISO en hora de Madrid, igual que current_week() en schema.sql
// (to_char(now() at time zone 'Europe/Madrid', 'IYYY-"W"IW')).
import { ZONA_HORARIA, JUEGOS, MINIMO_POOL } from './config.js'

const DIA_MS = 86_400_000
const FORMATO_SEMANA = /^(\d{4})-W(\d{2})$/

const formateador = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

// Fecha de calendario (año, mes, día) que se ve en Madrid en ese instante.
function fechaEnMadrid(fecha) {
  const partes = Object.fromEntries(
    formateador.formatToParts(fecha).filter((p) => p.type !== 'literal').map((p) => [p.type, Number(p.value)]),
  )
  return { año: partes.year, mes: partes.month, dia: partes.day }
}

function comprobarFecha(fecha, quien) {
  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) {
    throw new Error(`${quien}: hace falta una fecha válida.`)
  }
}

// Día de Madrid como instante UTC a medianoche y día de la semana (lunes = 0).
function diaEnMadrid(fecha) {
  const { año, mes, dia } = fechaEnMadrid(fecha)
  const t = Date.UTC(año, mes - 1, dia)
  return { t, diaSemana: (new Date(t).getUTCDay() + 6) % 7 }
}

export function semanaISO(fecha = new Date()) {
  comprobarFecha(fecha, 'semanaISO')
  const { t, diaSemana } = diaEnMadrid(fecha)
  // La semana ISO es la del jueves de esa misma semana.
  const jueves = t + (3 - diaSemana) * DIA_MS
  const añoISO = new Date(jueves).getUTCFullYear()
  const numero = 1 + Math.floor((jueves - Date.UTC(añoISO, 0, 1)) / DIA_MS / 7)
  return `${añoISO}-W${String(numero).padStart(2, '0')}`
}

// Días que faltan para el próximo lunes en Madrid, cuando empieza otra semana:
// el lunes da 7 y el domingo 1.
export function diasHastaElLunes(fecha = new Date()) {
  comprobarFecha(fecha, 'diasHastaElLunes')
  return 7 - diaEnMadrid(fecha).diaSemana
}

export function numeroDeSemana(semana) {
  const m = FORMATO_SEMANA.exec(semana ?? '')
  const n = m ? Number(m[2]) : NaN
  if (!m || n < 1 || n > 53) throw new Error(`Semana no válida: "${semana}" (formato 2026-W46).`)
  return n
}

export function mundoDeLaSemana(semana) {
  return (numeroDeSemana(semana) % 10) + 1
}

// Verbos de los mundos 1..mundoDeLaSemana (acumulado).
export function poolDeLaSemana(verbos, semana, juego) {
  if (!JUEGOS.includes(juego)) throw new Error(`Juego desconocido: "${juego}".`)
  const mundo = mundoDeLaSemana(semana)
  let pool = verbos.filter((v) => v.world >= 1 && v.world <= mundo)
  if (juego === 'mimica') pool = pool.filter((v) => v.mimica === true)
  if (pool.length < MINIMO_POOL) {
    throw new Error(
      `La pool de ${juego} en ${semana} (mundos 1-${mundo}) tiene ${pool.length} verbos; hacen falta al menos ${MINIMO_POOL}.`,
    )
  }
  return pool
}
