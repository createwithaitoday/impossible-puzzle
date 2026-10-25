import { dist2, normalizeDeg, shortestAngleDelta, snapYaw } from './math'
import { edgeScreenPoint } from './project'
import type { AlignedLink, LevelDef, Link, Platform } from './types'

function platformMap(level: LevelDef): Map<string, Platform> {
  return new Map(level.platforms.map((p) => [p.id, p]))
}

export function linkScreenDistance(
  level: LevelDef,
  link: Link,
  yawDeg: number,
): { distance: number; a: { x: number; y: number }; b: { x: number; y: number } } | null {
  const map = platformMap(level)
  const from = map.get(link.from)
  const to = map.get(link.to)
  if (!from || !to) return null
  const a = edgeScreenPoint(from, link.fromEdge, yawDeg)
  const b = edgeScreenPoint(to, link.toEdge, yawDeg)
  return { distance: dist2(a, b), a, b }
}

/** Links whose edge midpoints project within the level tolerance. */
export function alignedLinks(level: LevelDef, yawDeg: number): AlignedLink[] {
  const out: AlignedLink[] = []
  for (const link of level.links) {
    const hit = linkScreenDistance(level, link, yawDeg)
    if (!hit) continue
    if (hit.distance <= level.tolerance) {
      out.push({ link, distance: hit.distance, a: hit.a, b: hit.b })
    }
  }
  return out
}

export function isSolvedAtYaw(level: LevelDef, yawDeg: number): boolean {
  const yaw = snapYaw(yawDeg, level.snapDeg)
  const aligned = alignedLinks(level, yaw)
  const trueAligned = new Set(
    aligned.filter((a) => a.link.kind === 'true').map((a) => linkKey(a.link)),
  )
  const required = level.links.filter((l) => l.kind === 'true')
  if (required.length === 0) return false
  // Need a connected true path from start to goal using only currently aligned true links.
  return canReachOnKeys(level, trueAligned)
}

function linkKey(link: Link): string {
  return `${link.from}->${link.to}:${link.fromEdge}-${link.toEdge}:${link.kind}`
}

function canReachOnKeys(level: LevelDef, keys: Set<string>): boolean {
  const adj = new Map<string, string[]>()
  for (const p of level.platforms) adj.set(p.id, [])
  for (const link of level.links) {
    if (link.kind !== 'true') continue
    if (!keys.has(linkKey(link))) continue
    adj.get(link.from)?.push(link.to)
    adj.get(link.to)?.push(link.from)
  }
  const seen = new Set<string>([level.startId])
  const q = [level.startId]
  while (q.length) {
    const cur = q.shift()!
    if (cur === level.goalId) return true
    for (const n of adj.get(cur) ?? []) {
      if (seen.has(n)) continue
      seen.add(n)
      q.push(n)
    }
  }
  return false
}

/** Sample yaws and return those that solve (used by tests / tooling). */
export function findSolvingYaws(
  level: LevelDef,
  stepDeg = 1,
): number[] {
  const hits: number[] = []
  for (let y = 0; y < 360; y += stepDeg) {
    if (isSolvedAtYaw(level, y)) hits.push(normalizeDeg(y))
  }
  return hits
}

export function nearAuthoredSolution(level: LevelDef, yawDeg: number): boolean {
  return Math.abs(shortestAngleDelta(yawDeg, level.solutionYaw)) <= level.solutionYawWindow
}
