import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { chmod, mkdir, rename, rm } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const frontRoot = path.resolve(scriptDir, '..')
const repoRoot = path.resolve(frontRoot, '..')
const cacheRoot = path.join(frontRoot, '.cache', 'osv-scanner')
const releaseUrl = 'https://api.github.com/repos/google/osv-scanner/releases/latest'
const userAgent = 'palajaba-audit-osv'

function fail(message) {
  console.error(message)
  process.exit(1)
}

function assetName() {
  const osName = { win32: 'windows', linux: 'linux', darwin: 'darwin' }[process.platform]
  const arch = { x64: 'amd64', arm64: 'arm64' }[process.arch]
  if (!osName || !arch) {
    fail(`osv-scanner no publica un binario para ${process.platform}/${process.arch}.`)
  }
  const extension = process.platform === 'win32' ? '.exe' : ''
  return `osv-scanner_${osName}_${arch}${extension}`
}

function binaryOnPath() {
  const finder = process.platform === 'win32' ? 'where.exe' : 'which'
  const result = spawnSync(finder, ['osv-scanner'], { encoding: 'utf8' })
  if (result.status !== 0) return null
  return result.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || null
}

async function githubJson(url) {
  let response
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': userAgent,
      },
    })
  } catch (error) {
    fail(`No se pudo contactar a GitHub para descargar osv-scanner: ${error.message}`)
  }
  if (!response.ok) {
    fail(`No se pudo consultar GitHub (${response.status}) para descargar osv-scanner.`)
  }
  return response.json()
}

async function downloadFile(url, dest) {
  let response
  try {
    response = await fetch(url, {
      headers: { 'User-Agent': userAgent },
      redirect: 'follow',
    })
  } catch (error) {
    fail(`No se pudo descargar osv-scanner: ${error.message}`)
  }
  if (!response.ok || !response.body) {
    fail(`No se pudo descargar ${url} (${response.status}).`)
  }
  await pipeline(Readable.fromWeb(response.body), createWriteStream(dest))
}

function sha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(filePath)
    stream.on('error', reject)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

function checksumFor(sumsText, name) {
  for (const line of sumsText.split(/\r?\n/)) {
    const match = line.trim().match(/^([a-f0-9]{64})\s+\*?(.+)$/i)
    if (match && match[2] === name) return match[1].toLowerCase()
  }
  return null
}

async function cachedBinary() {
  const onPath = binaryOnPath()
  if (onPath) return onPath

  const release = await githubJson(releaseUrl)
  const name = assetName()
  const asset = (release.assets || []).find((item) => item.name === name)
  const sumsAsset = (release.assets || []).find((item) => item.name === 'osv-scanner_SHA256SUMS')
  if (!asset?.browser_download_url || !sumsAsset?.browser_download_url) {
    fail(`La release ${release.tag_name || 'latest'} de osv-scanner no incluye ${name}.`)
  }

  const dir = path.join(cacheRoot, release.tag_name || 'latest')
  const dest = path.join(dir, name)
  await mkdir(dir, { recursive: true })

  let sumsResponse
  try {
    sumsResponse = await fetch(sumsAsset.browser_download_url, {
      headers: { 'User-Agent': userAgent },
      redirect: 'follow',
    })
  } catch (error) {
    fail(`No se pudo descargar la suma SHA256 de osv-scanner: ${error.message}`)
  }
  if (!sumsResponse.ok) {
    fail(`No se pudo descargar la suma SHA256 de osv-scanner (${sumsResponse.status}).`)
  }
  const expected = checksumFor(await sumsResponse.text(), name)
  if (!expected) fail(`La suma SHA256 publicada no incluye ${name}.`)

  try {
    if ((await sha256(dest)) === expected) return dest
  } catch {
    // El binario todavía no está en la caché.
  }

  const partial = `${dest}.partial`
  console.error(`Descargando osv-scanner ${release.tag_name}...`)
  await downloadFile(asset.browser_download_url, partial)
  const actual = await sha256(partial)
  if (actual !== expected) {
    await rm(partial, { force: true })
    fail('La descarga de osv-scanner no coincide con la suma SHA256 publicada.')
  }
  await rm(dest, { force: true })
  await rename(partial, dest)
  if (process.platform !== 'win32') await chmod(dest, 0o755)
  return dest
}

function lockfileFlag(relativePath) {
  const absolute = path.resolve(repoRoot, relativePath).replaceAll('\\', '/')
  return `--lockfile=:${absolute}`
}

const binary = await cachedBinary()
const result = spawnSync(
  binary,
  [
    'scan',
    'source',
    '--config=osv-scanner.toml',
    lockfileFlag('palajaba-front/package-lock.json'),
    lockfileFlag('palajaba-back/requirements.txt'),
  ],
  { cwd: repoRoot, stdio: 'inherit' },
)

if (result.error) fail(`No se pudo ejecutar osv-scanner: ${result.error.message}`)
process.exit(result.status === 0 ? 0 : (result.status ?? 1))
