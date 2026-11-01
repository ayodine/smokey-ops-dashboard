import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const svgPath = path.join(rootDir, 'public', 'logo.svg')
const iconsDir = path.join(rootDir, 'public', 'icons')

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

const svgContent = fs.readFileSync(svgPath, 'utf-8')

async function generateIcons() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  const targets = [
    { name: 'icon-192.png', size: 192, padding: 24, bg: '#ffffff', radius: 36 },
    { name: 'icon-512.png', size: 512, padding: 64, bg: '#ffffff', radius: 96 },
    { name: 'icon-maskable-512.png', size: 512, padding: 96, bg: '#ffffff', radius: 0 },
    { name: 'apple-touch-icon.png', size: 180, padding: 22, bg: '#ffffff', radius: 32 }
  ]

  for (const target of targets) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: ${target.size}px;
            height: ${target.size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${target.bg};
            overflow: hidden;
          }
          .icon-container {
            width: ${target.size}px;
            height: ${target.size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: ${target.padding}px;
            background: #ffffff;
            box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06);
          }
          svg {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <div class="icon-container">
          ${svgContent}
        </div>
      </body>
      </html>
    `

    await page.setViewportSize({ width: target.size, height: target.size })
    await page.setContent(html)
    const outputPath = path.join(iconsDir, target.name)
    await page.screenshot({ path: outputPath, omitBackground: false })
    console.log(`Generated: ${target.name} (${target.size}x${target.size})`)
  }

  await browser.close()
  console.log('All PWA icons successfully generated.')
}

generateIcons().catch(err => {
  console.error('Failed to generate PWA icons:', err)
  process.exit(1)
})

