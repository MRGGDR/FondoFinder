import AdminAccessGuard from '@/components/admin/AdminAccessGuard'

export const metadata = { title: 'Admin | Financiamiento PNGRD' }

export default function AdminPage() {
  return (
    <AdminAccessGuard>
      <div className="min-h-[70vh] bg-[#f6fafe]">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="bg-white border border-[#e4e9f1] rounded-3xl p-8 md:p-10 shadow-[0_10px_28px_-16px_rgba(7,29,76,0.25)]">
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.12em] bg-[#213362] text-[#FFCD00] px-3 py-1 rounded-full mb-4">
              Admin
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-[#213362] leading-tight mb-3">
              Panel administrativo
            </h1>
            <p className="text-sm md:text-base text-[#5c6680] leading-relaxed">
              Ruta mantenida para respetar la navegación visual del proyecto original.
            </p>
          </div>
        </div>
      </div>
    </AdminAccessGuard>
  )
}
