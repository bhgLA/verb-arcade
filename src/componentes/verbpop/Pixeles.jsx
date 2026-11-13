// Dibujo pixel con rectángulos SVG a partir de filas de caracteres.
export default function Pixeles({ filas, colores, className, titulo }) {
  const ancho = filas[0].length
  const rects = []
  filas.forEach((fila, y) => {
    ;[...fila].forEach((c, x) => {
      if (colores[c]) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={colores[c]} />)
    })
  })
  return (
    <svg
      className={className}
      viewBox={`0 0 ${ancho} ${filas.length}`}
      shapeRendering="crispEdges"
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : 'true'}
    >
      {rects}
    </svg>
  )
}
