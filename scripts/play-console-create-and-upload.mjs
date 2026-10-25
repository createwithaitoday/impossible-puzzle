/**
 * Create IMPOSSIBLE on Play Console (Lounge Lizard) via existing Chrome CDP,
 * grant the smashlab Play SA if possible, upload first AAB to internal testing.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { google } from 'googleapis'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const aabPath = path.join(root, 'android/app/build/outputs/bundle/release/app-release.aab')
const packageName = 'com.impossible.puzzle'
const developerId = '6155776633763969971'
const saEmail = 'smashlab-play@smashlab-lounge-b024.iam.gserviceaccount.com'
const logPath = path.join(root, 'store', 'play-create-log.txt')
const shots = path.join(root, 'store', 'play-automation')
fs.mkdirSync(shots, { recursive: true })

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`
  console.log(line)
  fs.appendFileSync(logPath, line + '\n')
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(shots, `${name}.png`), fullPage: true }).catch(() => {})
}

async function tryClick(page, selectors, timeout = 4000) {
  for (const sel of selectors) {
    try {
      const loc = page.locator(sel).first()
      await loc.waitFor({ state: 'visible', timeout })
      await loc.click({ timeout })
      log(`clicked ${sel}`)
      return true
    } catch {
      /* try next */
    }
  }
  return false
}

async function fillFirst(page, selectors, value) {
  for (const sel of selectors) {
    try {
      const loc = page.locator(sel).first()
      await loc.waitFor({ state: 'visible', timeout: 3000 })
      await loc.fill(value)
      log(`filled ${sel}`)
      return true
    } catch {
      /* next */
    }
  }
  return false
}

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const context = browser.contexts()[0] || (await browser.newContext())
const page = await context.newPage()

