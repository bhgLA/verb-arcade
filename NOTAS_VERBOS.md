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

27 verbos tienen `freq_rank_top100: null`. Cuadra con `_source.selection`: son los añadidos a mano, fuera del top 100. El validador acepta `null` o un entero de 1 a 100.
