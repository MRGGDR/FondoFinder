#!/usr/bin/env node

const { spawn } = require('child_process')

const projectRoot = __dirname

function resolveRequiredModule(modulePath, helpMessage) {
  try {
    return require.resolve(modulePath)
  } catch {
    throw new Error(helpMessage)
  }
}

const nextBin = resolveRequiredModule(
  'next/dist/bin/next',
  'No se encontro Next.js. Ejecuta: npm install',
)
const readlinkWorkaround = resolveRequiredModule(
  './scripts/readlink-eisdir-workaround.cjs',
  'No se encontro scripts/readlink-eisdir-workaround.cjs',
)

const args = process.argv.slice(2)
const argSet = new Set(args)

const runChecks =
  argSet.has('--checks') ||
  argSet.has('--full') ||
  argSet.has('--checks-only')
const runBuild = argSet.has('--full') || argSet.has('--build')
const runClean = argSet.has('--full') || argSet.has('--clean')
const checksOnly = argSet.has('--checks-only')

const portIndex = args.indexOf('--port')
const hostIndex = args.indexOf('--host')

const port =
  portIndex >= 0 && args[portIndex + 1] ? String(args[portIndex + 1]) : null
const host =
  hostIndex >= 0 && args[hostIndex + 1] ? String(args[hostIndex + 1]) : null

function runStep(label, command, stepArgs) {
  return new Promise((resolve, reject) => {
    console.log(`\n[${label}] ${command} ${stepArgs.join(' ')}`)

    const child = spawn(command, stepArgs, {
      stdio: 'inherit',
      shell: false,
      cwd: projectRoot,
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: '1',
      },
    })

    child.on('error', reject)
    child.on('exit', code => {
      if (code === 0) resolve()
      else reject(new Error(`[${label}] failed with exit code ${code}`))
    })
  })
}

function startDev() {
  const devArgv = ['dev']
  if (port) devArgv.push('-p', port)
  if (host) devArgv.push('-H', host)

  console.log('\n[dev] Iniciando servidor de desarrollo...')
  if (host || port) {
    console.log(`[dev] host=${host ?? 'default'} port=${port ?? 'default'}`)
  }

  process.chdir(projectRoot)
  process.env.NEXT_TELEMETRY_DISABLED = '1'

  // Ejecutar Next en este mismo proceso evita procesos huérfanos en Windows
  // y replica el comportamiento de ejecutar "node .../next dev" directamente.
  process.argv = [process.execPath, nextBin, ...devArgv]
  require(readlinkWorkaround)
  require(nextBin)
}

async function main() {
  console.log('FondosFinder V5 - start-all')
  console.log(
    `modo: checks=${runChecks} build=${runBuild} clean=${runClean} checksOnly=${checksOnly}`
  )

  // Modo rapido por defecto: abre localhost sin bloquear por lint/build.
  if (!runChecks && !runBuild && !runClean && !checksOnly) {
    startDev()
    return
  }

  try {
    if (runClean) {
      await runStep('clean', process.execPath, [
        '-e',
        "require('fs').rmSync('.next',{recursive:true,force:true});console.log('Cache cleared')",
      ])
    }

    if (runChecks) {
      const tscCli = resolveRequiredModule(
        'typescript/bin/tsc',
        'No se encontro TypeScript. Ejecuta: npm install',
      )
      await runStep('lint', process.execPath, [nextBin, 'lint'])
      await runStep('typecheck', process.execPath, [tscCli, '--noEmit'])
    }

    if (runBuild) {
      await runStep('build', process.execPath, [
        '-r',
        readlinkWorkaround,
        nextBin,
        'build',
      ])
    }

    console.log('\nChecks completados correctamente.')

    if (checksOnly) {
      console.log('Modo checks-only: no se inicia el servidor dev.')
      return
    }

    startDev()
  } catch (error) {
    console.error(`\nError: ${error.message}`)
    process.exit(1)
  }
}

main()
