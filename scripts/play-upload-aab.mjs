/**
 * Upload a release AAB to the Lounge Lizard IMPOSSIBLE production track.
 * Usage: node scripts/play-upload-aab.mjs [path-to.aab]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { google } from 'googleapis'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const packageName = 'com.impossible.puzzle'
const aabPath = path.resolve(
  process.argv[2] || path.join(root, 'android/app/build/outputs/bundle/release/app-release.aab'),
)
const keyFile = path.join(root, 'play-service-account.json')

if (!fs.existsSync(keyFile)) throw new Error('Missing play-service-account.json')
if (!fs.existsSync(aabPath)) throw new Error(`Missing AAB: ${aabPath}`)

const auth = new google.auth.GoogleAuth({
  keyFile,
  scopes: ['https://www.googleapis.com/auth/androidpublisher'],
})
const androidpublisher = google.androidpublisher({ version: 'v3', auth })
const edit = await androidpublisher.edits.insert({ packageName })
const editId = edit.data.id
console.log('edit', editId)

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
            text: 'Initial release of IMPOSSIBLE — optical-illusion perspective puzzles.',
          },
        ],
      },
    ],
  },
})

const committed = await androidpublisher.edits.commit({ packageName, editId })
console.log('committed', committed.data.id, 'versionCode', versionCode)
