import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const functionsRoot = path.join(__dirname, '..');

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
  const keyPath = resolveServiceAccountPath();
  if (keyPath) {
    const json = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    initializeApp({ credential: cert(json), projectId });
    console.log(`Using service account: ${keyPath}`);
    return;
  }

  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envPath) {
    console.error(`\nGOOGLE_APPLICATION_CREDENTIALS is set but file not found:\n  ${envPath}\n`);
  }

  console.error(`
Firebase Admin credentials are missing.

Do ONE of the following:

1) Service account JSON (recommended)
   - Firebase Console -> Project settings -> Service accounts -> Generate new private key
   - Save as: firebase/functions/certs/firebase-admin.json
   - Then run:
     cd firebase/functions
     node scripts/reseedPredefinedRoutines.mjs

2) Or set an existing key path (PowerShell):
   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\full\\path\\to\\your-key.json"
   $env:FIREBASE_PROJECT_ID="em-fit-system-c0d3d"
   node scripts/reseedPredefinedRoutines.mjs

3) Or use Google ADC (if gcloud is installed):
   gcloud auth application-default login
   gcloud config set project em-fit-system-c0d3d
   node scripts/reseedPredefinedRoutines.mjs
`);
  process.exit(1);
}

const seedJsonPath = path.join(functionsRoot, '..', '..', 'src', 'data', 'predefinedRoutinesSeed.json');
if (!fs.existsSync(seedJsonPath)) {
  console.error(`Missing ${seedJsonPath}`);
  console.error('Run from repo root: node scripts/generatePredefinedRoutinesSeed.mjs');
  process.exit(1);
}
const PREDEFINED_ROUTINES_SEED = JSON.parse(fs.readFileSync(seedJsonPath, 'utf8'));

async function deleteCollection(db, collectionPath, batchSize = 200) {
  while (true) {
    const snap = await db.collection(collectionPath).limit(batchSize).get();
    if (snap.empty) return;
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

async function main() {
  initAdmin();
  const db = getFirestore();

  console.log(`Using project: ${projectId}`);
  console.log('Deleting old predefinedRoutines...');
  await deleteCollection(db, 'predefinedRoutines');

  console.log('Writing new predefinedRoutines...');
  const batch = db.batch();
  const now = FieldValue.serverTimestamp();
  for (const seed of PREDEFINED_ROUTINES_SEED) {
    const ref = db.collection('predefinedRoutines').doc(seed.id);
    batch.set(ref, {
      title: seed.title,
      muscles: seed.muscles,
      minutes: seed.minutes,
      exerciseCount: seed.exercises.length,
      category: seed.category,
      isPredefined: true,
      exercises: seed.exercises,
      description: seed.description,
      updatedAt: now,
      createdAt: Timestamp.now(),
    });
  }
  await batch.commit();
  console.log(`Done. Wrote ${PREDEFINED_ROUTINES_SEED.length} predefined routines.`);
}

main().catch((err) => {
  console.error('Failed to reseed predefined routines.');
  console.error(err?.stack || err);
  process.exit(1);
});
