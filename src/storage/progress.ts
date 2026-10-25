const KEY = 'impossible.progress.v1'

export type Progress = {
  unlocked: number
  cleared: number[]
  bestYaw: Record<string, number>
  reducedMotion: boolean
  showGhostSeams: boolean
}

const DEFAULT: Progress = {
  unlocked: 1,
  cleared: [],
  bestYaw: {},
  reducedMotion: false,
  showGhostSeams: true,
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT, cleared: [], bestYaw: {} }
    const parsed = JSON.parse(raw) as Partial<Progress>
    return {
      unlocked: Math.max(1, Number(parsed.unlocked) || 1),
      cleared: Array.isArray(parsed.cleared)
        ? parsed.cleared.map(Number).filter((n) => n >= 1)
        : [],
      bestYaw: parsed.bestYaw && typeof parsed.bestYaw === 'object' ? parsed.bestYaw : {},
      reducedMotion: Boolean(parsed.reducedMotion),
      showGhostSeams: parsed.showGhostSeams !== false,
    }
  } catch {
    return { ...DEFAULT, cleared: [], bestYaw: {} }
  }
}

export function saveProgress(p: Progress): void {
  localStorage.setItem(KEY, JSON.stringify(p))
}

export function markCleared(levelId: number, yaw: number): Progress {
  const p = loadProgress()
  if (!p.cleared.includes(levelId)) p.cleared.push(levelId)
  p.unlocked = Math.max(p.unlocked, Math.min(15, levelId + 1))
  p.bestYaw[String(levelId)] = yaw
  saveProgress(p)
  return p
}

export function resetProgress(): Progress {
  const fresh = { ...DEFAULT, cleared: [], bestYaw: {} }
  saveProgress(fresh)
  return fresh
}

export function updateSettings(
  patch: Partial<Pick<Progress, 'reducedMotion' | 'showGhostSeams'>>,
): Progress {
  const p = loadProgress()
  if (patch.reducedMotion !== undefined) p.reducedMotion = patch.reducedMotion
  if (patch.showGhostSeams !== undefined) p.showGhostSeams = patch.showGhostSeams
  saveProgress(p)
  return p
}
