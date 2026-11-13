// prefers-reduced-motion como hook de React.
import { useEffect, useState } from 'react'

const CONSULTA = '(prefers-reduced-motion: reduce)'

export function useMenosMovimiento() {
  const [menos, setMenos] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(CONSULTA).matches)
  useEffect(() => {
    const mq = window.matchMedia?.(CONSULTA)
    if (!mq) return undefined
    const cambiar = () => setMenos(mq.matches)
    mq.addEventListener('change', cambiar)
    return () => mq.removeEventListener('change', cambiar)
  }, [])
  return Boolean(menos)
}
