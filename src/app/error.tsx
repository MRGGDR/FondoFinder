'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4 text-center">
      <p className="text-4xl">⚠️</p>
      <h2 className="text-xl font-bold text-ungrd-navy">Error al cargar la página</h2>
      <p className="text-sm text-ungrd-gray max-w-sm">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-ungrd-navy text-white rounded-lg text-sm font-semibold hover:bg-ungrd-blue-dark transition-colors"
      >
        Reintentar
      </button>
    </div>
  )
}
