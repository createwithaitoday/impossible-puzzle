/** Pure sim types — no DOM. Safe for a future C# port. */

export type Vec3 = { x: number; y: number; z: number }

export type Edge = 'n' | 'e' | 's' | 'w'

export type PlatformAccent = 'cyan' | 'magenta' | 'neutral' | 'goal' | 'start'

export type Platform = {
  id: string
  /** Center of the top face in world space. */
  pos: Vec3
  /** Half-extents of the top face on X/Z. */
  halfW: number
  halfD: number
  accent: PlatformAccent
}

export type LinkKind = 'true' | 'decoy'

export type Link = {
  from: string
  to: string
  fromEdge: Edge
  toEdge: Edge
  kind: LinkKind
}

export type LevelDef = {
  id: number
  name: string
  blurb: string
  platforms: Platform[]
  links: Link[]
  startId: string
  goalId: string
  /** Starting camera yaw in degrees. */
  startYaw: number
  /** Snap increment; 0 = free drag. */
  snapDeg: number
  /** Max projected distance for two edge midpoints to count as aligned. */
  tolerance: number
  /** Seconds; 0 = untimed. */
  timeLimitSec: number
  /** Authoring reference: a yaw that solves the level. */
  solutionYaw: number
  /** Half-width around solutionYaw that still solves (degrees). */
  solutionYawWindow: number
}

export type ScreenPoint = { x: number; y: number }

export type AlignedLink = {
  link: Link
  distance: number
  a: ScreenPoint
  b: ScreenPoint
}

export type WalkResult =
  | { ok: true; path: string[] }
  | { ok: false; reason: 'no-path' | 'decoy' | 'gap'; path: string[]; fellAt?: string }
