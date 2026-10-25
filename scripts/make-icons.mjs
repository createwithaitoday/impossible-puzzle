/**
 * Generate IMPOSSIBLE icons with sharp into public/ and store/icons/.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = path.join(root, 'public')
const storeIcons = path.join(root, 'store', 'icons')
fs.mkdirSync(publicDir, { recursive: true })
fs.mkdirSync(storeIcons, { recursive: true })

function svgFor(size) {
  const stroke = Math.max(2, Math.round(size * 0.035))
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00f0ff"/>
      <stop offset="55%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#ff2bd6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="#05060a"/>
  <polygon points="96,360 220,140 280,140 156,360" fill="none" stroke="#00f0ff" stroke-width="${stroke * 2}"/>
  <polygon points="240,360 340,160 416,160 316,360" fill="none" stroke="#ff2bd6" stroke-width="${stroke * 2}"/>
  <line x1="180" y1="250" x2="330" y2="250" stroke="url(#g)" stroke-width="${stroke * 2}"/>
  <circle cx="256" cy="250" r="${Math.round(size * 0.03)}" fill="#ffffff"/>
</svg>`)
}

async function writePng(outPath, size) {
  await sharp(svgFor(size)).png().toFile(outPath)
  console.log('wrote', path.relative(root, outPath))
}

const publicSizes = [192, 512]
for (const s of publicSizes) {
  await writePng(path.join(publicDir, `icon-${s}.png`), s)
}

// Android adaptive / Play icon densities
const androidSizes = {
  'icon-48.png': 48,
  'icon-72.png': 72,
  'icon-96.png': 96,
  'icon-144.png': 144,
  'icon-192.png': 192,
  'icon-512.png': 512,
  'play-512.png': 512,
}
for (const [name, size] of Object.entries(androidSizes)) {
  await writePng(path.join(storeIcons, name), size)
}

await sharp(svgFor(1024))
  .resize(1024, 500, { fit: 'cover', position: 'centre' })
  .png()
  .toFile(path.join(root, 'store', 'feature-graphic.png'))
console.log('wrote store/feature-graphic.png')
