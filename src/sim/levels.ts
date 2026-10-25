import { decoyNear, placePlatformAligned } from './buildLevel'
import type { LevelDef, Link, Platform, PlatformAccent } from './types'

function startPad(id = 'a'): Platform {
  return {
    id,
    pos: { x: 0, y: 0, z: 0 },
    halfW: 1,
    halfD: 1,
    accent: 'start',
  }
}

function trueLink(
  from: string,
  to: string,
  fromEdge: Link['fromEdge'],
  toEdge: Link['toEdge'],
): Link {
  return { from, to, fromEdge, toEdge, kind: 'true' }
}

function decoyLink(
  from: string,
  to: string,
  fromEdge: Link['fromEdge'],
  toEdge: Link['toEdge'],
): Link {
  return { from, to, fromEdge, toEdge, kind: 'decoy' }
}

function chain(
  yaw: number,
  steps: Array<{
    id: string
    fromEdge?: Link['fromEdge']
    toEdge?: Link['toEdge']
    heightDelta?: number
    halfW?: number
    halfD?: number
    accent?: PlatformAccent
    depth?: number
    screenGap?: number
  }>,
): { platforms: Platform[]; links: Link[] } {
  const platforms: Platform[] = [startPad('a')]
  const links: Link[] = []
  let prev = platforms[0]!
  for (const step of steps) {
    const fromEdge = step.fromEdge ?? 'e'
    const toEdge = step.toEdge ?? 'w'
    const next = placePlatformAligned({
      id: step.id,
      fromPos: prev.pos,
      fromHalfW: prev.halfW,
      fromHalfD: prev.halfD,
      fromEdge,
      toEdge,
      yawDeg: yaw,
      heightDelta: step.heightDelta ?? 0,
      halfW: step.halfW,
      halfD: step.halfD,
      accent: step.accent,
      depth: step.depth,
      screenGap: step.screenGap,
    })
    platforms.push(next)
    links.push(trueLink(prev.id, next.id, fromEdge, toEdge))
    prev = next
  }
  const last = platforms[platforms.length - 1]!
  if (last.id !== 'a') last.accent = 'goal'
  return { platforms, links }
}

function level(
  partial: Omit<LevelDef, 'platforms' | 'links' | 'startId' | 'goalId'> & {
    platforms: Platform[]
    links: Link[]
    startId?: string
    goalId?: string
  },
): LevelDef {
  const startId = partial.startId ?? 'a'
  const markedGoal = partial.platforms.find((p) => p.accent === 'goal')?.id
  const goalId = partial.goalId ?? markedGoal ?? 'b'
  return {
    ...partial,
    startId,
    goalId,
  }
}

const L1 = chain(8, [{ id: 'b', accent: 'goal' }])
const L2 = chain(14, [
  { id: 'm', heightDelta: 0.35, accent: 'cyan' },
  { id: 'b', heightDelta: -0.2, accent: 'goal' },
])
const L3 = chain(28, [
  { id: 'm', heightDelta: 1.2, fromEdge: 'e', toEdge: 'w', accent: 'magenta' },
  { id: 'b', heightDelta: -1.0, fromEdge: 's', toEdge: 'n', accent: 'goal' },
])

const L4base = chain(10, [
  { id: 'm', heightDelta: 0.2, accent: 'cyan' },
  { id: 'b', accent: 'goal' },
])
const L4fake = decoyNear('fake', L4base.platforms[1]!, 70)
L4base.platforms.push(L4fake)
L4base.links.push(decoyLink('a', 'fake', 'n', 's'), decoyLink('fake', 'b', 'e', 'w'))

const L5 = chain(30, [
  { id: 'm', heightDelta: 0.45, accent: 'cyan' },
  { id: 'b', heightDelta: -0.3, fromEdge: 'e', toEdge: 'n', accent: 'goal' },
])

const L6base = chain(16, [
  { id: 'v', heightDelta: 0.15, accent: 'cyan' },
  { id: 'b', accent: 'goal' },
])
const L6u = decoyNear('u', L6base.platforms[1]!, 110)
L6base.platforms.push(L6u)
L6base.links.push(decoyLink('a', 'u', 'n', 's'), decoyLink('u', 'b', 'e', 'w'))

const L7 = chain(22, [
  { id: 'm1', heightDelta: 0.55, accent: 'cyan' },
  { id: 'm2', heightDelta: 0.55, fromEdge: 'e', toEdge: 's', accent: 'magenta' },
  { id: 'b', heightDelta: -0.9, accent: 'goal' },
])

const L8base = chain(12, [
  { id: 'm', heightDelta: 0.7, accent: 'cyan' },
  { id: 'b', heightDelta: -0.5, accent: 'goal' },
])
const L8trap = decoyNear('trap', L8base.platforms[1]!, 95)
L8base.platforms.push(L8trap)
L8base.links.push(decoyLink('a', 'trap', 'n', 's'), decoyLink('trap', 'b', 'e', 'n'))

