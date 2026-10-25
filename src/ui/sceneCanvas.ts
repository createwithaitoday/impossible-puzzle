import {
  alignedLinks,
  edgeScreenPoint,
  platformCorners,
  projectPoint,
  type LevelDef,
  type ScreenPoint,
} from '../sim'

const ACCENT: Record<string, string> = {
  cyan: '#00f0ff',
  magenta: '#ff2bd6',
  neutral: '#8b93a7',
  start: '#00f0ff',
  goal: '#ff2bd6',
}

export type SceneDrawState = {
  level: LevelDef
  yaw: number
  walkerId: string | null
  walkerT: number
  walkPath: string[]
  showGhostSeams: boolean
  pulse: number
  falling: boolean
}

function bounds(points: ScreenPoint[]): {
  minX: number
  maxX: number
  minY: number
  maxY: number
} {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const p of points) {
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y)
  }
  return { minX, maxX, minY, maxY }
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: SceneDrawState,
): void {
  const { level, yaw } = state
  ctx.clearRect(0, 0, w, h)

  // Ink atmosphere
  const g = ctx.createRadialGradient(w * 0.5, h * 0.35, 20, w * 0.5, h * 0.5, w * 0.7)
  g.addColorStop(0, '#0c1020')
  g.addColorStop(0.55, '#07080f')
  g.addColorStop(1, '#05060a')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  // Subtle grid vanishing lines
  ctx.save()
  ctx.globalAlpha = 0.08
  ctx.strokeStyle = '#00f0ff'
  ctx.lineWidth = 1
  for (let i = -6; i <= 6; i++) {
    ctx.beginPath()
    ctx.moveTo(w * 0.5 + i * 28, h * 0.15)
    ctx.lineTo(w * 0.5 + i * 90, h)
    ctx.stroke()
  }
  ctx.restore()

  const allPts: ScreenPoint[] = []
  for (const p of level.platforms) {
    allPts.push(...platformCorners(p, yaw))
    allPts.push(projectPoint(p.pos, yaw))
  }
  if (allPts.length === 0) return
  const b = bounds(allPts)
  const pad = 48
  const bw = Math.max(0.001, b.maxX - b.minX)
  const bh = Math.max(0.001, b.maxY - b.minY)
  const scale = Math.min((w - pad * 2) / bw, (h - pad * 2) / bh) * 0.92
  const cx = (b.minX + b.maxX) / 2
  const cy = (b.minY + b.maxY) / 2

  const toScreen = (p: ScreenPoint): ScreenPoint => ({
    x: w / 2 + (p.x - cx) * scale,
    y: h / 2 + (p.y - cy) * scale,
  })

  // Depth sort platforms by projected y then z-ish
  const sorted = [...level.platforms].sort((a, c) => {
    const pa = projectPoint(a.pos, yaw)
    const pc = projectPoint(c.pos, yaw)
    return pa.y - pc.y || a.pos.y - c.pos.y
  })

  const aligned = alignedLinks(level, yaw)

  // Seams
  for (const a of aligned) {
    const A = toScreen(a.a)
    const B = toScreen(a.b)
    ctx.save()
    ctx.lineWidth = a.link.kind === 'decoy' ? 2 : 3
    ctx.strokeStyle = a.link.kind === 'decoy' ? '#ff2bd6' : '#00f0ff'
    ctx.globalAlpha = a.link.kind === 'decoy' ? 0.55 + 0.25 * Math.sin(state.pulse) : 0.85
    ctx.setLineDash(a.link.kind === 'decoy' ? [6, 6] : [])
    ctx.beginPath()
    ctx.moveTo(A.x, A.y)
    ctx.lineTo(B.x, B.y)
    ctx.stroke()
    ctx.restore()
  }

  if (state.showGhostSeams) {
    for (const link of level.links) {
      if (aligned.some((a) => a.link === link)) continue
      const from = level.platforms.find((p) => p.id === link.from)
      const to = level.platforms.find((p) => p.id === link.to)
      if (!from || !to) continue
      const A = toScreen(edgeScreenPoint(from, link.fromEdge, yaw))
      const B = toScreen(edgeScreenPoint(to, link.toEdge, yaw))
      ctx.save()
      ctx.globalAlpha = 0.12
      ctx.strokeStyle = '#8b93a7'
      ctx.setLineDash([3, 8])
      ctx.beginPath()
      ctx.moveTo(A.x, A.y)
      ctx.lineTo(B.x, B.y)
      ctx.stroke()
      ctx.restore()
    }
  }

  for (const plat of sorted) {
    const corners = platformCorners(plat, yaw).map(toScreen)
    const color = ACCENT[plat.accent] ?? ACCENT.neutral

    // Side face
    const drop = 14 + plat.pos.y * 4
    ctx.beginPath()
    ctx.moveTo(corners[0]!.x, corners[0]!.y)
    for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i]!.x, corners[i]!.y)
    ctx.closePath()
    ctx.save()
    ctx.fillStyle = '#0a0c14'
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.95
    ctx.lineWidth = 1.5
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    // Extrusion hint
    ctx.save()
    ctx.globalAlpha = 0.35
    ctx.strokeStyle = color
    ctx.beginPath()
    for (const c of corners) {
      ctx.moveTo(c.x, c.y)
      ctx.lineTo(c.x, c.y + drop)
    }
    ctx.stroke()
    ctx.restore()

    // Top fill wash
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(corners[0]!.x, corners[0]!.y)
    for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i]!.x, corners[i]!.y)
    ctx.closePath()
    const mid = toScreen(projectPoint(plat.pos, yaw))
    const tg = ctx.createRadialGradient(mid.x, mid.y, 4, mid.x, mid.y, 60)
    tg.addColorStop(0, color + '55')
    tg.addColorStop(1, '#05060a00')
    ctx.fillStyle = tg
    ctx.fill()
    ctx.restore()

    // Label markers for start/goal
    if (plat.accent === 'start' || plat.accent === 'goal') {
      ctx.save()
      ctx.fillStyle = color
      ctx.globalAlpha = 0.9
      ctx.beginPath()
      ctx.arc(mid.x, mid.y, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  // Walker
  if (state.walkerId) {
    const idx = Math.max(0, state.walkPath.indexOf(state.walkerId))
    const cur = level.platforms.find((p) => p.id === state.walkerId)
    if (cur) {
      let pos = projectPoint(cur.pos, yaw)
      if (state.walkPath.length >= 2 && idx < state.walkPath.length - 1) {
        const nextId = state.walkPath[idx + 1]!
        const next = level.platforms.find((p) => p.id === nextId)
        if (next) {
          const a = projectPoint(cur.pos, yaw)
          const b = projectPoint(next.pos, yaw)
          pos = {
            x: a.x + (b.x - a.x) * state.walkerT,
            y: a.y + (b.y - a.y) * state.walkerT,
          }
        }
      }
      const s = toScreen(pos)
      const fallY = state.falling ? state.walkerT * 80 : 0
      ctx.save()
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = '#00f0ff'
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.arc(s.x, s.y + fallY, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }
}
