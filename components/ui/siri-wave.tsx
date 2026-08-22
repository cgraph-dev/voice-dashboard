"use client"

import * as React from "react"

/** The 21st.dev Siri-style fluid-dots WebGL voice blob. */
export type SiriWaveVariant = "fluid-dots"

const VERTEX_SHADER = `attribute vec2 aPos; void main(){ gl_Position=vec4(aPos,0.0,1.0); }`

const FLUID_DOTS_SHADER = `precision highp float;
uniform vec2 iResolution; uniform float iTime; uniform float iMerge; uniform float iClose;
const float TAU = 6.28318530718;
const int N = 6;
const float SMOOTH_K = 0.08;
const float INTENSITY = 0.0025;
const float FALLOFF_P = 1.35;
const float FADE_START = 0.02;
const float FADE_END = 0.20;
const float ABERR = 0.005;
const vec3 SPECTRAL = vec3(0.0, 0.5, 1.0) * ABERR;
const float HUE_SPEED = 0.06;
const float COLOR_K = 0.5;
const float SAT = 0.01;
const float HUE_SPAN = 0.667;
const float MERGE_PERIOD = 6.0;
const float T_MOVE = 1.25;
const float STAGGER = 0.33;
const float HOLD = 0.0;
const float W = 4.6;
const float L = 3.2;
const float PIERCE = 0.12;
const float RECOIL = 0.035;
const float REC_LAG = 0.11;
const float GATHER_PERIOD = 12.0;
const float GATHER_START = 9.2;
const float GATHER_HOLD = 0.8;
const float GATHER_R = 0.008;
const float GATHER_DIM = 0.85;
const float GATHER_IN = 1.8;
const float GATHER_IN_L = 7.5;
const float BURST_W = 6.5;
const float BURST_L = 4.0;
const float CHARGE_T = 0.30;
const float CHARGE_SHRK = 0.18;
const float CHARGE_GLOW = 0.35;
const float FLASH_GAIN = 1.2;
const float FLASH_DECAY = 7.0;

float hash11(float n){ return fract(sin(n*127.1 + 311.7)*43758.5453); }
float settleWL(float tau, float w, float l){
  if(tau <= 0.0) return 0.0;
  return 1.0 - exp(-l*tau)*cos(w*tau);
}
float settle(float tau){ return settleWL(tau, W, L); }
float settleCrit(float tau, float l){
  if(tau <= 0.0) return 0.0;
  return 1.0 - exp(-l*tau)*(1.0 + l*tau);
}
float smin(float a, float b, float k){
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h*h*k*0.25;
}
vec3 hue2rgb(float h){
  h = fract(h);
  float r = clamp(abs(h*6.0 - 3.0) - 1.0, 0.0, 1.0);
  float g = clamp(2.0 - abs(h*6.0 - 2.0), 0.0, 1.0);
  float b = clamp(2.0 - abs(h*6.0 - 4.0), 0.0, 1.0);
  return vec3(r, g, b);
}
float dotR(float fi, float seed, float t){
  return 0.060 + 0.013*sin(t*1.3 + seed*TAU) + 0.006*sin(t*2.4 + fi*1.3);
}
float dotSD(vec2 p, vec2 pos, float r, float t, float fi, float shapeDamp){
  vec2 d = p - pos;
  float sq = 0.075 * (0.5 + 0.5*sin(t*0.9 + fi*2.0)) * shapeDamp;
  float ca = cos(t*0.35 + fi), sa = sin(t*0.35 + fi);
  d = mat2(ca,-sa,sa,ca) * d;
  d *= vec2(1.0+sq, 1.0-sq);
  return length(d) - r;
}
vec3 scene(vec2 p, float t){
  float mergeAmount = clamp(iMerge, 0.0, 1.0);
  float closeAmount = clamp(iClose, 0.0, 1.0);
  float k = floor(t/MERGE_PERIOD);
  float u = fract(t/MERGE_PERIOD);
  float te = u * MERGE_PERIOD;
  float tg = mod(t, GATHER_PERIOD);
  float g = settleCrit((tg - GATHER_START) * GATHER_IN, GATHER_IN_L)
    - settleWL(tg - GATHER_START - GATHER_HOLD, BURST_W, BURST_L);
  g *= mergeAmount;
  float gC = clamp(g, 0.0, 1.0);
  float tb = tg - (GATHER_START + GATHER_HOLD);
  float charge = smoothstep(-CHARGE_T, 0.0, min(tb, 0.0)) * gC;
  float flash = tb > 0.0 ? exp(-tb * FLASH_DECAY) : 0.0;
  float gBright = mix(1.0, GATHER_DIM, gC) * (1.0 + CHARGE_GLOW*charge + FLASH_GAIN*flash);
  vec3 total3 = vec3(1e5);
  vec3 cAcc = vec3(0.0);
  float wAcc = 1e-6;
  for(int i=0; i<N; i++){
    float fi = float(i);
    float seed = hash11(fi);
    float ang = fi/float(N)*TAU + t*0.35;
    vec2 dir = vec2(cos(ang), sin(ang));
    float R = 0.32 + 0.014*sin(t*1.0) + 0.009*sin(t*1.3 + seed*TAU);
    float pairId = mod(fi, 3.0);
    float moverLow = mod(k + pairId, 2.0);
    float isMover = (fi < 2.5) ? step(moverLow, 0.5) : step(0.5, moverLow);
    float goStart = pairId * STAGGER;
    float retStart = 3.0*STAGGER + HOLD + pairId * STAGGER;
    float m = (settle(te - goStart) - settle(te - retStart)) * isMover * mergeAmount;
    float rec = (settle(te - goStart - REC_LAG) - settle(te - retStart - REC_LAG)) * (1.0 - isMover) * mergeAmount;
    float rSelf = dotR(fi, seed, t);
    rSelf = mix(rSelf, 0.060, gC);
    rSelf *= 1.0 - CHARGE_SHRK * charge;
    float fj = mod(fi + 3.0, 6.0);
    float rPart = dotR(fj, hash11(fj), t);
    float deep = -(R + RECOIL) - PIERCE * rPart;
    float radial = mix(R, deep, m) + RECOIL * rec;
    radial = mix(radial, GATHER_R, g);
    radial = mix(radial, GATHER_R, closeAmount);
    vec2 pos = radial * dir;
    float sdR = dotSD(p - SPECTRAL.r*dir, pos, rSelf, t, fi, 1.0 - gC);
    float sdG = dotSD(p - SPECTRAL.g*dir, pos, rSelf, t, fi, 1.0 - gC);
    float sdB = dotSD(p - SPECTRAL.b*dir, pos, rSelf, t, fi, 1.0 - gC);
    total3 = vec3(smin(total3.r, sdR, SMOOTH_K), smin(total3.g, sdG, SMOOTH_K), smin(total3.b, sdB, SMOOTH_K));
    float hue = fract(fi/float(N) + t*HUE_SPEED) * HUE_SPAN;
    vec3 dotCol = mix(vec3(1.0), hue2rgb(hue), SAT);
    float w = exp(-sdG * COLOR_K);
    cAcc += w * dotCol;
    wAcc += w;
  }
  vec3 sd3 = max(total3, vec3(0.0)) + 1e-4;
  vec3 core3 = clamp(INTENSITY / pow(sd3, vec3(FALLOFF_P)), 0.0, 1.0);
  vec3 edge3 = 1.0 - smoothstep(vec3(FADE_START), vec3(FADE_END), sd3);
  vec3 bright = core3 * edge3 * gBright;
  float nearestSd = min(min(sd3.r, sd3.g), sd3.b);
  float dotMask = 1.0 - smoothstep(0.02, 0.10, nearestSd);
  return bright * (cAcc / wAcc) * dotMask;
}
void mainImage(out vec4 fragColor, in vec2 fragCoord){
  vec2 res = iResolution.xy;
  vec2 p = (2.0*fragCoord - res) / min(res.x, res.y);
  float t = iTime;
  p /= 1.0 + 0.03*sin(t*1.0);
  vec3 col = scene(p, t);
  col *= 1.0 + 0.05*sin(t*1.0 + 1.0);
  col = pow(col, vec3(1.0/1.2));
  col = min(col, 1.0);
  float alpha = clamp(max(max(col.r, col.g), col.b) * 1.8, 0.0, 1.0);
  float n = fract(sin(dot(fragCoord, vec2(12.9898,78.233)))*43758.5453);
  col += ((n - 0.5)/255.0) * alpha;
  if (alpha < 0.001) discard;
  fragColor = vec4(col, alpha);
}
void main(){ mainImage(gl_FragColor, gl_FragCoord.xy); }`

