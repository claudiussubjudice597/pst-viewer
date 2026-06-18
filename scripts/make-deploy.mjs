// Assemble a ready-to-serve ./deploy folder: site/ (the build) + Caddyfile + DEPLOY.md.
import { rmSync, mkdirSync, cpSync, copyFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const deploy = join(root, 'deploy')
const site = join(deploy, 'site')

if (!existsSync(dist)) {
  console.error('No dist/ found — run `npm run build` first.')
  process.exit(1)
}

rmSync(deploy, { recursive: true, force: true })
mkdirSync(site, { recursive: true })
cpSync(dist, site, { recursive: true })
copyFileSync(join(root, 'Caddyfile'), join(deploy, 'Caddyfile'))
copyFileSync(join(root, 'DEPLOY.md'), join(deploy, 'DEPLOY.md'))

console.log('Assembled ./deploy  (site/ + Caddyfile + DEPLOY.md) — copy this folder to your server.')
