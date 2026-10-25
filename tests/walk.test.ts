import { describe, expect, it } from 'vitest'
import { attemptWalk, getLevel, hasTruePath } from '../src/sim'

describe('decoy walks', () => {
  it('level 4 can fail via decoy when only false seams align', () => {
    const level = getLevel(4)!
    // At a yaw far from solution, true path should typically be absent.
    expect(hasTruePath(level, level.startYaw)).toBe(false)
    const miss = attemptWalk(level, level.startYaw)
    expect(miss.ok).toBe(false)
  })

  it('successful walk path starts and ends correctly', () => {
    const level = getLevel(2)!
    const walk = attemptWalk(level, level.solutionYaw)
    expect(walk.ok).toBe(true)
    if (walk.ok) {
      expect(walk.path[0]).toBe(level.startId)
      expect(walk.path[walk.path.length - 1]).toBe(level.goalId)
    }
  })
})
