// Contraste WCAG de los colores del juego. Uso: npm run contraste
//
// Falla si:
//   1. el blanco sobre --fondo de algún mundo baja de 4,5:1;
//   2. --tinta sobre blanco baja de 7:1 en algún mundo;
//   3. un texto de menos de 24 px usa un color que no sea blanco puro, tinta
//      o el texto neutro (regla: el texto pequeño sobre el fondo del mundo es
//      siempre blanco puro; los tonos suaves solo en textos grandes);
//   4. otras parejas que usa la interfaz no llegan a su mínimo (chip, tecla,
//      combo, pantallas neutras, carta bloqueada, blanco suave en textos grandes,
//      fichas de la portada).
// Los colores secundarios de la portada y el amarillo de la píldora valen en
// texto pequeño porque sus parejas se comprueban aquí abajo.
// Avisa (sin fallar) si el blanco sobre los círculos (--forma) baja de 4,5.
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const DIR = fileURLToPath(new URL('../src/estilos/', import.meta.url))
const DIR_SRC = fileURLToPath(new URL('../src/', import.meta.url))
const leer = (f) => readFileSync(join(DIR, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

// --- Colores -------------------------------------------------------------------

function variables(bloque) {
  const v = {}
  for (const m of bloque.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) v[m[1]] = m[2].trim()
  return v
}

function aRgba(valor) {
  const hex = /^#([0-9a-f]{6})$/i.exec(valor)
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)).concat(1)
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*(?:[/,]\s*([\d.]+))?\s*\)$/i.exec(valor)
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), rgb[4] === undefined ? 1 : Number(rgb[4])]
  throw new Error(`Color que no sé leer: ${valor}`)
}

// Mezcla un color con transparencia sobre un fondo opaco.
function sobre(color, fondo) {
  const [r, g, b, a] = aRgba(color)
  const [fr, fg, fb] = aRgba(fondo)
  return [r * a + fr * (1 - a), g * a + fg * (1 - a), b * a + fb * (1 - a)]
}

function luminancia([r, g, b]) {
  const c = [r, g, b].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}

function contraste(texto, fondo) {
  const a = luminancia(sobre(texto, fondo))
  const b = luminancia(sobre(fondo, fondo))
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

const tokens = variables(/:root\s*\{([^}]*)\}/.exec(leer('tokens.css'))[1])
const mundos = {}
for (const m of leer('mundos.css').matchAll(/\[data-mundo='(\d+)'\]\s*\{([^}]*)\}/g)) mundos[m[1]] = variables(m[2])

const errores = []
const avisos = []
const filas = []

const NOMBRES = ['Sunrise', 'Reef', 'Grove', 'Plum', 'Lagoon', 'Berry', 'Dusk', 'Moss', 'Cocoa', 'Graphite']
if (Object.keys(mundos).length !== 10) errores.push(`mundos.css define ${Object.keys(mundos).length} mundos; deben ser 10.`)

function exigir(nombre, texto, fondo, minimo) {
  const c = contraste(texto, fondo)
  if (c < minimo) errores.push(`${nombre}: ${c.toFixed(2)}:1 (mínimo ${minimo}:1)`)
  return c
}

const { blanco, suave, acento, arena, neutro, texto, bloqueada } = tokens
exigir('texto neutro sobre fondo neutro', texto, neutro, 4.5)
exigir('"?" de carta bloqueada (texto grande)', tokens['bloqueada-texto'], bloqueada, 3)
exigir('portada: --secundario sobre blanco', tokens.secundario, blanco, 4.5)
exigir('portada: --secundario-acento sobre --acento', tokens['secundario-acento'], acento, 4.5)