try {
  const createUrl = `https://play.google.com/console/u/0/developers/${developerId}/app-create`
  log(`goto ${createUrl}`)
  await page.goto(createUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForTimeout(4000)
  await shot(page, '01-create')

  // Account / developer picker if shown
  await tryClick(page, [
    `text=Lounge Lizard`,
    `text=${developerId}`,
  ], 2000)

  // App name
  const named =
    (await fillFirst(page, [
      'input[aria-label*="App name" i]',
      'input[aria-label*="app name" i]',
      'input[name*="name" i]',
      'material-input input',
      'input[type="text"]',
    ], 'IMPOSSIBLE')) ||
    (await page.evaluate(() => {
      const inputs = [...document.querySelectorAll('input')]
      const el = inputs.find((i) => /name|app/i.test(i.getAttribute('aria-label') || i.name || '')) || inputs[0]
      if (!el) return false
      el.focus()
      el.value = 'IMPOSSIBLE'
      el.dispatchEvent(new Event('input', { bubbles: true }))
      return true
    }))
  log(`named=${named}`)

  // Default language already en-US usually
  // App / Game
  await tryClick(page, [
    'text=Game',
    'button:has-text("Game")',
    '[aria-label="Game"]',
    'label:has-text("Game")',
  ], 3000)

  // Free
  await tryClick(page, [
    'text=Free',
    'button:has-text("Free")',
    '[aria-label="Free"]',
    'label:has-text("Free")',
  ], 3000)

  // Declarations / checkboxes
  const checks = page.locator('input[type="checkbox"]')
  const n = await checks.count()
  for (let i = 0; i < n; i++) {
    const c = checks.nth(i)
    if (!(await c.isChecked().catch(() => true))) {
      await c.check({ force: true }).catch(() => c.click({ force: true }))
    }
  }
  // Also click material checkboxes
  await page.locator('mat-checkbox, .mdc-checkbox, [role="checkbox"]').evaluateAll((els) => {
    for (const el of els) {
      const checked = el.getAttribute('aria-checked') === 'true' || el.classList.contains('mat-mdc-checkbox-checked')
      if (!checked) el.click()
    }
  }).catch(() => {})

  await shot(page, '02-filled')

  const created = await tryClick(page, [
    'button:has-text("Create app")',
    'button:has-text("Create")',
    '[aria-label*="Create app" i]',
    'text=Create app',
  ], 5000)

  await page.waitForTimeout(8000)
  await shot(page, '03-after-create')
  const url = page.url()
  log(`after-create url=${url} clickedCreate=${created}`)

  // Extract app id from URL .../app/4973.../
  const appMatch = url.match(/\/app\/(\d+)/)
  let appId = appMatch?.[1] || null
  if (!appId) {
    // Maybe still on create — dump body text
    const body = await page.locator('body').innerText().catch(() => '')
    log(`body-snippet=${body.slice(0, 800).replace(/\s+/g, ' ')}`)
  } else {
    log(`appId=${appId}`)
    fs.writeFileSync(path.join(root, 'store', 'play-app-id.txt'), appId)
  }

  // Try Users and permissions to add SA
  if (appId) {
    const usersUrl = `https://play.google.com/console/u/0/developers/${developerId}/app/${appId}/user-management`
    await page.goto(usersUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
    await page.waitForTimeout(3000)
    await shot(page, '04-users')
    await tryClick(page, ['button:has-text("Invite")', 'text=Invite new users', 'button:has-text("Invite user")'], 4000)
    await page.waitForTimeout(1500)
    await fillFirst(page, ['input[type="email"]', 'input[aria-label*="email" i]', 'input[type="text"]'], saEmail)
    // Admin / Release manager
    await tryClick(page, ['text=Admin', 'text=Release to production', 'text=Release manager'], 2000)
    const boxes = page.locator('input[type="checkbox"]')
    const bn = await boxes.count()
    for (let i = 0; i < Math.min(bn, 12); i++) {
      await boxes.nth(i).check({ force: true }).catch(() => {})
    }
    await tryClick(page, ['button:has-text("Invite user")', 'button:has-text("Send invite")', 'button:has-text("Invite")'], 4000)
    await page.waitForTimeout(3000)
    await shot(page, '05-invited')
  }

  // Dashboard create → first release: Production or Internal testing upload UI
  if (appId) {
    const releaseUrl = `https://play.google.com/console/u/0/developers/${developerId}/app/${appId}/tracks/internal-testing`
    await page.goto(releaseUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
    await page.waitForTimeout(4000)
    await shot(page, '06-internal')
    await tryClick(page, [
      'button:has-text("Create new release")',
      'text=Create new release',
      'button:has-text("Create release")',
    ], 5000)
    await page.waitForTimeout(3000)
    await shot(page, '07-release-form')

    // File input for AAB
    const input = page.locator('input[type="file"]').first()
    if (await input.count()) {
      await input.setInputFiles(aabPath)
      log(`uploaded aab via input ${aabPath}`)
      await page.waitForTimeout(20000)
      await shot(page, '08-aab-uploaded')
      await tryClick(page, [
        'button:has-text("Save")',
        'button:has-text("Next")',
        'button:has-text("Review release")',
      ], 5000)
      await page.waitForTimeout(3000)
      await tryClick(page, [
        'button:has-text("Start rollout to Internal testing")',
        'button:has-text("Rollout")',
        'button:has-text("Save")',
      ], 5000)
      await shot(page, '09-rolled')
    } else {
      log('no file input on release page — will try API after invite propagates')
    }
  }
} catch (err) {
  log(`ERROR ${err?.stack || err}`)
  await shot(page, '99-error')
}

// Always try API upload (works once app exists + SA access)
async function apiUpload() {
  const keyFile = path.join(root, 'play-service-account.json')
  if (!fs.existsSync(keyFile) || !fs.existsSync(aabPath)) {
    log('api skip missing key/aab')
    return
  }
  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  })
  const api = google.androidpublisher({ version: 'v3', auth })
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      log(`api attempt ${attempt}`)
      const edit = await api.edits.insert({ packageName })
      const editId = edit.data.id
      const bundle = await api.edits.bundles.upload({
        packageName,
        editId,
        media: { mimeType: 'application/octet-stream', body: fs.createReadStream(aabPath) },
      })
      const versionCode = bundle.data.versionCode
      log(`api bundle ${versionCode}`)
      await api.edits.listings.update({
        packageName,
        editId,
        language: 'en-US',
        requestBody: {
          language: 'en-US',
          title: 'IMPOSSIBLE',
          shortDescription: 'Rotate illusions until broken platforms become a path.',
          fullDescription:
            'IMPOSSIBLE is an optical-illusion perspective puzzle.\n\nRotate a 2.5D scene until disconnected platforms visually align into a walkable path. Then walk it. Fifteen handcrafted rooms. Progress stays on this device.',
        },
      }).catch((e) => log(`listing warn ${e.message}`))

      // feature graphic if present
      const fg = path.join(root, 'store/feature-graphic.png')
      if (fs.existsSync(fg)) {
        await api.edits.images.upload({
          packageName,
          editId,
          language: 'en-US',
          imageType: 'featureGraphic',
          media: { mimeType: 'image/png', body: fs.createReadStream(fg) },
        }).catch((e) => log(`fg warn ${e.message}`))
      }
      const icon = path.join(root, 'store/icons/play-512.png')
      if (fs.existsSync(icon)) {
        await api.edits.images.upload({
          packageName,
          editId,
          language: 'en-US',
          imageType: 'icon',
          media: { mimeType: 'image/png', body: fs.createReadStream(icon) },
        }).catch((e) => log(`icon warn ${e.message}`))
      }

      await api.edits.tracks.update({
        packageName,
        editId,
        track: 'internal',
        requestBody: {
          track: 'internal',
          releases: [
            {
              name: '1.0.0',
              status: 'completed',
              versionCodes: [String(versionCode)],
              releaseNotes: [{ language: 'en-US', text: 'Initial IMPOSSIBLE release.' }],
            },
          ],
        },
      })
      const committed = await api.edits.commit({ packageName, editId })
      log(`api committed ${committed.data.id} vc=${versionCode}`)
      return
    } catch (e) {
      log(`api fail ${e?.response?.status || ''} ${e.message}`)
      await new Promise((r) => setTimeout(r, 15000))
    }
  }
}

await apiUpload()
log('done')
await page.close().catch(() => {})
// do not close shared Chrome browser
process.exit(0)
