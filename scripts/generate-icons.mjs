/**
 * Genera los íconos PNG del PWA a partir de un SVG usando sharp.
 * Corre: node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const PUBLIC = resolve(__dir, '../public')

// SVG del ícono — balón de fútbol con fondo oscuro y acento verde
const svgIcon = (size) => {
  const r = size * 0.175
  const ball = size * 0.44
  const ballX = size / 2
  const ballY = size * 0.46
  const labelSize = size * 0.13
  const labelY = size * 0.86

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#0f172a"/>
  <!-- Glow -->
  <circle cx="${ballX}" cy="${ballY}" r="${ball * 0.6}" fill="#00C853" opacity="0.08"/>
  <!-- Soccer ball paths -->
  <circle cx="${ballX}" cy="${ballY}" r="${ball * 0.5}" fill="none" stroke="#00C853" stroke-width="${size * 0.025}" opacity="0.9"/>
  <!-- Pentagon center -->
  <polygon
    points="${ballX},${ballY - ball * 0.22} ${ballX + ball * 0.21},${ballY - ball * 0.07} ${ballX + ball * 0.13},${ballY + ball * 0.18} ${ballX - ball * 0.13},${ballY + ball * 0.18} ${ballX - ball * 0.21},${ballY - ball * 0.07}"
    fill="#00C853" opacity="0.85"/>
  <!-- Seam lines -->
  <line x1="${ballX}" y1="${ballY - ball * 0.5}" x2="${ballX}" y2="${ballY - ball * 0.22}" stroke="#00C853" stroke-width="${size * 0.018}" stroke-linecap="round" opacity="0.7"/>
  <line x1="${ballX + ball * 0.21}" y1="${ballY - ball * 0.07}" x2="${ballX + ball * 0.44}" y2="${ballY - ball * 0.22}" stroke="#00C853" stroke-width="${size * 0.018}" stroke-linecap="round" opacity="0.7"/>
  <line x1="${ballX + ball * 0.13}" y1="${ballY + ball * 0.18}" x2="${ballX + ball * 0.35}" y2="${ballY + ball * 0.38}" stroke="#00C853" stroke-width="${size * 0.018}" stroke-linecap="round" opacity="0.7"/>
  <line x1="${ballX - ball * 0.13}" y1="${ballY + ball * 0.18}" x2="${ballX - ball * 0.35}" y2="${ballY + ball * 0.38}" stroke="#00C853" stroke-width="${size * 0.018}" stroke-linecap="round" opacity="0.7"/>
  <line x1="${ballX - ball * 0.21}" y1="${ballY - ball * 0.07}" x2="${ballX - ball * 0.44}" y2="${ballY - ball * 0.22}" stroke="#00C853" stroke-width="${size * 0.018}" stroke-linecap="round" opacity="0.7"/>
  <!-- Label -->
  <text x="${ballX}" y="${labelY}" font-family="system-ui,-apple-system,sans-serif"
    font-size="${labelSize}" font-weight="900" fill="#00C853" text-anchor="middle"
    letter-spacing="${size * 0.004}">QUINIELA</text>
</svg>`
}

const SIZES = [192, 512, 180]
const NAMES = { 192: 'icon-192.png', 512: 'icon-512.png', 180: 'apple-touch-icon.png' }

for (const size of SIZES) {
  const svg = Buffer.from(svgIcon(size))
  const out = resolve(PUBLIC, NAMES[size])
  await sharp(svg).png().toFile(out)
  console.log(`✓ ${NAMES[size]}`)
}

console.log('Íconos generados en public/')
