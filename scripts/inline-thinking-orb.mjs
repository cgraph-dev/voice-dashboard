import fs from "node:fs"

const htmlPath = "frontend/index.html"
const bundlePath = "frontend/thinking-orb.js"
const start = "/* THINKING_ORB_BUNDLE_START */"
const end = "/* THINKING_ORB_BUNDLE_END */"

const html = fs.readFileSync(htmlPath, "utf8")
const bundle = fs.readFileSync(bundlePath, "utf8").replace(/[ \t]+$/gm, "")
const startIndex = html.indexOf(start)
const endIndex = html.indexOf(end)

if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) {
  throw new Error("ThinkingOrb bundle markers were not found in frontend/index.html")
}

const before = html.slice(0, startIndex + start.length)
const after = html.slice(endIndex)
fs.writeFileSync(htmlPath, `${before}\n${bundle}\n${after}`)
