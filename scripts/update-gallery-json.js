#!/usr/bin/env node
// Syncs each event folder's images.json with the files in its images/ dir.
// A folder qualifies if it has both an images/ subdir and an images.json file.
// Files are sorted numerically by their trailing number (image_001 < image_002 < ...).
// Any filename containing "winner" (case-insensitive) gets `winner: true`.
const fs = require('fs')
const path = require('path')

const REPO = 'piratesheephoneyventure/pirate-sheep-assets'
const BRANCH = 'main'
const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

const trailingNumber = (base) => {
  const m = base.match(/(\d+)$/)
  return m ? parseInt(m[1], 10) : Number.POSITIVE_INFINITY
}

const root = process.cwd()

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue

  const folder = entry.name
  const imagesDir = path.join(root, folder, 'images')
  const jsonPath = path.join(root, folder, 'images.json')
  if (!fs.existsSync(imagesDir) || !fs.existsSync(jsonPath)) continue

  const files = fs
    .readdirSync(imagesDir)
    .filter((f) => IMG_EXT.has(path.extname(f).toLowerCase()))
    .sort((a, b) => {
      const baseA = path.parse(a).name
      const baseB = path.parse(b).name
      const numDiff = trailingNumber(baseA) - trailingNumber(baseB)
      return numDiff !== 0 ? numDiff : baseA.localeCompare(baseB)
    })

  const urlFor = (f) =>
    `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${folder}/images/${encodeURIComponent(f)}`

  let data = { images: [] }
  const raw = fs.readFileSync(jsonPath, 'utf8').trim()
  if (raw) data = JSON.parse(raw)
  if (!Array.isArray(data.images)) data.images = []
  const existingByUrl = new Map(data.images.map((i) => [i.img, i]))

  // Rebuild in sorted order every run; winner is always re-derived from the
  // filename (not preserved) so a rename is picked up automatically.
  data.images = files.map((f) => {
    const url = urlFor(f)
    const { winner: _prevWinner, ...rest } = existingByUrl.get(url) ?? {}
    const isWinner = /winner/i.test(path.parse(f).name)
    return {
      ...rest,
      img: url,
      ...(isWinner ? { winner: true } : {}),
    }
  })

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n')
}
