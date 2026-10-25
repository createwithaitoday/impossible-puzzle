import {
  attemptWalk,
  getLevel,
  hasTruePath,
  LEVELS,
  normalizeDeg,
  snapYaw,
  type WalkResult,
} from './sim'
import {
  loadProgress,
  markCleared,
  resetProgress,
  updateSettings,
} from './storage/progress'
import { drawScene } from './ui/sceneCanvas'

type Screen =
  | { id: 'home' }
  | { id: 'map' }
  | { id: 'play'; levelId: number }
  | { id: 'result'; levelId: number; win: boolean; detail: string }
  | { id: 'settings' }
  | { id: 'privacy' }

export function mountApp(root: HTMLElement): void {
  let screen: Screen = { id: 'home' }
  let progress = loadProgress()
  let raf = 0

  const applyMotionClass = () => {
    document.body.classList.toggle('reduce-motion', progress.reducedMotion)
  }
  applyMotionClass()

  const go = (next: Screen) => {
    screen = next
    render()
  }

  const render = () => {
    cancelAnimationFrame(raf)
    root.replaceChildren()
    if (screen.id === 'home') root.append(viewHome())
    else if (screen.id === 'map') root.append(viewMap())
    else if (screen.id === 'play') root.append(viewPlay(screen.levelId))
    else if (screen.id === 'result') root.append(viewResult(screen))
    else if (screen.id === 'settings') root.append(viewSettings())
    else root.append(viewPrivacy())
  }

  function viewHome(): HTMLElement {
    const el = document.createElement('div')
    el.className = 'screen'
    el.innerHTML = `
      <div class="hero-block">
        <div class="hero-art" aria-hidden="true"></div>
        <p class="muted">The Illusion Game</p>
        <h1 class="brand">IMPOSSIBLE</h1>
        <p class="tag">Rotate the scene until broken platforms become a path. Then walk it — if it’s real.</p>
      </div>
      <div class="btn-row">
        <button class="primary" data-act="play">Play</button>
        <button data-act="map">Level Map</button>
        <button class="ghost" data-act="settings">Settings</button>
        <button class="ghost" data-act="privacy">Privacy</button>
      </div>
    `
    el.querySelector('[data-act="play"]')!.addEventListener('click', () => {
      go({ id: 'play', levelId: Math.min(progress.unlocked, LEVELS.length) })
    })
    el.querySelector('[data-act="map"]')!.addEventListener('click', () => go({ id: 'map' }))
    el.querySelector('[data-act="settings"]')!.addEventListener('click', () => go({ id: 'settings' }))
    el.querySelector('[data-act="privacy"]')!.addEventListener('click', () => go({ id: 'privacy' }))
    return el
  }

  function viewMap(): HTMLElement {
    const el = document.createElement('div')
    el.className = 'screen'
    const top = document.createElement('div')
    top.className = 'topbar'
    top.innerHTML = `<button class="ghost" data-back type="button">Back</button><h2>Level Map</h2><span class="muted">${progress.cleared.length}/${LEVELS.length}</span>`
    top.querySelector('[data-back]')!.addEventListener('click', () => go({ id: 'home' }))
    const grid = document.createElement('div')
    grid.className = 'map-grid'
    for (const level of LEVELS) {
      const locked = level.id > progress.unlocked
      const cleared = progress.cleared.includes(level.id)
      const btn = document.createElement('button')
      btn.className = `map-cell${locked ? ' locked' : ''}${cleared ? ' cleared' : ''}`
      btn.disabled = locked
      btn.innerHTML = `<span class="num">${level.id}</span><span class="name">${level.name}</span>`
      btn.addEventListener('click', () => go({ id: 'play', levelId: level.id }))
      grid.append(btn)
    }
    el.append(top, grid)
    return el
  }

  function viewSettings(): HTMLElement {
    const el = document.createElement('div')
    el.className = 'screen'
    el.innerHTML = `
      <div class="topbar">
        <button class="ghost" data-back type="button">Back</button>
        <h2>Settings</h2>
        <span></span>
      </div>
      <div class="panel">
        <div class="toggle"><span>Reduced motion</span><button data-rm type="button">${progress.reducedMotion ? 'On' : 'Off'}</button></div>
        <div class="toggle"><span>Ghost seams</span><button data-gs type="button">${progress.showGhostSeams ? 'On' : 'Off'}</button></div>
        <p class="muted">Progress is stored only on this device (localStorage).</p>
        <button data-reset type="button">Reset progress</button>
      </div>
    `
    el.querySelector('[data-back]')!.addEventListener('click', () => go({ id: 'home' }))
    el.querySelector('[data-rm]')!.addEventListener('click', () => {
      progress = updateSettings({ reducedMotion: !progress.reducedMotion })
      applyMotionClass()
      render()
    })
    el.querySelector('[data-gs]')!.addEventListener('click', () => {
      progress = updateSettings({ showGhostSeams: !progress.showGhostSeams })
      render()
    })
    el.querySelector('[data-reset]')!.addEventListener('click', () => {
      progress = resetProgress()
      render()
    })
    return el
  }

  function viewPrivacy(): HTMLElement {
    const el = document.createElement('div')
    el.className = 'screen'
    el.innerHTML = `
      <div class="topbar">
        <button class="ghost" data-back type="button">Back</button>
        <h2>Privacy</h2>
        <span></span>
      </div>
      <div class="privacy-body panel">
        <p>IMPOSSIBLE is published by Lounge Lizard. Progress (cleared levels, settings) stays in on-device storage. This build does not require an account.</p>
        <h2>Data</h2>
        <p>We do not operate a game server for IMPOSSIBLE. Level progress never leaves your device unless you back up the app data yourself.</p>
        <h2>Full policy</h2>
        <p>Open the packaged policy for the complete text.</p>
        <button data-full type="button">Open privacy policy</button>
      </div>
    `
    el.querySelector('[data-back]')!.addEventListener('click', () => go({ id: 'home' }))
    el.querySelector('[data-full]')!.addEventListener('click', () => {
      window.open('./privacy/index.html', '_blank')
    })
    return el
  }

  function viewResult(s: Extract<Screen, { id: 'result' }>): HTMLElement {
    const level = getLevel(s.levelId)!
    const el = document.createElement('div')
    el.className = 'screen'
    el.innerHTML = `
      <div class="panel ${s.win ? 'win' : 'lose'}">
        <h2>${s.win ? 'Aligned' : 'Broken'}</h2>
        <p class="blurb">${s.detail}</p>
        <p class="muted">${level.name}</p>
        <div class="btn-row">
          ${s.win && s.levelId < LEVELS.length ? '<button class="primary" data-next type="button">Next level</button>' : ''}
          <button data-retry type="button">Retry</button>
          <button class="ghost" data-map type="button">Level map</button>
          <button class="ghost" data-home type="button">Home</button>
        </div>
      </div>
    `
    el.querySelector('[data-retry]')!.addEventListener('click', () =>
      go({ id: 'play', levelId: s.levelId }),
    )
    el.querySelector('[data-map]')!.addEventListener('click', () => go({ id: 'map' }))
    el.querySelector('[data-home]')!.addEventListener('click', () => go({ id: 'home' }))
    el.querySelector('[data-next]')?.addEventListener('click', () =>
      go({ id: 'play', levelId: s.levelId + 1 }),
    )
    return el
  }

  function viewPlay(levelId: number): HTMLElement {
    const level = getLevel(levelId)
    if (!level) {
      const miss = document.createElement('div')
      miss.className = 'screen'
      miss.textContent = 'Level missing'
      return miss
    }

    let yaw = level.startYaw
    let dragging = false
    let lastX = 0
    let walking = false
    let walkerId: string | null = level.startId
    let walkerT = 0
    let walkPath: string[] = [level.startId]
    let falling = false
    let pulse = 0
    let timeLeft = level.timeLimitSec
    let lastTs = performance.now()
    let ended = false

    const el = document.createElement('div')
    el.className = 'screen play-stage'
    el.innerHTML = `
      <div class="topbar">
        <button class="ghost" data-back type="button">Map</button>
        <h1>${level.id}. ${level.name}</h1>
        <span></span>
      </div>
      <p class="blurb">${level.blurb}</p>
      <div class="hud">
        <span>Yaw <strong data-yaw>0°</strong></span>
        <span data-timer></span>
        <span data-status>Rotate to align</span>
      </div>
      <div class="canvas-wrap"><canvas></canvas></div>
      <div class="controls">
        <div class="nudge">
          <button data-ccw type="button">⟲</button>
          <button data-cw type="button">⟳</button>
        </div>
        <button class="primary" data-walk type="button">Walk</button>
        <div class="nudge">
          <button data-fine-ccw type="button">−1°</button>
          <button data-fine-cw type="button">+1°</button>
        </div>
      </div>
    `

    const canvas = el.querySelector('canvas')!
    const wrap = el.querySelector('.canvas-wrap') as HTMLElement
    const ctx = canvas.getContext('2d')!
    const yawEl = el.querySelector('[data-yaw]') as HTMLElement
    const statusEl = el.querySelector('[data-status]') as HTMLElement
    const timerEl = el.querySelector('[data-timer]') as HTMLElement

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const setYaw = (v: number) => {
      yaw = snapYaw(v, level.snapDeg)
      yawEl.textContent = `${Math.round(normalizeDeg(yaw))}°`
      const ready = hasTruePath(level, yaw)
      statusEl.textContent = ready ? 'Path looks solid' : 'Rotate to align'
      statusEl.style.color = ready ? 'var(--ok)' : 'var(--fog)'
    }
    setYaw(yaw)

    const nudge = (delta: number) => {
      if (walking || ended) return
      setYaw(yaw + delta)
    }

    el.querySelector('[data-back]')!.addEventListener('click', () => {
      window.removeEventListener('resize', resize)
      go({ id: 'map' })
    })
    el.querySelector('[data-ccw]')!.addEventListener('click', () =>
      nudge(level.snapDeg > 0 ? -level.snapDeg : -8),
    )
    el.querySelector('[data-cw]')!.addEventListener('click', () =>
      nudge(level.snapDeg > 0 ? level.snapDeg : 8),
    )
    el.querySelector('[data-fine-ccw]')!.addEventListener('click', () => nudge(-1))
    el.querySelector('[data-fine-cw]')!.addEventListener('click', () => nudge(1))

    const onPointerDown = (e: PointerEvent) => {
      if (walking || ended) return
      dragging = true
      lastX = e.clientX
      wrap.setPointerCapture(e.pointerId)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      lastX = e.clientX
      setYaw(yaw + dx * 0.35)
    }
    const onPointerUp = (e: PointerEvent) => {
      dragging = false
      try {
        wrap.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }
    wrap.addEventListener('pointerdown', onPointerDown)
    wrap.addEventListener('pointermove', onPointerMove)
    wrap.addEventListener('pointerup', onPointerUp)
    wrap.addEventListener('pointercancel', onPointerUp)

    const finish = (win: boolean, detail: string, resultYaw = yaw) => {
      if (ended) return
      ended = true
      walking = false
      window.removeEventListener('resize', resize)
      if (win) progress = markCleared(level.id, resultYaw)
      go({ id: 'result', levelId: level.id, win, detail })
    }

    const startWalk = (result: WalkResult) => {
      walking = true
      walkPath = result.path
      walkerId = result.path[0] ?? level.startId
      walkerT = 0
      falling = !result.ok
      statusEl.textContent = result.ok ? 'Walking…' : 'Seam failed…'
    }

    el.querySelector('[data-walk]')!.addEventListener('click', () => {
      if (walking || ended) return
      const result = attemptWalk(level, yaw)
      if (result.ok) {
        startWalk(result)
        return
      }
      if (result.reason === 'decoy') {
        startWalk(result)
        return
      }
      statusEl.textContent =
        result.reason === 'gap' ? 'Nothing connects yet' : 'No continuous path'
      statusEl.style.color = 'var(--danger)'
    })

    const tick = (ts: number) => {
      const dt = Math.min(0.05, (ts - lastTs) / 1000)
      lastTs = ts
      pulse += dt

      if (!ended && !walking && level.timeLimitSec > 0) {
        timeLeft -= dt
        timerEl.textContent = `${Math.max(0, Math.ceil(timeLeft))}s`
        if (timeLeft <= 0) {
          finish(false, 'Time ran out before the path held.')
          return
        }
      } else if (level.timeLimitSec > 0) {
        timerEl.textContent = `${Math.max(0, Math.ceil(timeLeft))}s`
      }

      if (walking && walkerId) {
        walkerT += dt * (falling ? 1.6 : 1.25)
        if (walkerT >= 1) {
          walkerT = 0
          const idx = walkPath.indexOf(walkerId)
          if (falling) {
            finish(false, 'You trusted a decoy seam. The path was never there.')
            return
          }
          if (idx >= walkPath.length - 1) {
            finish(true, 'The illusion held. Platforms became a path.', yaw)
            return
          }
          walkerId = walkPath[idx + 1] ?? walkerId
        }
      }

      const cssW = wrap.clientWidth
      const cssH = wrap.clientHeight
      drawScene(ctx, cssW, cssH, {
        level,
        yaw,
        walkerId,
        walkerT,
        walkPath,
        showGhostSeams: progress.showGhostSeams,
        pulse: pulse * 4,
        falling,
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return el
  }

  render()
}
