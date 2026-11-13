# Brief: Verb Arcade (verbos en inglés, 5.º-6.º de Primaria)

## Qué es
Juego web de verbos en inglés para niños de 10-12 años, con estética arcade pixel, dos modos (estudio y competición) y ranking semanal en Supabase. Proyecto independiente (Vite + React, despliegue en Vercel), pensado para poder enlazarse o montarse después bajo una landing de Henar junto a La Verbena y el analizador de verbos. No toca el repo de La Verbena.

Dispositivos: portátil de cada niño y pizarra táctil (1366×768 a 1920). Tocar y ratón son requisito; teclado como extra. Móvil: que no se rompa, sin diseño específico.

## Datos
- `src/contenido/verbos.json`: 100 verbos. Estructura en el propio fichero (`verbs[]` con `verb, es, past, participle, irregular, category, cambridge_level, freq_rank_top100, world, mimica, emoji`).
- No cambiar la lista, ni formas verbales, ni traducciones sin preguntar a Bego. Si crees que hay un error, anótalo en `NOTAS_VERBOS.md` y sigue.
- `world` (1-10) agrupa de 10 en 10 por orden de aprendizaje.
- `be` y `let` van los primeros a propósito (son lo primero que aprenden). `be` tiene `past: "was / were"`: mostrarlo tal cual y tratarlo como UNA sola opción en el reto "past of X"; no se puede mimar (`mimica: false`) ni tiene emoji.
- `mimica: false` = no se puede dibujar o actuar con claridad: ese verbo solo sale en Verb Pop, nunca en Mímica.
- `emoji` es provisional (relleno hasta tener sprites pixel). Mostrarlo dentro de un marco pixel tipo cartucho.
- Crear `npm run validar`: 100 verbos únicos, campos obligatorios, `past` y `participle` no vacíos, `world` 1-10 con 10 verbos cada uno, cada `mimica: true` con `emoji`.

## Modos
**Estudio (relajado):** sin tiempo, sin vidas, sin ranking. Mismos juegos con ayudas: audio (Web Speech API, voz en-GB, solo al pulsar), traducción visible, pistas. Cada verbo acertado 3 veces desbloquea su carta (verbo, traducción, past, participle, emoji, categoría). Pantalla "Mis cartas" con las desbloqueadas y las bloqueadas como silueta "?". Progreso en `localStorage`.

**Competición (ranking):** 75 s, 3 vidas, combo x1 a x4 (sube cada 3 aciertos seguidos, vuelve a x1 al fallar). Sin ayudas. Todos juegan **la misma secuencia esa semana**: semilla = semana ISO (Europe/Madrid) con un PRNG con semilla (mulberry32). El verbo-pool de la semana es el mundo `(semanaISO % 10) + 1`, para que todos compitan con lo mismo; configurable en un único sitio.
Al acabar, enviar la puntuación con la RPC (ver Supabase). Pantalla de ranking: semanal general y por código de clase.

## Juegos del MVP
1. **Verb Pop** (pixel): caen bloques con palabras y hay que atrapar el correcto. Tipos de reto, según el mundo: "past of X", "participle of X", "¿qué significa X?" (en estudio). Un toque sobre el bloque responde; el personaje se desplaza bajo él. Teclado: flechas e intro, o 1-3.
2. **Mímica:** aparece el emoji (marco cartucho) y se elige entre 4 verbos. Solo verbos `mimica: true`. Distractores del mismo `category` cuando se pueda.

Fuera del MVP: Verb Slash, Wordle de verbos, sprites pixel propios de los 100 verbos, landing, cuentas.

## Estética (de la maqueta aprobada)
Fondo `#14122B`; turquesa `#7CF0C8`; amarillo `#FFE14D`; naranja `#FF9F43`; rosa `#FF5DA2`; rojo corazones `#FF4D6D`; morados `#3B2F7F`, `#5B4BD1`, `#9C95E8`. Tipografía pixel con `@fontsource/press-start-2p` (autoalojada, sin CDN). `image-rendering: pixelated`. HUD: score, barra de tiempo, 3 corazones; abajo combo y posición en el ranking. Personaje y suelo dibujados con rectángulos (sin assets externos). Respetar `prefers-reduced-motion`. Contraste legible en proyector.
Interfaz en inglés con etiquetas muy cortas (Start, Study, Challenge, Cards, Ranking); en estudio, ayudas en español. Si Bego prefiere todo en español, cambiarlo en un único fichero de textos.

## Supabase
- `schema.sql` (en este paquete) crea `verb_scores`, `game_limits` y tres funciones. La tabla no se lee ni se escribe directamente: solo `submit_score` y `get_leaderboard` (RPC con la clave anon). Claude Code NO ejecuta el SQL; Bego lo pega en el SQL Editor.
- Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Vercel + `.env.local` ignorado por git). La clave anon es pública por diseño; la seguridad está en la RPC.
- **Sin datos personales.** Apodo generado por el juego (adjetivo + animal + número, listas cerradas); **sin texto libre** para evitar nombres reales y palabras feas. `player_id` = UUID aleatorio en `localStorage`. Código de clase opcional (2-8 letras/números), que da Henar.
- Capa de datos única en `src/datos/`; si Supabase no responde, el juego sigue funcionando y el ranking muestra un aviso corto.
- `max_score` de `game_limits` es provisional: tras equilibrar cada juego, calcular el máximo teórico de una partida de 75 s y proponerlo a Bego.

## Reglas de trabajo (las mismas que en La Verbena)
- Cero datos de menores. Sin nombres de pila reales en ejemplos. Ninguna marca de IA en código ni en pantalla.
- Un commit para contenido y otro para el juego. Cada batería de pruebas se lanza UNA vez; si falla, parar y contar.
- Bego revisa a ojo en `npm run dev` (5173). No arrancar servidores propios, no hacer capturas ni lanzar la batería de navegador salvo que se pida.
- Al acabar cada paso, parar y esperar su revisión.

## Orden
0. Esqueleto Vite + React, rutas, capa `src/datos/`, `verbos.json` y `npm run validar`.
1. Motor: PRNG con semilla, semana ISO, generador de preguntas y distractores (con tests de lógica).
2. Modo estudio + cartas.
3. Verb Pop (estudio y competición).
4. Mímica (estudio y competición).
5. Supabase y ranking.