const L9base = chain(34, [
  { id: 'low', accent: 'cyan' },
  { id: 'b', accent: 'goal' },
])
const L9high: Platform = {
  id: 'high',
  pos: {
    x: L9base.platforms[1]!.pos.x,
    y: L9base.platforms[1]!.pos.y + 1.6,
    z: L9base.platforms[1]!.pos.z,
  },
  halfW: 0.85,
  halfD: 0.85,
  accent: 'magenta',
}
L9base.platforms.push(L9high)
L9base.links.push(decoyLink('a', 'high', 'e', 'w'), decoyLink('high', 'b', 'e', 'w'))

const L10base = chain(15, [
  { id: 'e', heightDelta: 0.25, accent: 'cyan' },
  { id: 'b', accent: 'goal' },
])
const L10n = decoyNear('n', L10base.platforms[0]!, 180)
L10n.pos = { x: 0.3, y: 0.7, z: -2.8 }
L10base.platforms.push(L10n)
L10base.links.push(decoyLink('a', 'n', 'n', 's'), decoyLink('n', 'b', 'e', 'n'))

const L11base = chain(18, [
  { id: 'b', heightDelta: 0.35, accent: 'cyan' },
  { id: 'c', heightDelta: 0.45, fromEdge: 'e', toEdge: 's', accent: 'cyan' },
  { id: 'g', heightDelta: -0.7, accent: 'goal' },
])
const L11x = decoyNear('x', L11base.platforms[1]!, 100)
L11base.platforms.push(L11x)
L11base.links.push(decoyLink('a', 'x', 'n', 's'), decoyLink('x', 'g', 'e', 'w'))

const L12base = chain(20, [
  { id: 'm', heightDelta: 0.6, accent: 'cyan' },
  { id: 'b', heightDelta: -0.4, fromEdge: 'e', toEdge: 'n', accent: 'goal' },
])
const L12trap = decoyNear('trap', L12base.platforms[1]!, 85)
L12base.platforms.push(L12trap)
L12base.links.push(decoyLink('a', 'trap', 'n', 's'), decoyLink('trap', 'b', 'e', 'w'))

const L13base = chain(9, [
  { id: 'm', heightDelta: 0.2, accent: 'cyan' },
  { id: 'b', accent: 'goal' },
])
const L13d1 = decoyNear('d1', L13base.platforms[1]!, 75)
const L13d2 = decoyNear('d2', L13base.platforms[2]!, 120)
L13base.platforms.push(L13d1, L13d2)
L13base.links.push(
  decoyLink('a', 'd1', 'n', 's'),
  decoyLink('d1', 'd2', 'e', 'w'),
  decoyLink('d2', 'b', 'e', 'n'),
)

const L14 = chain(24, [
  { id: 'm1', heightDelta: 0.5, halfW: 0.85, halfD: 0.85, accent: 'cyan', depth: 2.6, screenGap: 0.02 },
  {
    id: 'm2',
    heightDelta: 0.45,
    fromEdge: 'e',
    toEdge: 's',
    halfW: 0.85,
    halfD: 0.85,
    accent: 'magenta',
    depth: 2.4,
    screenGap: 0.02,
  },
  { id: 'b', heightDelta: -0.8, halfW: 0.9, halfD: 0.9, accent: 'goal', depth: 2.5, screenGap: 0.02 },
])

const L15base = chain(16, [
  { id: 'b', heightDelta: 0.45, accent: 'cyan' },
  { id: 'c', heightDelta: 0.5, fromEdge: 'e', toEdge: 's', accent: 'cyan' },
  { id: 'g', heightDelta: -0.85, accent: 'goal' },
])
const L15x = decoyNear('x', L15base.platforms[1]!, 90)
const L15y = decoyNear('y', L15base.platforms[2]!, 130)
L15base.platforms.push(L15x, L15y)
L15base.links.push(
  decoyLink('a', 'x', 'n', 's'),
  decoyLink('x', 'y', 'e', 'w'),
  decoyLink('y', 'g', 'e', 'n'),
)

