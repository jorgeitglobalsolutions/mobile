/**
 * Upload assets/exercises/*.gif to Firebase Storage (exercises/{id}.gif).
 * Requires firebase/functions/certs/firebase-admin.json or GOOGLE_APPLICATION_CREDENTIALS.
 *
 * Run from repo root:
 *   node firebase/functions/scripts/uploadExerciseGifs.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import {
  collectExerciseGifs,
  exerciseGifStoragePath,
} from '../../../scripts/exerciseAssetManifest.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const functionsRoot = path.join(__dirname, '..');
const repoRoot = path.join(functionsRoot, '..', '..');

const projectId = process.env.FIREBASE_PROJECT_ID || 'em-fit-system-c0d3d';

const DEFAULT_KEY_CANDIDATES = [
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
  path.join(functionsRoot, 'certs', 'firebase-admin.json'),
  path.join(functionsRoot, 'certs', 'service-account.json'),
].filter(Boolean);

function resolveServiceAccountPath() {
  for (const candidate of DEFAULT_KEY_CANDIDATES) {
    if (candidate && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

function initAdmin() {
  const storageBucket = loadStorageBucketOverride() ?? undefined;
  const appOptions = { projectId, storageBucket };
  const keyPath = resolveServiceAccountPath();
  if (keyPath) {
    const json = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    initializeApp({ credential: cert(json), ...appOptions });
    console.log(`Using service account: ${keyPath}`);
    return;
  }
  try {
    initializeApp({ credential: applicationDefault(), ...appOptions });
    console.log('Using application default credentials');
  } catch {
    console.error(`
Firebase Admin credentials are missing.

Save a service account key as firebase/functions/certs/firebase-admin.json
or set GOOGLE_APPLICATION_CREDENTIALS, then re-run this script.
`);
    process.exit(1);
  }
}

function loadStorageBucketOverride() {
  if (process.env.FIREBASE_STORAGE_BUCKET?.trim()) {
    return process.env.FIREBASE_STORAGE_BUCKET.trim();
  }
  const envPath = path.join(repoRoot, '.env');
  if (fs.existsSync(envPath)) {
    const match = fs.readFileSync(envPath, 'utf8').match(
      /^EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=(.+)$/m,
    );
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return null;
}

async function resolveBucket() {
  const candidates = [
    loadStorageBucketOverride(),
    `${projectId}.firebasestorage.app`,
    `${projectId}.appspot.com`,
  ].filter(Boolean);

  for (const name of [...new Set(candidates)]) {
    const bucket = getStorage().bucket(name);
    const [exists] = await bucket.exists();
    if (exists) return bucket;
  }

  console.error(`
No Firebase Storage bucket found for project "${projectId}".

1. Open https://console.firebase.google.com/project/${projectId}/storage
2. Click "Get started" and finish setup
3. Confirm EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET in .env matches the bucket name shown
4. Run: npm run firebase:deploy:storage
5. Run: npm run exercises:upload
`);
  process.exit(1);
}

async function main() {
  initAdmin();
  const bucket = await resolveBucket();
  const bucketName = bucket.name;
  const items = collectExerciseGifs(repoRoot);

  console.log(`Uploading ${items.length} GIFs to gs://${bucketName}/exercises/ ...`);

  let uploaded = 0;
  let skipped = 0;

  for (const item of items) {
    const dest = exerciseGifStoragePath(item.id);
    const file = bucket.file(dest);
    const [exists] = await file.exists();
    if (exists && process.argv.includes('--skip-existing')) {
      skipped += 1;
      continue;
    }

    await bucket.upload(item.filePath, {
      destination: dest,
      metadata: {
        contentType: 'image/gif',
        cacheControl: 'public, max-age=31536000, immutable',
        metadata: {
          exerciseId: item.id,
          exerciseName: item.name,
          muscle: item.muscle,
        },
      },
      resumable: true,
    });
    uploaded += 1;
    if (uploaded % 10 === 0) {
      console.log(`  ${uploaded}/${items.length} ...`);
    }
  }

  console.log(`Done. Uploaded: ${uploaded}, skipped: ${skipped}, total: ${items.length}`);
  console.log(`Deploy storage rules: npm run firebase:deploy:storage`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
