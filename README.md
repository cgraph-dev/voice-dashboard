# Voice Dashboard (OpenClaw)

The web UI for your OpenClaw voice bridge. Two pages:

- **`frontend/index.html`** — the chat page: hold/tap to talk from any
  browser (phone included), or type a task. Your PC does all the work
  (ASR → routing → local 3B summary → TTS); the browser only records mic
  audio and plays the reply back.
- **`frontend/activity.html`** — the activity dashboard: live feed of what
  the agent did (recognized text, routing decision, status, the final
  spoken summary, latency, raw tool output behind each summary).

The pages are **static** — no build step, no framework. Edit the HTML/CSS/JS
and refresh.

## Quick start

The dashboard is served by the voice bridge on your PC (port 8890). This
repo is the source of truth for the pages — the bridge reads them from
here if the repo is checked out at the default path.

```bash
# 1. open the local dashboard
./open.sh

# 2. open the public tunnel URL (works from your phone, anywhere)
./open.sh --tunnel

# 3. print the current URL without opening
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

## Tunnel (how your PC is reachable from outside)

The bridge repo ships `scripts/voice-dashboard-tunnel.sh` + a systemd user
service (`voice-dashboard-tunnel.service`) that publishes port 8890 via a
Pinggy SSH tunnel when your PC is on:

```bash
systemctl --user enable --now voice-dashboard-tunnel.service
cat ~/.local/state/openclaw-voice-bridge/tunnel.url   # current public URL
```

Free tier: URL changes every 60 min (the service restarts automatically and
rewrites the file). Pinggy Pro gives a persistent subdomain.

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
