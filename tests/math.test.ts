import { describe, expect, it } from 'vitest'
import { normalizeDeg, projectPoint, shortestAngleDelta, snapYaw } from '../src/sim'

describe('math helpers', () => {
  it('normalizes degrees', () => {
    expect(normalizeDeg(370)).toBe(10)
    expect(normalizeDeg(-90)).toBe(270)
  })

  it('snaps yaw', () => {
    expect(snapYaw(22, 15)).toBe(15)
    expect(snapYaw(23, 0)).toBe(23)
  })

  it('shortest angle delta wraps', () => {
    expect(shortestAngleDelta(10, 350)).toBe(-20)
  })

  it('projects deterministically', () => {
    const a = projectPoint({ x: 1, y: 0, z: 0 }, 0)
    const b = projectPoint({ x: 1, y: 0, z: 0 }, 0)
    expect(a).toEqual(b)
    expect(Number.isFinite(a.x)).toBe(true)
  })
})
