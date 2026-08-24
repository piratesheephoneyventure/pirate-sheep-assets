#!/usr/bin/env node
// Generates a thumbnails/ copy (max width 320px, no upscaling) for every image in each event folder's images/ dir.
// Same as update-gallery-json.js: folder needs both images/ and images.json.
// Skips files that already have an up-to-date thumbnail.
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const THUMB_WIDTH = 320
const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp'])

const root = process.cwd()

async function main() {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue

    const folder = entry.name
    const imagesDir = path.join(root, folder, 'images')
    const jsonPath = path.join(root, folder, 'images.json')
    if (!fs.existsSync(imagesDir) || !fs.existsSync(jsonPath)) continue

    const thumbsDir = path.join(root, folder, 'thumbnails')
    fs.mkdirSync(thumbsDir, { recursive: true })

    const files = fs
      .readdirSync(imagesDir)
      .filter((f) => IMG_EXT.has(path.extname(f).toLowerCase()))

    for (const f of files) {
      const srcPath = path.join(imagesDir, f)
      const destPath = path.join(thumbsDir, f)
      if (
        fs.existsSync(destPath) &&
        fs.statSync(destPath).mtimeMs >= fs.statSync(srcPath).mtimeMs
      ) {
        continue
      }

      await sharp(srcPath)
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
        .toFile(destPath)
      console.log(`thumbnail: ${folder}/thumbnails/${f}`)
    }
  }
}

main()
