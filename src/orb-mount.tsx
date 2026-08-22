import { useEffect, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import { SiriWave } from "@/components/ui/siri-wave"
import { StarButton } from "@/components/ui/star-button"

type OrbState = "working" | "searching" | "solving" | "listening" | "connecting" | "weaving" | "composing" | "breathing" | "shaping"
type OrbEvent = CustomEvent<{ state?: OrbState }>

const speedByState: Record<OrbState, number> = {
  breathing: 0.42,
  connecting: 0.58,
  listening: 1.18,
  searching: 0.92,
  working: 1.02,
  solving: 1.08,
  composing: 1.42,
  weaving: 1.24,
  shaping: 0.82,
}

function OrbMount() {
  const [state, setState] = useState<OrbState>("breathing")

  useEffect(() => {
    const handleState = (event: Event) => {
      const next = (event as OrbEvent).detail?.state
      if (next) setState(next)
    }

    window.addEventListener("qubit:orb-state", handleState)
    return () => window.removeEventListener("qubit:orb-state", handleState)
  }, [])

  const speed = useMemo(() => speedByState[state], [state])
  const merge = useMemo(
    () => (state === "listening" || state === "searching" || state === "working" || state === "solving" || state === "composing" ? 1 : 0),
    [state],
  )
  return (
    <SiriWave
      variant="fluid-dots"
      size={360}
      renderScale={0.78}
      speed={speed}
      merge={merge}
      aria-label={state === "breathing" ? "Voice assistant standby" : `Voice assistant ${state}`}
    />
  )
}

const mount = document.getElementById("thinking-orb-mount")
if (mount) createRoot(mount).render(<OrbMount />)

const saveMount = document.getElementById("set-save-mount")
if (saveMount) {
  createRoot(saveMount).render(<StarButton>Save changes</StarButton>)
}
