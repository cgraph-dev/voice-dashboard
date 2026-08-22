import fs from "node:fs"

const htmlPaths = ["frontend/index.html", "frontend/activity.html"]
const assetPath = "frontend/Logo/ascii-magic-4.gif"
const marker = "<!-- QUBIT_BACKGROUND_GIF -->"

// By default keep GIF EXTERNAL (/static/Logo/ascii-magic-4.gif) — 290KB HTML,
// not 40MB base64 inline. The bridge serves /static, so localhost is fast.
// Vercel static deploy has no /static server, so there run INLINE_GIF=1
// to keep the CDN-cached inline bundle (slower but works without server).
const useInline = process.env.INLINE_GIF === "1"

if (!fs.existsSync(assetPath)) {
  throw new Error(`Qubit background source is missing: ${assetPath}`)
}

let backgroundImage
if (useInline) {
  const gif = fs.readFileSync(assetPath).toString("base64")
  backgroundImage = `<img class="gif-background" aria-hidden="true" alt="" src="data:image/gif;base64,${gif}">`
  console.log("Qubit background: inlined 40MB GIF (INLINE_GIF=1, Vercel mode)")
} else {
  backgroundImage = `<img class="gif-background" aria-hidden="true" alt="" src="/static/Logo/ascii-magic-4.gif" loading="lazy" decoding="async">`
}
const imagePattern = /<img class="gif-background"[^>]*>/s

for (const htmlPath of htmlPaths) {
  let html = fs.readFileSync(htmlPath, "utf8")
  let markerIndex = html.lastIndexOf(marker)

  if (markerIndex < 0) {
    const bodyOpen = html.indexOf("<body>")
    if (bodyOpen < 0) throw new Error(`Qubit background insertion point was not found in ${htmlPath}`)
    markerIndex = bodyOpen + "<body>".length
    html = `${html.slice(0, markerIndex)}\n${marker}\n${backgroundImage}${html.slice(markerIndex)}`
  } else {
    const contentStart = markerIndex + marker.length
    const afterMarker = html.slice(contentStart)
    html = imagePattern.test(afterMarker)
      ? html.slice(0, contentStart) + afterMarker.replace(imagePattern, backgroundImage)
      : html.slice(0, contentStart) + `\n${backgroundImage}` + afterMarker
  }

  fs.writeFileSync(htmlPath, html)
}

if (!useInline) console.log("Qubit background: external /static/Logo (fast, 290KB HTML)")
