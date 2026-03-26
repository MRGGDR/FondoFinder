const variantMap: Record<string, string> = {
  proceso:      'bg-blue-50 text-blue-700 border border-blue-200',
  beneficiario: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
  objetivo:     'bg-green-50 text-green-700 border border-green-200',
  default:      'bg-gray-100 text-gray-700 border border-gray-200',
}

interface TagProps {
  label: string
  variant?: 'proceso' | 'beneficiario' | 'objetivo' | 'default'
  className?: string
}

export default function Tag({ label, variant = 'default', className = '' }: TagProps) {
  const style = variantMap[variant]
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${style} ${className}`}
    >
      {label}
    </span>
  )
}
