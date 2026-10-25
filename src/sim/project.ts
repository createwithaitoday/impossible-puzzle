import { degToRad } from './math'
import type { Edge, Platform, ScreenPoint, Vec3 } from './types'

/** Rotate world point around Y, then project to a soft isometric screen space. */
export function projectPoint(p: Vec3, yawDeg: number): ScreenPoint {
  const yaw = degToRad(yawDeg)
  const cos = Math.cos(yaw)
  const sin = Math.sin(yaw)
  const rx = p.x * cos - p.z * sin
  const rz = p.x * sin + p.z * cos
  return {
    x: rx * 1.05 - rz * 0.35,
    y: -p.y * 1.15 + (rx + rz) * 0.42,
  }
}

const EDGE_OFFSET: Record<Edge, { x: number; z: number }> = {
  n: { x: 0, z: -1 },
  e: { x: 1, z: 0 },
  s: { x: 0, z: 1 },
  w: { x: -1, z: 0 },
}

/** World-space midpoint of a platform's top-face edge. */
export function edgeWorldPoint(platform: Platform, edge: Edge): Vec3 {
  const o = EDGE_OFFSET[edge]
  return {
    x: platform.pos.x + o.x * platform.halfW,
    y: platform.pos.y,
    z: platform.pos.z + o.z * platform.halfD,
  }
}

export function edgeScreenPoint(
  platform: Platform,
  edge: Edge,
  yawDeg: number,
): ScreenPoint {
  return projectPoint(edgeWorldPoint(platform, edge), yawDeg)
}

/** Four corners of a platform top face, projected. */
export function platformCorners(platform: Platform, yawDeg: number): ScreenPoint[] {
  const { x, y, z } = platform.pos
  const hw = platform.halfW
  const hd = platform.halfD
  const corners: Vec3[] = [
    { x: x - hw, y, z: z - hd },
    { x: x + hw, y, z: z - hd },
    { x: x + hw, y, z: z + hd },
    { x: x - hw, y, z: z + hd },
  ]
  return corners.map((c) => projectPoint(c, yawDeg))
}
