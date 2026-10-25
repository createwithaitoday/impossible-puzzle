import { degToRad } from './math'
import { projectPoint } from './project'
import type { Edge, Link, Platform, PlatformAccent } from './types'

/**
 * Direction in XZ that is invisible to our oblique projector at `yawDeg`
 * (dsx ≈ 0). Moving along it keeps screen-X while changing world position,
 * which is what makes a seam look solid only near that yaw.
 */
export function projectionKernelXZ(yawDeg: number): { x: number; z: number } {
  const yaw = degToRad(yawDeg)
  const cos = Math.cos(yaw)
  const sin = Math.sin(yaw)
  // dsx = 1.05 drx - 0.35 drz = 0
  // drx = dx cos - dz sin, drz = dx sin + dz cos
  // => dx (1.05 cos - 0.35 sin) = dz (1.05 sin + 0.35 cos)
  const num = 1.05 * sin + 0.35 * cos
  const den = 1.05 * cos - 0.35 * sin
  let dx = num
  let dz = den
  // Prefer a stable orientation: flip so kernel points "forward-ish"
  if (dz < 0) {
    dx = -dx
    dz = -dz
  }
  const len = Math.hypot(dx, dz) || 1
  return { x: dx / len, z: dz / len }
}

function edgeOffset(
  pos: { x: number; y: number; z: number },
  halfW: number,
  halfD: number,
  edge: Edge,
): { x: number; y: number; z: number } {
  switch (edge) {
    case 'n':
      return { x: pos.x, y: pos.y, z: pos.z - halfD }
    case 'e':
      return { x: pos.x + halfW, y: pos.y, z: pos.z }
    case 's':
      return { x: pos.x, y: pos.y, z: pos.z + halfD }
    case 'w':
      return { x: pos.x - halfW, y: pos.y, z: pos.z }
  }
}

function centerFromEdge(
  edgePt: { x: number; y: number; z: number },
  halfW: number,
  halfD: number,
  edge: Edge,
): { x: number; y: number; z: number } {
  switch (edge) {
    case 'n':
      return { x: edgePt.x, y: edgePt.y, z: edgePt.z + halfD }
    case 'e':
      return { x: edgePt.x - halfW, y: edgePt.y, z: edgePt.z }
    case 's':
      return { x: edgePt.x, y: edgePt.y, z: edgePt.z - halfD }
    case 'w':
      return { x: edgePt.x + halfW, y: edgePt.y, z: edgePt.z }
  }
}

/**
 * Place a platform so its `toEdge` coincides on-screen with `from`'s edge at
 * `yawDeg`, while sitting far away along the projection kernel (illusion gap).
 */
export function placePlatformAligned(opts: {
  id: string
  fromPos: { x: number; y: number; z: number }
  fromHalfW: number
  fromHalfD: number
  fromEdge: Edge
  toEdge: Edge
  yawDeg: number
  /** World travel along the hidden kernel (larger = stronger illusion). */
  depth?: number
  halfW?: number
  halfD?: number
  heightDelta?: number
  accent?: PlatformAccent
  /** Tiny residual screen mismatch at the solution yaw. */
  screenGap?: number
}): Platform {
  const depth = opts.depth ?? 3.2
  const halfW = opts.halfW ?? 1
  const halfD = opts.halfD ?? 1
  const heightDelta = opts.heightDelta ?? 0
  const screenGap = opts.screenGap ?? 0.04

  const fromEdgePt = edgeOffset(opts.fromPos, opts.fromHalfW, opts.fromHalfD, opts.fromEdge)
  const k = projectionKernelXZ(opts.yawDeg)

  // Seed far along kernel, then correct Y so screen-Y matches (plus tiny gap).
  let edge = {
    x: fromEdgePt.x + k.x * depth,
    y: fromEdgePt.y + heightDelta,
    z: fromEdgePt.z + k.z * depth,
  }

  const target = projectPoint(fromEdgePt, opts.yawDeg)
  // Solve y so sy matches target.y (+ gap): sy = -y*1.15 + 0.42(rx+rz)
  const yaw = degToRad(opts.yawDeg)
  const cos = Math.cos(yaw)
  const sin = Math.sin(yaw)
  const rx = edge.x * cos - edge.z * sin
  const rz = edge.x * sin + edge.z * cos
  const wantSy = target.y + screenGap * 0.2
  // wantSy = -y*1.15 + 0.42(rx+rz) => y = (0.42(rx+rz) - wantSy) / 1.15
  edge = {
    ...edge,
    y: (0.42 * (rx + rz) - wantSy) / 1.15,
  }

  // Nudge laterally in screen-X with a small perpendicular so residual gap exists
  // without collapsing the kernel separation.
  const perp = { x: -k.z, z: k.x }
  edge = {
    x: edge.x + perp.x * screenGap * 0.15,
    y: edge.y,
    z: edge.z + perp.z * screenGap * 0.15,
  }

  const toCenter = centerFromEdge(edge, halfW, halfD, opts.toEdge)
  return {
    id: opts.id,
    pos: toCenter,
    halfW,
    halfD,
    accent: opts.accent ?? 'neutral',
  }
}

export function decoyNear(
  id: string,
  near: Platform,
  yawJitter: number,
  accent: PlatformAccent = 'magenta',
): Platform {
  const k = projectionKernelXZ(yawJitter)
  return {
    id,
    pos: {
      x: near.pos.x + k.x * 1.4,
      y: near.pos.y + 1.1,
      z: near.pos.z + k.z * 1.4,
    },
    halfW: near.halfW * 0.9,
    halfD: near.halfD * 0.9,
    accent,
  }
}

export type BuiltLevel = {
  platforms: Platform[]
  links: Link[]
}
