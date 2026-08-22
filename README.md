# Voice Dashboard (OpenClaw)

The web UI for your OpenClaw voice bridge. Two pages:

- **`frontend/index.html`** — the chat page: hold/tap to talk from any
  browser (phone included), or type a task. Your PC does all the work
  (ASR → routing → local 3B summary → TTS); the browser only records mic
  audio and plays the reply back.
- **`frontend/activity.html`** — the activity dashboard: live feed of what
  the assistant did (recognized text, routing decision, status, the final
  spoken summary, latency, raw tool output behind each summary).

The pages are **static** — no build step, no framework. Edit the HTML/CSS/JS
and refresh.

## Quick start

The dashboard is served by the voice bridge on your PC (port 8890). This
repo is the source of truth for the pages — the bridge reads them from
here if the repo is checked out at the default path.

```bash
# open the local dashboard
./open.sh

# or print the URL
./open.sh --url
```

If the bridge isn't serving your edits, check the path it reads:

```bash
systemctl --user status openclaw-voice-bridge   # bridge running?
```

## Configuration (the ⚙ gear in the page)

- **Local / LAN**: open `http://<pc-ip>:8890/` — same origin, nothing to set.
- **Vercel / outside**: deploy this repo to Vercel (static), then open
  `https://<your-app>.vercel.app/` and use the ⚙ gear to paste your PC's
  current tunnel URL + token. The values persist in your browser
  (localStorage). Alternatively pass `?api=<url>&token=<secret>`.
- The bridge accepts an optional `X-Api-Token` header (config `webui.token`)
  so a public tunnel can be gated.

## Deploy to Vercel

```bash
# one-time: install the CLI
npm i -g vercel

# from this repo
vercel --prod
```

`vercel.json` rewrites `/` → `index.html` and `/activity` → `activity.html`.
No serverless functions needed — it's pure static.

## Access

- **Localhost** (default): the bridge serves the dashboard at
  `http://127.0.0.1:8890` — open it with `./open.sh` or the `qubit` command.
- **Remote later**: deploy this repo to Vercel (static) and the page's ⚙ gear
  lets you point it at your PC (tunnel/API URL + token) when you set that up.

## Editing

The pages are plain HTML + vanilla JS. The only moving parts:

- `BASE` — API server URL (same-origin by default; from the ⚙ gear or
  `?api=`).
- `API_TOKEN` — optional secret sent as `X-Api-Token` on every request.
- The bridge API: `POST /api/talk` (raw Int16 PCM @16k mono) →
  `{request_id}`; poll `GET /api/result/<id>` →
  `{text, route, summary, audio_b64}`; `POST /api/type` (JSON `{text}`) for
  typed tasks; `GET /api/activity` for the feed.

Refresh the browser to see your edits — no rebuild.