for (const [n, m] of Object.entries(mundos)) {
  const nombre = `Mundo ${n} (${NOMBRES[n - 1]})`
  const fila = {
    mundo: nombre,
    'blanco/fondo': exigir(`${nombre}: blanco sobre --fondo`, blanco, m.fondo, 4.5),
    'tinta/blanco': exigir(`${nombre}: --tinta sobre blanco`, m.tinta, blanco, 7),
    'tinta/arena': exigir(`${nombre}: chip (--tinta sobre arena)`, m.tinta, arena, 4.5),
    'tinta/clave': exigir(`${nombre}: tecla (--tinta sobre --clave)`, m.tinta, m.clave, 4.5),
    'tinta/acento': exigir(`${nombre}: combo (--tinta sobre acento)`, m.tinta, acento, 4.5),
    'tinta/tinte': exigir(`${nombre}: portada (--tinta sobre --tinte-claro)`, m.tinta, tokens['tinte-claro'], 4.5),
    'acento/tinta': exigir(`${nombre}: píldora de días (acento sobre --tinta)`, acento, m.tinta, 4.5),
    'suave/fondo': exigir(`${nombre}: blanco suave sobre --fondo (texto grande)`, suave, m.fondo, 3),
    'blanco/forma': contraste(blanco, m.forma),
  }
  exigir(`${nombre}: blanco suave sobre --forma (texto grande)`, suave, m.forma, 3)
  if (fila['blanco/forma'] < 4.5) {
    avisos.push(`${nombre}: blanco sobre los círculos (--forma) da ${fila['blanco/forma'].toFixed(2)}:1; evita texto pequeño encima.`)
  }
  filas.push(fila)
}

// --- Texto pequeño: solo blanco puro, tinta o texto neutro -------------------

const SEGUROS = new Set([
  'var(--blanco)',
  'var(--tinta)',
  'var(--texto)',
  'var(--secundario)',
  'var(--secundario-acento)',
  'var(--acento)',
  'inherit',
  'currentcolor',
  'transparent',
])

function tamañoPx(valor) {
  if (!valor) return null
  const v = valor.trim()
  const px = /^([\d.]+)px$/.exec(v)
  if (px) return Number(px[1])
  const rem = /^([\d.]+)rem$/.exec(v)
  if (rem) return Number(rem[1]) * 16
  const clamp = /^clamp\(\s*([\d.]+)(px|rem)/.exec(v)
  if (clamp) return Number(clamp[1]) * (clamp[2] === 'rem' ? 16 : 1)
  return null // min(), calc(), em…: no se puede asegurar
}

for (const fichero of readdirSync(DIR).filter((f) => f.endsWith('.css'))) {
  const css = leer(fichero)
  for (const regla of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = regla[1].trim().replace(/\s+/g, ' ')
    const decl = regla[2]
    const color = /(?:^|[;\s])color\s*:\s*([^;]+);/.exec(decl)?.[1].trim().toLowerCase()
    if (!color || SEGUROS.has(color)) continue
    const tam = tamañoPx(/font-size\s*:\s*([^;]+);/.exec(decl)?.[1])
    if (tam === null || tam < 24) {
      errores.push(
        `${fichero} › ${selector}: color ${color} en texto de ${tam === null ? 'tamaño sin declarar' : `${tam}px`}. Debajo de 24 px solo vale blanco puro o tinta.`,
      )
    }
  }
}

// Ningún color de texto escrito a mano en los componentes.
function revisarJsx(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const ruta = join(dir, e.name)
    if (e.isDirectory()) revisarJsx(ruta)
    else if (e.name.endsWith('.jsx') && /[{,]\s*color\s*:/.test(readFileSync(ruta, 'utf8'))) {
      errores.push(`${ruta.replace(DIR_SRC, 'src/')}: color escrito en un style; usa las clases de src/estilos/.`)
    }
  }
}
revisarJsx(DIR_SRC)

// --- Informe ---------------------------------------------------------------------

console.table(
  filas.map((f) =>
    Object.fromEntries(Object.entries(f).map(([k, v]) => [k, typeof v === 'number' ? Number(v.toFixed(2)) : v])),
  ),
)
for (const a of avisos) console.warn(`aviso: ${a}`)
if (errores.length) {
  console.error(`\nContraste: ${errores.length} problema(s):`)
  for (const e of errores) console.error(`  - ${e}`)
  process.exit(1)
}
console.log('\nContraste correcto en los 10 mundos.')
