import { Enlace } from '../rutas.jsx'
import { textos } from '../textos.js'
import Icono from './Iconos.jsx'

// Ficha del menú de la portada: enlace real con el relieve de las teselas.
export function FichaMenu({ a, icono, titulo, subtitulo = null, destacada = false, children }) {
  return (
    <Enlace a={a} className={`tesela ficha-inicio ${destacada ? 'ficha-inicio--destacada' : ''}`}>
      <span className="ficha-inicio__icono">
        <Icono nombre={icono} tam={28} grosor={2} />
      </span>
      <span className="ficha-inicio__titulo">{titulo}</span>
      {subtitulo && <span className="ficha-inicio__subtitulo">{subtitulo}</span>}
      <span className="ficha-inicio__pie">{children}</span>
    </Enlace>
  )
}

// Barra de progreso decorativa: el dato ya va escrito al lado.
export function Barra({ valor, total, className = '' }) {
  const ancho = total > 0 ? Math.round((valor / total) * 100) : 0
  return (
    <span className={`ficha-inicio__barra ${className}`} aria-hidden="true">
      <span className="ficha-inicio__barra-relleno" style={{ width: `${ancho}%` }} />
    </span>
  )
}

// Cabeza del ranking semanal. filas: [{ posicion, nick, puntos }].
// Sin filas enseña una línea neutra en el mismo hueco (vacio: true si no hay puntuaciones,
// false si no se ha podido cargar o todavía está cargando).
export function TopRanking({ filas = [], vacio = false }) {
  if (filas.length === 0) {
    const p = textos.ranking.portada
    return <span className="ficha-inicio__vacio">{vacio ? p.vacio : p.sinConexion}</span>
  }
  return filas.slice(0, 3).map((f) => (
    <span key={f.posicion} className="ficha-inicio__fila">
      <span className={`ficha-inicio__puesto ${f.posicion === 1 ? 'ficha-inicio__puesto--primero' : ''}`}>
        {f.posicion}
      </span>
      <span className="ficha-inicio__nick">{f.nick}</span>
      <span>{textos.numero(f.puntos)}</span>
    </span>
  ))
}
