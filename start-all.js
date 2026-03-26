#!/usr/bin/env node
/**
 * start-all.js — Arranca el servidor de desarrollo de FondosFinder
 * Uso: node start-all.js
 */

const { spawn, exec } = require('child_process')
const net = require('net')
const os = require('os')
const path = require('path')
const fs = require('fs')

// Devuelve una promesa que resuelve en el primer puerto libre >= startPort
function findFreePort(startPort) {
  return new Promise((resolve) => {
    const tryPort = (port) => {
      const server = net.createServer()
      server.unref()
      server.on('error', () => tryPort(port + 1))
      server.listen(port, () => {                 // sin host → vincula en :: (todas las interfaces)
        const { port: free } = server.address()
        server.close(() => resolve(free))
      })
    }
    tryPort(startPort)
  })
}

const isWindows = os.platform() === 'win32'
const nextBin = path.join(__dirname, 'node_modules', '.bin', isWindows ? 'next.cmd' : 'next')

// Abre la URL en el navegador del sistema
function openBrowser(url) {
  const cmd =
    isWindows ? `start "" "${url}"` :
    os.platform() === 'darwin' ? `open "${url}"` :
    `xdg-open "${url}"`
  exec(cmd, err => {
    if (err) console.error('  No se pudo abrir el navegador automáticamente:', err.message)
  })
}

// Limpia el cache de compilación de Next.js (.next) antes de arrancar.
// Esto evita errores "Invalid or unexpected token" por bundles corruptos.
const cacheDir = path.join(__dirname, '.next')
if (fs.existsSync(cacheDir)) {
  try {
    fs.rmSync(cacheDir, { recursive: true, force: true })
    console.log('  ✓ Cache .next limpiado\n')
  } catch {
    console.warn('  ⚠  No se pudo limpiar .next (continuando de todas formas)\n')
  }
}

console.log('\n╔══════════════════════════════════════════╗')
console.log('║   FondosFinder — Servidor de desarrollo  ║')
console.log('╚══════════════════════════════════════════╝\n')
console.log('▶  Iniciando Next.js...\n')

// Arranca el servidor en un puerto libre
async function start() {
  const port = await findFreePort(3000)
  console.log(`  Puerto libre encontrado: ${port}\n`)

  const dev = spawn(nextBin, ['dev', '--port', String(port)], {
    stdio: ['inherit', 'pipe', 'pipe'],
    cwd: __dirname,
    shell: isWindows,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
  })

  let browserOpened = false

  // Detecta la línea "Local: http://localhost:XXXX" para saber el puerto real
  function handleOutput(chunk) {
    const text = chunk.toString()
    process.stdout.write(text)

    if (!browserOpened) {
      const match = text.match(/Local:\s+(http:\/\/localhost:\d+)/)
      if (match) {
        const url = match[1]
        browserOpened = true
        console.log(`\n🌐 Abriendo ${url} en el navegador...\n`)
        setTimeout(() => openBrowser(url), 500)
      }
    }
  }

  dev.stdout.on('data', handleOutput)
  dev.stderr.on('data', handleOutput)

  dev.on('error', err => {
    console.error('\n✗ Error al iniciar el servidor:', err.message)
    if (err.code === 'ENOENT') {
      console.error('  Asegúrate de haber ejecutado: npm install')
    }
    process.exit(1)
  })

  dev.on('close', code => {
    if (code !== 0 && code !== null) {
      console.error(`\n✗ El servidor terminó con código ${code}`)
      process.exit(code)
    }
  })

  // Ctrl+C limpio
  process.on('SIGINT', () => {
    console.log('\n\n⏹  Deteniendo servidor...')
    dev.kill('SIGINT')
  })
}

start().catch(err => {
  console.error('\n✗ Error fatal:', err.message)
  process.exit(1)
})
process.on('SIGTERM', () => {
  dev.kill('SIGTERM')
})
