import type { ScreenPoint, Vec3 } from './types'

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function normalizeDeg(deg: number): number {
  let d = deg % 360
  if (d < 0) d += 360
  return d
}

export function shortestAngleDelta(from: number, to: number): number {
  let d = normalizeDeg(to) - normalizeDeg(from)
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return d
}

export function dist2(a: ScreenPoint, b: ScreenPoint): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

export function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

export function snapYaw(yaw: number, snapDeg: number): number {
  if (snapDeg <= 0) return yaw
  return Math.round(yaw / snapDeg) * snapDeg
}
