/**
 * Uploads IMPOSSIBLE store listing graphics to Lounge Lizard Play app via
 * play-service-account.json. Optional: --aab=path and --commit.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { google } from 'googleapis'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const packageName = 'com.impossible.puzzle'
const keyFile = path.join(root, 'play-service-account.json')
const args = new Set(process.argv.slice(2))
const aabArg = process.argv.find((a) => a.startsWith('--aab='))?.slice(6)

if (!fs.existsSync(keyFile)) {
  console.error('Missing play-service-account.json')
  process.exit(1)
}

const auth = new google.auth.GoogleAuth({
  keyFile,
  scopes: ['https://www.googleapis.com/auth/androidpublisher'],
})
const androidpublisher = google.androidpublisher({ version: 'v3', auth })

const edit = await androidpublisher.edits.insert({ packageName })
const editId = edit.data.id
console.log('edit', editId)

async function uploadImage(imageType, filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn('skip missing', filePath)
    return
  }
  const res = await androidpublisher.edits.images.upload({
    packageName,
    editId,
    language: 'en-US',
    imageType,
    media: {
      mimeType: 'image/png',
      body: fs.createReadStream(filePath),
    },
  })
  console.log('uploaded', imageType, path.basename(filePath), res.data.image?.id || 'ok')
}

await androidpublisher.edits.images
  .deleteall({
    packageName,
    editId,
    language: 'en-US',
    imageType: 'featureGraphic',
  })
  .catch(() => undefined)
await uploadImage('featureGraphic', path.join(root, 'store/feature-graphic.png'))

await androidpublisher.edits.images
  .deleteall({
    packageName,
    editId,
    language: 'en-US',
    imageType: 'phoneScreenshots',
  })
  .catch(() => undefined)

const shotsDir = path.join(root, 'store/screenshots')
if (fs.existsSync(shotsDir)) {
  const phones = fs
    .readdirSync(shotsDir)
    .filter((n) => n.endsWith('.png'))
    .sort()
  for (const name of phones) {
    await uploadImage('phoneScreenshots', path.join(shotsDir, name))
  }
}

await androidpublisher.edits.listings.update({
  packageName,
  editId,
  language: 'en-US',
  requestBody: {
    language: 'en-US',
    title: 'IMPOSSIBLE',
    shortDescription: 'Rotate illusions until broken platforms become a path.',
    fullDescription: `IMPOSSIBLE is an optical-illusion perspective puzzle.

Rotate a 2.5D scene — or shift how edges meet — until disconnected platforms visually align into a walkable path. Then send your walker across. False alignments, decoy seams, and timed rotates keep each room honest.

Fifteen handcrafted rooms. Progress stays on your device.

Published by Lounge Lizard.`,
  },
})
console.log('listing text updated')

if (aabArg) {
  const aabPath = path.resolve(aabArg)
  if (!fs.existsSync(aabPath)) {
    console.error('AAB missing', aabPath)
    process.exit(1)
  }
  const bundle = await androidpublisher.edits.bundles.upload({
    packageName,
    editId,
    media: {
      mimeType: 'application/octet-stream',
      body: fs.createReadStream(aabPath),
    },
  })
  const versionCode = bundle.data.versionCode
  console.log('bundle versionCode', versionCode)
  await androidpublisher.edits.tracks.update({
    packageName,
    editId,
    track: 'production',
    requestBody: {
      track: 'production',
      releases: [
        {
          name: '1.0.0',
          status: 'completed',
          versionCodes: [String(versionCode)],
          releaseNotes: [
            {
              language: 'en-US',
              text: 'Initial release of IMPOSSIBLE.',
            },
          ],
        },
      ],
    },
  })
  console.log('production track set')
}

if (args.has('--commit')) {
  const committed = await androidpublisher.edits.commit({ packageName, editId })
  console.log('committed', committed.data.id)
} else {
  console.log('Dry run edit left open. Re-run with --commit to publish the edit.')
  console.log(`Edit id: ${editId}`)
}
