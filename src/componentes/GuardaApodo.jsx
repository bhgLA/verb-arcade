// Primer uso de cualquier juego de Challenge: si el niño no ha elegido apodo, el
// selector sale en lugar de la intro, con una combinación preseleccionada. "Start"
// guarda el apodo y empieza el juego directamente. Sin Cancel y una sola vez.
import { useState } from 'react'
import { apodoElegido, apodoParaElegir, confirmarPrimerApodo } from '../datos/index.js'
import { semanaISO, mundoDeLaSemana } from '../motor/semana.js'
import { pideApodo } from '../guarda.js'
import { textos } from '../textos.js'
import { PantallaMundo, BarraSuperior } from './Pantalla.jsx'
import { Chip } from './Piezas.jsx'
import { SelectorApodo } from './ranking/SelectorApodo.js'

function PrimerApodo({ titulo, alEmpezar }) {
  const [mundo] = useState(() => mundoDeLaSemana(semanaISO()))
  const [propuesto] = useState(() => apodoParaElegir())
  const alGuardar = (adjetivo, animal) => {
    // La marca se pone antes del primer await; el reenvío sigue mientras se juega.
    confirmarPrimerApodo(adjetivo, animal)
    alEmpezar()
  }
  return (
    <PantallaMundo mundo={mundo} olas className="intro-juego primer-apodo">
      <BarraSuperior atras="/reto" izquierda={<Chip mundo={mundo} />} />
      <h1 className="titulo-grande">{titulo}</h1>
      <section className="tarjeta primer-apodo__tarjeta">
        <SelectorApodo apodo={propuesto} alGuardar={alGuardar} accion={textos.verbPop.empezar} />
      </section>
    </PantallaMundo>
  )
}

export default function GuardaApodo({ ruta, Pagina, titulo }) {
  const [pide, setPide] = useState(() => pideApodo(ruta, apodoElegido()))
  const [empezarYa, setEmpezarYa] = useState(false)
  if (pide) {
    return (
      <PrimerApodo
        titulo={titulo}
        alEmpezar={() => {
          setEmpezarYa(true)
          setPide(false)
        }}
      />
    )
  }
  return <Pagina empezarYa={empezarYa} />
}
