import { describe, expect, it } from 'vitest'
import {
  alignedLinks,
  attemptWalk,
  findSolvingYaws,
  hasTruePath,
  isSolvedAtYaw,
  LEVELS,
  linkScreenDistance,
} from '../src/sim'

describe('level catalog', () => {
  it('has at least 15 handcrafted levels', () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(15)
  })

  it('uses unique ids and valid start/goal', () => {
    const ids = new Set(LEVELS.map((l) => l.id))
    expect(ids.size).toBe(LEVELS.length)
    for (const level of LEVELS) {
      expect(level.platforms.some((p) => p.id === level.startId)).toBe(true)
      expect(level.platforms.some((p) => p.id === level.goalId)).toBe(true)
      expect(level.links.some((l) => l.kind === 'true')).toBe(true)
    }
  })
})

describe('alignment + walk', () => {
  it('solves every level near its authored solution yaw', () => {
    for (const level of LEVELS) {
      expect(
        isSolvedAtYaw(level, level.solutionYaw),
        `level ${level.id} not solved at solutionYaw`,
      ).toBe(true)
      const walk = attemptWalk(level, level.solutionYaw)
      expect(walk.ok, `level ${level.id} walk failed: ${'reason' in walk ? walk.reason : ''}`).toBe(
        true,
      )
    }
  })

  it('level 1 is not solved at a far-off yaw', () => {
    const level = LEVELS[0]!
    expect(hasTruePath(level, level.startYaw)).toBe(false)
  })

  it('findSolvingYaws includes the authored solution for level 1', () => {
    const level = LEVELS[0]!
    const hits = findSolvingYaws(level, 1)
    expect(hits.length).toBeGreaterThan(0)
    expect(hits).toContain(level.solutionYaw)
  })

  it('reports finite distances for links', () => {
    const level = LEVELS[0]!
    const link = level.links[0]!
    const hit = linkScreenDistance(level, link, level.solutionYaw)
    expect(hit).not.toBeNull()
    expect(hit!.distance).toBeLessThanOrEqual(level.tolerance)
    const aligned = alignedLinks(level, level.solutionYaw)
    expect(aligned.length).toBeGreaterThan(0)
  })
})