export interface SiriWaveProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  variant?: SiriWaveVariant
  size?: number
  renderScale?: number
  speed?: number
  /** 0 keeps the six dots in a calm orbit; 1 enables the supplied mix/gather motion. */
  merge?: number
}

export function SiriWave({
  variant = "fluid-dots",
  size = 240,
  renderScale = 0.75,
  speed = 1,
  merge = 1,
  className,
  style,
  ...props
}: SiriWaveProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const speedRef = React.useRef(speed)
  const mergeRef = React.useRef(Math.max(0, Math.min(1, merge)))
  speedRef.current = speed
  mergeRef.current = Math.max(0, Math.min(1, merge))

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dimension = Math.max(64, Math.round(size * renderScale))
    canvas.width = dimension
    canvas.height = dimension
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false })

    let currentMerge = mergeRef.current
    let previousTarget = currentMerge
    let closeStartedAt: number | null = null
    let timeline = 0
    let previousFrame = performance.now()
    const advanceMotion = (now: number) => {
      const delta = Math.min(0.05, Math.max(0, (now - previousFrame) / 1000))
      previousFrame = now
      const target = mergeRef.current
      // A new active state always wins over a pending close. Promote the
      // orbit immediately so starting a recording never gathers the dots
      // before the listening mix begins.
      if (target > previousTarget) {
        closeStartedAt = null
        currentMerge = Math.max(currentMerge, target)
      }
      if (target > 0.5 && previousTarget <= 0.5) closeStartedAt = null
      if (target <= 0.5 && previousTarget > 0.5) closeStartedAt = now
      previousTarget = target

      let close = 0
      if (closeStartedAt !== null) {
        const progress = Math.min(1, (now - closeStartedAt) / 1000)
        if (progress < 0.38) {
          const phase = progress / 0.38
          close = phase * phase * (3 - 2 * phase)
          currentMerge = 1
        } else if (progress < 1) {
          const phase = (progress - 0.38) / 0.62
          const eased = phase * phase * (3 - 2 * phase)
          close = 1 - eased
          currentMerge = 1 - eased
        } else {
          closeStartedAt = null
          currentMerge = 0
        }
      } else {
        const follow = 1 - Math.exp(-delta * 8)
        currentMerge += (target - currentMerge) * follow
      }

      timeline += delta * speedRef.current
      return { time: timeline, merge: currentMerge, close }
    }

    if (!gl) {
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      let frame = 0
      let active = true
      const drawFallback = (now: number) => {
        if (!active) return
        const motion = advanceMotion(now)
        const t = motion.time
        const energy = Math.min(1.8, Math.max(.7, speedRef.current / .42))
        const mixCycle = (Math.sin(t * (.45 + energy * .22)) + 1) / 2
        const mergeCycle = motion.merge * mixCycle
        const orbitRadius = dimension * (.32 + .1 * (1 - mergeCycle))
        const radius = orbitRadius * (1 - motion.close) + dimension * .015 * motion.close
        const dotRadius = dimension * (.06 + .012 * Math.sin(t * 1.3))
        ctx.clearRect(0, 0, dimension, dimension)
        ctx.save()
        ctx.translate(dimension / 2, dimension / 2)
        ctx.rotate(t * .35)
        ctx.globalCompositeOperation = "lighter"
        for (let index = 0; index < 6; index += 1) {
          const angle = (index / 6) * Math.PI * 2
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius
          const glow = ctx.createRadialGradient(x, y, 0, x, y, dotRadius * 3.8)
          glow.addColorStop(0, "rgba(255,255,255,.98)")
          glow.addColorStop(.3, "rgba(255,255,255,.7)")
          glow.addColorStop(1, "rgba(255,255,255,0)")
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(x, y, dotRadius * 3.8, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = "rgba(255,255,255,.92)"
          ctx.beginPath()
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
        frame = requestAnimationFrame(drawFallback)
      }
      frame = requestAnimationFrame(drawFallback)
      return () => {
        active = false
        cancelAnimationFrame(frame)
      }
    }

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) throw new Error("Unable to create WebGL shader")
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader)
        gl.deleteShader(shader)
        throw new Error(log ?? "shader compile error")
      }
      return shader
    }

    let program: WebGLProgram | null = null
    let buffer: WebGLBuffer | null = null
    let vertex: WebGLShader | null = null
    let fragment: WebGLShader | null = null
    try {
      program = gl.createProgram()
      vertex = compile(gl.VERTEX_SHADER, VERTEX_SHADER)
      fragment = compile(gl.FRAGMENT_SHADER, FLUID_DOTS_SHADER)
      if (!program) throw new Error("Unable to create WebGL program")
      gl.attachShader(program, vertex)
      gl.attachShader(program, fragment)
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "shader link error")
      gl.useProgram(program)

      buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
      const position = gl.getAttribLocation(program, "aPos")
      gl.enableVertexAttribArray(position)
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

      const resolution = gl.getUniformLocation(program, "iResolution")
      const time = gl.getUniformLocation(program, "iTime")
      const mergeUniform = gl.getUniformLocation(program, "iMerge")
      const closeUniform = gl.getUniformLocation(program, "iClose")
      gl.viewport(0, 0, dimension, dimension)
      gl.clearColor(0, 0, 0, 0)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      let frame = 0
      let active = true
      const draw = (now: number) => {
        if (!active) return
        const motion = advanceMotion(now)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.uniform2f(resolution, dimension, dimension)
        gl.uniform1f(time, motion.time)
        gl.uniform1f(mergeUniform, motion.merge)
        gl.uniform1f(closeUniform, motion.close)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
        frame = requestAnimationFrame(draw)
      }
      frame = requestAnimationFrame(draw)

      return () => {
        active = false
        cancelAnimationFrame(frame)
        if (buffer) gl.deleteBuffer(buffer)
        if (program) gl.deleteProgram(program)
        if (vertex) gl.deleteShader(vertex)
        if (fragment) gl.deleteShader(fragment)
      }
    } catch (error) {
      console.error("SiriWave failed to initialize", error)
      if (program) gl.deleteProgram(program)
      if (buffer) gl.deleteBuffer(buffer)
      if (vertex) gl.deleteShader(vertex)
      if (fragment) gl.deleteShader(fragment)
    }
  }, [variant, size, renderScale])

  return <canvas ref={canvasRef} className={className} style={{ display: "block", width: size, height: size, ...style }} {...props} />
}

export default SiriWave
