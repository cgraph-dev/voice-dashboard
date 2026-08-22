import fs from "node:fs"

const htmlPath = "frontend/index.html"
const assetCandidates = ["frontend/ascii-magic-4.gif", "frontend/Logo/ascii-magic-4.gif"]
const marker = "<!-- QUBIT_BACKGROUND_GIF -->"
const html = fs.readFileSync(htmlPath, "utf8")
const assetPath = assetCandidates.find((candidate) => fs.existsSync(candidate))
if (!assetPath) {
  console.warn(`Background source is missing; keeping the embedded GIF in ${htmlPath}.`)
  process.exit(0)
}
const gif = fs.readFileSync(assetPath).toString("base64")
const markerIndex = html.indexOf(marker)

if (markerIndex < 0) throw new Error("Qubit background marker was not found")

const backgroundImage = `src="data:image/gif;base64,${gif}"`
const srcPattern = /src="data:image\/gif;base64,[^"]*"/
const afterMarker = html.slice(markerIndex + marker.length)

if (!srcPattern.test(afterMarker)) {
  throw new Error("Qubit background image source was not found")
}

const srcStart = markerIndex + marker.length
const updated = html.slice(0, srcStart) + afterMarker.replace(srcPattern, backgroundImage)
const compact = updated.replace(/^[ \t]*--qubit-background:[^\n]*\n/m, "  --qubit-background: none;\n")
fs.writeFileSync(htmlPath, compact)
