/**
 * seed-guide-assets.mjs
 *
 * Uploads guide images to Supabase Storage and patches guide section
 * translation bodies so that [GUIDE_IMG:filename.png] placeholders are
 * replaced with real public image URLs.
 *
 * Usage:
 *   1. Drop image files into scripts/guide-assets/
 *   2. In guide_section_translations.body (SQL seed or via admin UI), write
 *      the placeholder anywhere in the markdown:
 *
 *        Berikut tampilan halaman dashboard:
 *
 *        [GUIDE_IMG:dashboard-overview.png]
 *
 *   3. Run:  npm run seed:guide-assets
 *
 * The placeholder syntax:
 *   [GUIDE_IMG:filename.ext]           → uses filename as alt text
 *   [GUIDE_IMG:filename.ext|Alt text]  → uses the part after | as alt text
 *
 * Idempotent: already-replaced URLs are left unchanged.
 * Bucket: "guide-assets" (public read, service-role write)
 */

import { createClient }                     from '@supabase/supabase-js'
import { loadEnv }                           from './load-env.mjs'
import { readdir, readFile }                 from 'node:fs/promises'
import { join, extname, basename }           from 'node:path'
import { fileURLToPath }                     from 'node:url'

loadEnv('.env.local')

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const BUCKET     = 'guide-assets'
const ASSETS_DIR = join(fileURLToPath(new URL('.', import.meta.url)), 'guide-assets')

const CONTENT_TYPES = {
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
}

const PLACEHOLDER_RE  = /\[GUIDE_IMG:([^\]|]+)(?:\|([^\]]*))?\]/g
// Matches already-replaced markdown images that reference our bucket
const EXISTING_IMG_RE = /!\[([^\]]*)\]\((https?:\/\/[^)]+\/guide-assets\/([^)?#\s]+))[^)]*\)/g

// ---------------------------------------------------------------------------
// Step 1: Ensure bucket exists
// ---------------------------------------------------------------------------
async function ensureBucket() {
  const { data: list } = await supabase.storage.listBuckets()
  if (list?.some(b => b.name === BUCKET)) {
    console.log(`  -  bucket "${BUCKET}" already exists`)
    return
  }
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public:           true,
    allowedMimeTypes: Object.values(CONTENT_TYPES),
    fileSizeLimit:    10 * 1024 * 1024, // 10 MB
  })
  if (error) throw new Error(`createBucket: ${error.message}`)
  console.log(`  ✓  bucket "${BUCKET}" created`)
}

// ---------------------------------------------------------------------------
// Step 2: Upload all images from scripts/guide-assets/
// ---------------------------------------------------------------------------
async function uploadImages() {
  let files
  try {
    files = await readdir(ASSETS_DIR)
  } catch {
    console.log(`  -  no files in ${ASSETS_DIR} (folder empty or missing)`)
    return {}
  }

  const imageFiles = files.filter(f => {
    const ext = extname(f).toLowerCase()
    return Object.keys(CONTENT_TYPES).includes(ext)
  })

  if (imageFiles.length === 0) {
    console.log('  -  no image files found in guide-assets/')
    return {}
  }

  const urlMap = {}

  for (const file of imageFiles) {
    const filePath    = join(ASSETS_DIR, file)
    const ext         = extname(file).toLowerCase()
    const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream'
    const buffer      = await readFile(filePath)

    // Delete first so the CDN serves fresh content on next request
    await supabase.storage.from(BUCKET).remove([file])

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(file, buffer, { contentType, upsert: false })

    if (error) {
      console.error(`  ✗  ${file}: ${error.message}`)
      continue
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(file)
    urlMap[file] = publicUrl
    console.log(`  ✓  ${file}`)
    console.log(`       ${publicUrl}`)
  }

  return urlMap
}

// ---------------------------------------------------------------------------
// Step 3: Patch guide_section_translations — replace [GUIDE_IMG:…] with real URLs
// ---------------------------------------------------------------------------
async function patchTranslations(urlMap) {
  if (Object.keys(urlMap).length === 0) {
    console.log('  -  no images uploaded — skipping patch step')
    return
  }

  // Fetch all rows that contain at least one placeholder
  const { data: rows, error } = await supabase
    .from('guide_section_translations')
    .select('id, locale, body')

  if (error) throw new Error(`fetch translations: ${error.message}`)

  let patched = 0

  for (const row of rows ?? []) {
    const hasPlaceholder = row.body?.includes('[GUIDE_IMG:')
    const hasExistingUrl = row.body && Object.keys(urlMap).some(f => row.body.includes(`/guide-assets/${f}`))
    if (!hasPlaceholder && !hasExistingUrl) continue

    // Replace [GUIDE_IMG:...] placeholders
    let newBody = row.body.replace(PLACEHOLDER_RE, (match, filename, alt) => {
      const url = urlMap[filename.trim()]
      if (!url) {
        console.warn(`  !  placeholder [GUIDE_IMG:${filename}] has no uploaded file — left unchanged`)
        return match
      }
      const altText = (alt ?? basename(filename, extname(filename))).trim()
      return `![${altText}](${url})`
    })

    // Re-patch already-replaced URLs so they point to the freshly uploaded file
    newBody = newBody.replace(EXISTING_IMG_RE, (match, alt, _oldUrl, filename) => {
      const newUrl = urlMap[filename]
      if (!newUrl) return match
      return `![${alt}](${newUrl})`
    })

    if (newBody === row.body) continue

    const { error: upErr } = await supabase
      .from('guide_section_translations')
      .update({ body: newBody })
      .eq('id', row.id)

    if (upErr) {
      console.error(`  ✗  translation ${row.id} (${row.locale}): ${upErr.message}`)
    } else {
      console.log(`  ✓  patched translation ${row.id} (${row.locale})`)
      patched++
    }
  }

  if (patched === 0) console.log('  -  no translations needed patching')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
console.log(`Supabase: ${SUPABASE_URL}`)
console.log('\n=== Guide assets: ensuring storage bucket ===\n')
await ensureBucket()

console.log('\n=== Guide assets: uploading images ===\n')
const urlMap = await uploadImages()

console.log('\n=== Guide assets: patching guide translations ===\n')
await patchTranslations(urlMap)

console.log('\n=== Guide assets: done ===\n')
if (Object.keys(urlMap).length > 0) {
  console.log('Uploaded URLs:')
  for (const [file, url] of Object.entries(urlMap)) {
    console.log(`  ${file.padEnd(40)} ${url}`)
  }
  console.log()
}
console.log('Tip: add [GUIDE_IMG:filename.ext] anywhere in a guide section body')
console.log('     (optionally: [GUIDE_IMG:filename.ext|Alt text])')
console.log('     then re-run this script to replace placeholders with real URLs.')
