import { alignedLinks } from './align'
import { snapYaw } from './math'
import type { LevelDef, WalkResult } from './types'

/**
 * Attempt to walk from start to goal at the current yaw.
 * Uses every visually aligned link (true + decoy). If the shortest path
 * includes a decoy edge, the walker falls. If only true links connect
 * start→goal, the walk succeeds.
 */
export function attemptWalk(level: LevelDef, yawDeg: number): WalkResult {
  const yaw = snapYaw(yawDeg, level.snapDeg)
  const aligned = alignedLinks(level, yaw)
  if (aligned.length === 0) {
    return { ok: false, reason: 'no-path', path: [level.startId] }
  }

  type Edge = { to: string; decoy: boolean }
  const adj = new Map<string, Edge[]>()
  for (const p of level.platforms) adj.set(p.id, [])
  for (const a of aligned) {
    const decoy = a.link.kind === 'decoy'
    adj.get(a.link.from)?.push({ to: a.link.to, decoy })
    adj.get(a.link.to)?.push({ to: a.link.from, decoy })
  }

  // BFS preferring shorter paths, then paths that avoid decoys.
  type Node = { id: string; path: string[]; usedDecoy: boolean }
  const q: Node[] = [{ id: level.startId, path: [level.startId], usedDecoy: false }]
  const bestScore = new Map<string, number>()
  const scoreOf = (len: number, decoy: boolean) => len * 2 + (decoy ? 1 : 0)
  bestScore.set(level.startId, scoreOf(1, false))

  let goalHit: Node | null = null
  while (q.length) {
    const cur = q.shift()!
    if (cur.id === level.goalId) {
      goalHit = cur
      break
    }
    for (const e of adj.get(cur.id) ?? []) {
      const nextDecoy = cur.usedDecoy || e.decoy
      const nextPath = [...cur.path, e.to]
      const score = scoreOf(nextPath.length, nextDecoy)
      const prev = bestScore.get(e.to)
      if (prev !== undefined && prev <= score) continue
      bestScore.set(e.to, score)
      q.push({ id: e.to, path: nextPath, usedDecoy: nextDecoy })
    }
  }

  if (!goalHit) {
    // Prefer a true-only path search for a clearer fail reason
    const trueOnly = aligned.filter((a) => a.link.kind === 'true')
    if (trueOnly.length === 0) {
      return { ok: false, reason: 'gap', path: [level.startId] }
    }
    return { ok: false, reason: 'no-path', path: [level.startId] }
  }

  if (goalHit.usedDecoy) {
    return {
      ok: false,
      reason: 'decoy',
      path: goalHit.path,
      fellAt: goalHit.path[goalHit.path.length - 1],
    }
  }

  return { ok: true, path: goalHit.path }
}

/** Whether a true path exists at this yaw (win condition without walking decoys). */
export function hasTruePath(level: LevelDef, yawDeg: number): boolean {
  const yaw = snapYaw(yawDeg, level.snapDeg)
  const aligned = alignedLinks(level, yaw).filter((a) => a.link.kind === 'true')
  const adj = new Map<string, string[]>()
  for (const p of level.platforms) adj.set(p.id, [])
  for (const a of aligned) {
    adj.get(a.link.from)?.push(a.link.to)
    adj.get(a.link.to)?.push(a.link.from)
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
