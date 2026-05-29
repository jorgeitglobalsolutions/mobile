/**
 * Upload AAB to Play internal testing track (draft) using Application Default Credentials.
 * Requires: gcloud auth application-default login with androidpublisher scope.
 * Run: node scripts/uploadAabToPlayInternal.cjs [path-to-aab]
 */
const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('../firebase/functions/node_modules/google-auth-library');
const { google } = require('../firebase/functions/node_modules/googleapis');

const root = path.join(__dirname, '..');
const pkg = 'com.jorgeitglobalsolutionssorganization.emfitsystem';
const aabPath = process.argv[2] ?? path.join(root, 'em-fit-system-v1.0.0-vc2.aab');

async function main() {
  if (!fs.existsSync(aabPath)) {
    console.error(`AAB not found: ${aabPath}`);
    process.exit(1);
  }

  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    projectId: 'em-fit-system-c0d3d',
  });
  const client = await auth.getClient();
  const ap = google.androidpublisher({ version: 'v3', auth: client });

  console.log(`Uploading ${path.basename(aabPath)} to internal track (draft)...`);

  const edit = await ap.edits.insert({ packageName: pkg });
  const editId = edit.data.id;
  console.log('Edit id:', editId);

  const upload = await ap.edits.bundles.upload({
    packageName: pkg,
    editId,
    media: { mimeType: 'application/octet-stream', body: fs.createReadStream(aabPath) },
  });
  const versionCode = upload.data.versionCode;
  console.log('Uploaded versionCode:', versionCode);

  await ap.edits.tracks.update({
    packageName: pkg,
    editId,
    track: 'internal',
    requestBody: {
      track: 'internal',
      releases: [{ status: 'draft', versionCodes: [String(versionCode)] }],
    },
  });

  const committed = await ap.edits.commit({ packageName: pkg, editId });
  console.log('Committed edit:', committed.data.id);
  console.log('Done — internal testing draft release for versionCode', versionCode);
}

main().catch((e) => {
  console.error(e.errors?.[0]?.message || e.message);
  process.exit(1);
});
