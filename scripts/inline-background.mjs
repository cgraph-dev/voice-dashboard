import fs from "node:fs"

const htmlPaths = ["frontend/index.html", "frontend/activity.html", "frontend/reports.html"]
const assetPath = "frontend/Logo/background.jpg"
const marker = "<!-- QUBIT_BACKGROUND_IMAGE -->"

if (!fs.existsSync(assetPath)) {
  throw new Error(`Qubit background source is missing: ${assetPath}`)
}

const image = fs.readFileSync(assetPath).toString("base64")
const backgroundImage = `<img class="background-image" aria-hidden="true" alt="" src="data:image/jpeg;base64,${image}">`
const imagePattern = /<img class="background-image"[^>]*>/gs

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
    const withoutExistingBackgrounds = afterMarker.replace(imagePattern, "")
    html = html.slice(0, contentStart) + `\n${backgroundImage}` + withoutExistingBackgrounds
  }

  fs.writeFileSync(htmlPath, html)
}

console.log("Qubit background: embedded background.jpg on talk, activity, and reports routes")
