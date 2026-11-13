# Notas sobre verbos.json

Dudas detectadas al validar. No he cambiado nada en los datos: decide Bego.

## learn marcado como irregular (resuelto)

Resuelto el 13-11-2026: Bego lo cambió a `irregular: false`.

`learn` tenía `irregular: true`, pero sus formas son `learned / learned`, que son regulares. El propio fichero dice en `_source.notes` que se usa "learned" y no "learnt", así que parece que el `true` viene de la forma británica. Con "learned" debería ser `irregular: false`. Ahora mismo daría una pista falsa en estudio y contaría mal en cualquier filtro por irregulares.

## Emojis repetidos entre verbos de mímica (resuelto)

Resuelto el 13-11-2026: Bego cambió el emoji de `go` a ➡️ y el de `meet` a 🧑‍🤝‍🧑. Desde entonces `npm run validar` falla si dos verbos comparten emoji.

Antes:

- `go` y `walk` usaban los dos 🚶.
- `help` y `meet` usaban los dos 🤝.

En Mímica, si salían juntos en la misma pregunta, las dos opciones habrían sido correctas.

## freq_rank_top100 a null

26 verbos tienen `freq_rank_top100: null`. Cuadra con `_source.selection`: son los añadidos a mano, fuera del top 100. El validador acepta `null` o un entero de 1 a 100. (Esta nota decía 27 por error: los conté sobre una versión anterior del fichero, la que no tenía `be` ni `let`.)

## Grupos de verbos ambiguos en Mímica (pendiente de revisión)

Los verbos de un mismo grupo nunca salen juntos en una pregunta de Mímica, porque se confunden al representarlos. Están en `src/motor/config.js` (`GRUPOS_AMBIGUOS`) y los propuso Bego; falta revisarlos con calma.

- see, look, watch
- hear, listen
- talk, say, tell, speak, ask, call
- go, come, leave, walk, run, follow
- give, bring, send, put, take, hold
- cry, laugh, smile
- read, write, draw, paint
- start, begin, stop
- make, build, cook
- sit, stand
- buy, sell

Mirando los emojis actuales, estas parejas también podrían confundirse. No las he añadido:

- like 👍 y love ❤️
- clean 🧹 y wash 🧼
- look 👀 y find 🔍 (sería meter find en el grupo de see)
- eat 🍽️ y cook 🍳 (cook ya está con make y build)
- help 🤝 y meet 🧑‍🤝‍🧑
- catch 🧤 con hold 🤲 y take 🤏
