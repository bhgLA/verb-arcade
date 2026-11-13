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

Añadidos el 13-11-2026 por parecido de emoji (Bego aprobó la propuesta):

- like 👍, love ❤️
- clean 🧹, wash 🧼
- look 👀, find 🔍
- eat 🍽️, cook 🍳
- help 🤝, meet 🧑‍🤝‍🧑
- catch 🧤, hold 🤲, take 🤏

Un verbo puede estar en varios grupos: look (con see y watch, y con find), cook (con make y build, y con eat), hold y take (con give y compañía, y con catch). Los tests comprueban que, aun así, todas las pools de mímica dan 4 opciones sin ambigüedad, también la del mundo 1.

## Verb Pop: máximo teórico y límite del servidor

Resultado: una partida de 75 s no puede pasar de 14 850 puntos. Con un 10 % de margen, `game_limits.max_score` de `verb_pop` queda en 16 335. Lo calcula `maximoTeorico()` en `src/motor/puntuacion.js` y `limiteServidor()` le añade el margen. Si cambian las reglas en `src/motor/config.js`, un test avisa de que `schema.sql` ya no coincide.

Reglas que intervienen (todas en `VERB_POP`, en `config.js`):

- Acierto: 100 × combo + bonus de rapidez (0 a 50).
- Combo: x1 al empezar; sube un nivel cada 3 aciertos seguidos, hasta x4.
- Un bloque nuevo no se puede responder hasta 1,2 s después de aparecer.
- Entre un reto y el siguiente pasan 0,8 s.

La partida más rápida posible responde cada reto justo cuando se desbloquea, y lo acierta. Así, cada reto ocupa 1,2 + 0,8 = 2 s. Las respuestas caen en 1,2 s, 3,2 s, 5,2 s… hasta 73,2 s. La siguiente sería en 75,2 s y ya no cuenta, porque a los 75 s se acaba. Salen 37 aciertos.

Por combo:

| Aciertos | Multiplicador | Puntos |
|---|---|---|
| 1-3 | x1 | 3 × 100 = 300 |
| 4-6 | x2 | 3 × 200 = 600 |
| 7-9 | x3 | 3 × 300 = 900 |
| 10-37 | x4 | 28 × 400 = 11 200 |

Suman 13 000. El bonus máximo es 50 en cada uno de los 37 aciertos, 1 850 más. Total: 14 850.

El bonus mide qué parte quedaba de la ventana en la que se puede responder, desde que se desbloquea hasta que el bloque toca el suelo. Por eso responder justo al desbloquearse da 50 en cualquier mundo, y el máximo no depende del mundo de la semana aunque los bloques caigan más deprisa. Un test juega una partida perfecta en cada uno de los 10 mundos y saca exactamente 14 850. Otros 300 tests con partidas al azar nunca lo superan.

El 6 000 de antes se quedaba corto: una partida buena de verdad lo pasaría. El de `mimica` sigue en 6 000, provisional, hasta el paso 4. He cambiado el `on conflict ... do nothing` por `do update`: así, si ya habías pegado el SQL, volver a pegarlo actualiza los límites.
