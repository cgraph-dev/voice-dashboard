import fs from "node:fs"

const css = fs.readFileSync("frontend/shared-ui.css", "utf8")
const start = "/* SHARED_UI_STYLES_START */"
const end = "/* SHARED_UI_STYLES_END */"

for (const htmlPath of ["frontend/index.html", "frontend/activity.html"]) {
  const html = fs.readFileSync(htmlPath, "utf8")
  const startIndex = html.indexOf(start)
  const endIndex = html.indexOf(end)
  if (startIndex < 0 || endIndex < startIndex) throw new Error(`Shared style markers missing in ${htmlPath}`)
  const next = html.slice(0, startIndex + start.length) + `\n${css}\n` + html.slice(endIndex)
  fs.writeFileSync(htmlPath, next)
}
