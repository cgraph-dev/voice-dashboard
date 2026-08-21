#!/usr/bin/env bash
# voice-dashboard — open the Voice Dashboard (your PC's web UI).
#
#   ./open.sh          open the local dashboard (http://127.0.0.1:8890)
#   ./open.sh --tunnel open the CURRENT public tunnel URL (works from anywhere)
#   ./open.sh --url    print the URL without opening
#
# The dashboard is served by the OpenClaw voice bridge (systemd user service
# openclaw-voice-bridge.service, port 8890). The tunnel service
# (voice-dashboard-tunnel.service) publishes a public URL when your PC is on.
set -euo pipefail

TUNNEL_URLFILE="${VOICE_TUNNEL_URLFILE:-$HOME/.local/state/openclaw-voice-bridge/tunnel.url}"

local_url() { echo "http://127.0.0.1:8890"; }

tunnel_url() {
  if [ -f "$TUNNEL_URLFILE" ]; then
    cat "$TUNNEL_URLFILE"
  else
    echo "" >&2
  fi
}

case "${1:-}" in
  --url)
    local_url
    ;;
  --tunnel)
    U=$(tunnel_url)
    if [ -z "$U" ]; then
      echo "No tunnel URL yet — is voice-dashboard-tunnel.service running?" >&2
      echo "  systemctl --user start voice-dashboard-tunnel.service" >&2
      exit 1
    fi
    echo "$U"
    ;;
  --tunnel-url)
    tunnel_url
    ;;
  *)
    U=$(local_url)
    echo "Opening $U"
    xdg-open "$U" >/dev/null 2>&1 || true
    ;;
esac
