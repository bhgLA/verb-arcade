// Audio con Web Speech API. Solo suena al pulsar; nunca de forma automática.
import { useEffect, useState } from 'react'

const hayVoz = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

function buscarVozInglesa() {
  const voces = window.speechSynthesis.getVoices()
  const lang = (v) => v.lang.replace('_', '-').toLowerCase()
  return voces.find((v) => lang(v) === 'en-gb') ?? voces.find((v) => lang(v).startsWith('en-')) ?? null
}

// Devuelve la voz inglesa (en-GB si existe) o null. Las voces cargan tarde en algunos navegadores.
export function useVozInglesa() {
  const [voz, setVoz] = useState(() => (hayVoz() ? buscarVozInglesa() : null))
  useEffect(() => {
    if (!hayVoz()) return undefined
    const actualizar = () => setVoz(buscarVozInglesa())
    actualizar()
    window.speechSynthesis.addEventListener('voiceschanged', actualizar)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', actualizar)
  }, [])
  return voz
}

export function hablar(texto, voz) {
  if (!voz || !hayVoz()) return
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(texto)
    u.voice = voz
    u.lang = voz.lang
    u.rate = 0.85
    window.speechSynthesis.speak(u)
  } catch {
    // Sin audio no pasa nada: el juego sigue.
  }
}
