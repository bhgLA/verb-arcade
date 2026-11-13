// Marco pixel tipo cartucho para el emoji (o la inicial si el verbo aún no tiene emoji).
export default function Cartucho({ verbo, tamaño = 'normal' }) {
  const contenido = verbo.emoji || verbo.verb.charAt(0).toUpperCase()
  return (
    <div className={`cartucho cartucho--${tamaño}`} aria-hidden="true">
      <span className={verbo.emoji ? 'cartucho__emoji' : 'cartucho__letra'}>{contenido}</span>
    </div>
  )
}
