const colorMap: Record<string, string> = {
  Nacional:      'bg-ungrd-blue-dark text-white',
  Territorial:   'bg-ungrd-blue-mid text-white',
  Internacional: 'bg-ungrd-navy text-white',
}

interface BadgeProps {
  tipo: 'Nacional' | 'Territorial' | 'Internacional'
  className?: string
}

export default function Badge({ tipo, className = '' }: BadgeProps) {
  const color = colorMap[tipo] ?? 'bg-ungrd-gray text-white'
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color} ${className}`}
    >
      {tipo}
    </span>
  )
}
