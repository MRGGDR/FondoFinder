/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      // Use file-based source maps instead of eval() wrappers.
      // This prevents "Invalid or unexpected token" SyntaxErrors caused
      // by partially-written bundles when the dev server is interrupted.
      config.devtool = 'cheap-module-source-map'
    }
    return config
  },
  async headers() {
    return [
      {
        // Fuerza descarga directa del instructivo sin mostrar diálogo de abrir/descargar
        source: '/fichas-fondos/Instructivo:path*',
        headers: [
          {
            key: 'Content-Disposition',
            value: 'attachment; filename="Manual_Herramienta_Financiamiento.pdf"',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
