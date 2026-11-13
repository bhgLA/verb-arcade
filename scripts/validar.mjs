// Comprueba src/contenido/verbos.json. Uso: npm run validar [-- otra/ruta.json]
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RUTA = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL('../src/contenido/verbos.json', import.meta.url))
const TOTAL = 100
const MUNDOS = 10
const POR_MUNDO = 10

const TEXTO = ['verb', 'es', 'past', 'participle', 'category', 'cambridge_level']
const BOOLEANO = ['irregular', 'mimica']

const errores = []
const avisos = []

let datos
try {
  datos = JSON.parse(readFileSync(RUTA, 'utf8'))
} catch (e) {
  console.error(`No se puede leer ${RUTA}: ${e.message}`)
  process.exit(1)
}

const lista = datos?.verbs
if (!Array.isArray(lista)) {
  console.error('Falta el array "verbs" en la raíz del fichero.')
  process.exit(1)
}

if (lista.length !== TOTAL) errores.push(`Hay ${lista.length} verbos; deben ser ${TOTAL}.`)

const vistos = new Map()
const porMundo = new Map()

lista.forEach((v, i) => {
  const id = `#${i + 1} (${v?.verb ?? '¿sin verb?'})`

  for (const c of TEXTO) {
    if (typeof v[c] !== 'string' || v[c].trim() === '') errores.push(`${id}: "${c}" vacío o ausente.`)
  }
  for (const c of BOOLEANO) {
    if (typeof v[c] !== 'boolean') errores.push(`${id}: "${c}" debe ser true o false.`)
  }
  // null = verbo añadido a mano, fuera del top 100 de frecuencia.
  const f = v.freq_rank_top100
  if (f === undefined) {
    errores.push(`${id}: falta "freq_rank_top100" (null si no está en el top 100).`)
  } else if (f !== null && !(Number.isInteger(f) && f >= 1 && f <= 100)) {
    errores.push(`${id}: "freq_rank_top100" debe ser null o un entero de 1 a 100.`)
  }

  if (!Number.isInteger(v.world) || v.world < 1 || v.world > MUNDOS) {
    errores.push(`${id}: "world" debe ser un entero de 1 a ${MUNDOS} (es ${JSON.stringify(v.world)}).`)
  } else {
    porMundo.set(v.world, (porMundo.get(v.world) ?? 0) + 1)
  }

  if (v.mimica === true && (typeof v.emoji !== 'string' || v.emoji.trim() === '')) {
    errores.push(`${id}: tiene mimica: true pero no tiene emoji.`)
  }

  if (typeof v.verb === 'string') {
    const clave = v.verb.trim().toLowerCase()
    if (vistos.has(clave)) errores.push(`${id}: verbo repetido (ya aparece en #${vistos.get(clave)}).`)
    else vistos.set(clave, i + 1)
  }
})

for (let m = 1; m <= MUNDOS; m++) {
  const n = porMundo.get(m) ?? 0
  if (n !== POR_MUNDO) errores.push(`Mundo ${m}: tiene ${n} verbos; deben ser ${POR_MUNDO}.`)
}

// Dos verbos con el mismo emoji darían dos respuestas válidas en Mímica.
const porEmoji = new Map()
for (const v of lista) {
  if (typeof v.emoji === 'string' && v.emoji.trim() !== '') {
    porEmoji.set(v.emoji, [...(porEmoji.get(v.emoji) ?? []), v.verb])
  }
}
for (const [emoji, vs] of porEmoji) {
  if (vs.length > 1) errores.push(`emoji ${emoji} repetido: ${vs.join(', ')}.`)
}

// Avisos que no bloquean: posibles erratas para revisar a mano.
for (const v of lista) {
  const formasRegulares = v.past === v.participle && /ed$/.test(v.past ?? '')
  if (v.irregular === true && formasRegulares) {
    avisos.push(`"${v.verb}" está marcado irregular pero sus formas son regulares (${v.past}).`)
  }
}
for (const a of avisos) console.warn(`aviso: ${a}`)

if (errores.length) {
  console.error(`verbos.json tiene ${errores.length} problema(s):`)
  for (const e of errores) console.error(`  - ${e}`)
  process.exit(1)
}

const conMimica = lista.filter((v) => v.mimica).length
console.log(`verbos.json correcto: ${lista.length} verbos, ${MUNDOS} mundos de ${POR_MUNDO}, ${conMimica} con mímica.`)
