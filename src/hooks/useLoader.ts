import { useState, useCallback } from 'react'

export function useLoader() {
  const [estado, setEstado] = useState<{
    visible: boolean
    contexto: string
    subTexto?: string
  }>({ visible: false, contexto: 'default' })

  const mostrar = useCallback((contexto = 'default', subTexto?: string) => {
    setEstado({ visible: true, contexto, subTexto })
  }, [])

  const ocultar = useCallback(() => {
    setEstado(prev => ({ ...prev, visible: false }))
  }, [])

  return { estado, mostrar, ocultar }
}
