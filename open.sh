#!/usr/bin/env bash
# voice-dashboard — open the Voice Dashboard (localhost).
#
#   ./open.sh      open the local dashboard (http://127.0.0.1:8890)
#   ./open.sh --url  print the URL without opening
#
# The dashboard is served by the OpenClaw voice bridge (systemd user service
# openclaw-voice-bridge.service, port 8890). Localhost only — deploy the
# frontend/ folder to Vercel when you want remote access.
set -euo pipefail

case "${1:-}" in
  --url)
    echo "http://127.0.0.1:8890"
    ;;
  *)
    echo "Opening http://127.0.0.1:8890"
    xdg-open "http://127.0.0.1:8890" >/dev/null 2>&1 || true
    ;;
esac
