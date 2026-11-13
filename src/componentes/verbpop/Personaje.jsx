import Pixeles from './Pixeles.jsx'

const FIGURA = [
  'B........B',
  'B..KKKK..B',
  'BBKYYYYKBB',
  '.KYYYYYYK.',
  '.KYDYYDYK.',
  '.KYYYYYYK.',
  '..KYPPYK..',
  '...KKKK...',
  '.TTTTTTTT.',
  '.TTTTTTTT.',
  '..TT..TT..',
  '..KK..KK..',
]
const COLORES = { K: '#9C95E8', Y: '#FFE14D', D: '#14122B', P: '#FF5DA2', T: '#7CF0C8', B: '#7CF0C8' }

export default function Personaje() {
  return <Pixeles filas={FIGURA} colores={COLORES} className="personaje__dibujo" />
}
