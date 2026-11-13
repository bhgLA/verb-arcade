# Notas sobre verbos.json

Dudas detectadas al validar. No he cambiado nada en los datos: decide Bego.

## learn marcado como irregular

`learn` tiene `irregular: true`, pero sus formas son `learned / learned`, que son regulares. El propio fichero dice en `_source.notes` que se usa "learned" y no "learnt", así que parece que el `true` viene de la forma británica. Con "learned" debería ser `irregular: false`. Ahora mismo daría una pista falsa en estudio y contaría mal en cualquier filtro por irregulares.

## Emojis repetidos entre verbos de mímica

- `go` y `walk` usan los dos 🚶.
- `help` y `meet` usan los dos 🤝.

En Mímica, si salen juntos en la misma pregunta (uno como respuesta y otro como distractor), las dos opciones serían correctas. `go` y `walk` son además del mismo `category` (movimiento), que es justo de donde se sacan los distractores. Hay dos salidas: cambiar uno de los emojis de cada pareja, o que el generador de preguntas no ponga juntos verbos con el mismo emoji. La segunda la puedo hacer en el paso 1 sin tocar los datos.

## freq_rank_top100 a null

27 verbos tienen `freq_rank_top100: null`. Cuadra con `_source.selection`: son los añadidos a mano, fuera del top 100. El validador acepta `null` o un entero de 1 a 100.