export const LEVELS: LevelDef[] = [
  level({
    id: 1,
    name: 'First Glance',
    blurb: 'Rotate until the gap disappears, then walk.',
    ...L1,
    startYaw: 110,
    snapDeg: 0,
    tolerance: 0.28,
    timeLimitSec: 0,
    solutionYaw: 8,
    solutionYawWindow: 12,
  }),
  level({
    id: 2,
    name: 'Soft Step',
    blurb: 'A third pad waits just out of phase.',
    ...L2,
    startYaw: 100,
    snapDeg: 0,
    tolerance: 0.28,
    timeLimitSec: 0,
    solutionYaw: 14,
    solutionYawWindow: 12,
  }),
  level({
    id: 3,
    name: 'Skew Bridge',
    blurb: 'Height lies. Align the edges, not the floors.',
    ...L3,
    startYaw: -25,
    snapDeg: 0,
    tolerance: 0.55,
    timeLimitSec: 0,
    solutionYaw: 28,
    solutionYawWindow: 12,
  }),
  level({
    id: 4,
    name: 'False Friend',
    blurb: 'One glowing seam is a decoy. Trust the quiet path.',
    ...L4base,
    startYaw: 60,
    snapDeg: 0,
    tolerance: 0.5,
    timeLimitSec: 0,
    solutionYaw: 10,
    solutionYawWindow: 12,
  }),
  level({
    id: 5,
    name: 'Snap Lattice',
    blurb: 'Rotation locks to 15°. Feel for the click that connects.',
    ...L5,
    startYaw: 90,
    snapDeg: 15,
    tolerance: 0.45,
    timeLimitSec: 0,
    solutionYaw: 30,
    solutionYawWindow: 8,
  }),
  level({
    id: 6,
    name: 'Twin Seams',
    blurb: 'Two seams light up. Only one chain reaches the goal.',
    ...L6base,
    startYaw: 72,
    snapDeg: 0,
    tolerance: 0.48,
    timeLimitSec: 0,
    solutionYaw: 16,
    solutionYawWindow: 10,
  }),
  level({
    id: 7,
    name: 'Vanishing Dogleg',
    blurb: 'Turn past the obvious line. The dogleg hides in the skew.',
    ...L7,
    startYaw: -40,
    snapDeg: 0,
    tolerance: 0.52,
    timeLimitSec: 0,
    solutionYaw: 22,
    solutionYawWindow: 10,
  }),
  level({
    id: 8,
    name: 'Pressure Rotate',
    blurb: 'Forty seconds. Align, then commit.',
    ...L8base,
    startYaw: 50,
    snapDeg: 0,
    tolerance: 0.5,
    timeLimitSec: 40,
    solutionYaw: 12,
    solutionYawWindow: 10,
  }),
  level({
    id: 9,
    name: 'Mirage Stack',
    blurb: 'Stacked pads share a silhouette until the yaw breaks them apart.',
    ...L9base,
    startYaw: 8,
    snapDeg: 0,
    tolerance: 0.45,
    timeLimitSec: 0,
    solutionYaw: 34,
    solutionYawWindow: 10,
  }),
  level({
    id: 10,
    name: 'Cross Current',
    blurb: 'North looks open. East is honest.',
    ...L10base,
    startYaw: 80,
    snapDeg: 5,
    tolerance: 0.5,
    timeLimitSec: 0,
    solutionYaw: 15,
    solutionYawWindow: 10,
  }),
  level({
    id: 11,
    name: 'Four-Beat',
    blurb: 'Four pads. Three true seams. One impatient decoy.',
    ...L11base,
    goalId: 'g',
    startYaw: -18,
    snapDeg: 0,
    tolerance: 0.5,
    timeLimitSec: 0,
    solutionYaw: 18,
    solutionYawWindow: 10,
  }),
  level({
    id: 12,
    name: 'Rush Hour',
    blurb: 'Thirty seconds on a snapped wheel.',
    ...L12base,
    startYaw: 60,
    snapDeg: 10,
    tolerance: 0.55,
    timeLimitSec: 30,
    solutionYaw: 20,
    solutionYawWindow: 8,
  }),
  level({
    id: 13,
    name: 'Double Bluff',
    blurb: 'Two decoys share a vanishing line. Ignore both.',
    ...L13base,
    startYaw: 44,
    snapDeg: 0,
    tolerance: 0.48,
    timeLimitSec: 0,
    solutionYaw: 9,
    solutionYawWindow: 10,
  }),
  level({
    id: 14,
    name: 'Needle',
    blurb: 'Tight tolerance. Nudge, don’t spin.',
    ...L14,
    startYaw: 52,
    snapDeg: 0,
    tolerance: 0.28,
    timeLimitSec: 0,
    solutionYaw: 24,
    solutionYawWindow: 5,
  }),
  level({
    id: 15,
    name: 'Impossible',
    blurb: 'Everything aligns for a second. Wait for the true chain.',
    ...L15base,
    goalId: 'g',
    startYaw: 68,
    snapDeg: 0,
    tolerance: 0.42,
    timeLimitSec: 45,
    solutionYaw: 16,
    solutionYawWindow: 8,
  }),
]

export function getLevel(id: number): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id)
}

export function levelCount(): number {
  return LEVELS.length
}
