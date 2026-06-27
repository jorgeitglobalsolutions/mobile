/**
 * Pre-submit smoke checks (no device / Play Console required).
 * Run: node scripts/releaseSmokeCheck.mjs
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}
function fail(msg) {
  console.error(`  ✗ ${msg}`);
  failed += 1;
}

console.log('Release smoke checks (static)\n');

const appJson = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8'));
const extra = appJson.expo?.extra ?? {};
if (extra.useMockData === false) ok('app.json extra.useMockData is false');
else fail('app.json extra.useMockData must be false for production');

const fb = extra.firebase ?? {};
if (fb.apiKey || fb.projectId || fb.appId) {
  fail('app.json must NOT contain extra.firebase — use .env locally and EAS Secrets for production');
} else {
  ok('app.json has no committed Firebase keys');
}

function loadDotEnv() {
  try {
    const raw = readFileSync(join(root, '.env'), 'utf8');
    const out = {};
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) out[m[1]] = m[2].trim();
    }
    return out;
  } catch {
    return {};
  }
}

const env = { ...loadDotEnv(), ...process.env };
const firebaseKeys = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];
const hasLocalFirebase = firebaseKeys.every((k) => env[k]?.trim());
if (hasLocalFirebase) {
  ok('Local .env has Firebase keys (or set them in EAS production environment for cloud builds)');
} else {
  fail(
    'Firebase keys missing in .env — required for local builds; EAS production must have EXPO_PUBLIC_FIREBASE_* in project secrets',
  );
}

const skus = [extra.iapSkuMonthly, extra.iapSkuYearly];
if (skus[0] === 'em_fit_monthly' && skus[1] === 'em_fit_yearly') {
  ok('IAP SKUs match Play Console (em_fit_monthly / em_fit_yearly)');
} else fail(`IAP SKUs unexpected: ${skus.join(', ')}`);

if (
  extra.legalPrivacyUrl?.includes('estaciondemusculacion.com') &&
  !extra.legalPrivacyUrl?.includes('example.com')
) {
  ok('Legal privacy URL is production');
} else fail('Legal privacy URL missing or placeholder');

const easJson = JSON.parse(readFileSync(join(root, 'eas.json'), 'utf8'));
if (easJson.build?.production?.env?.EXPO_PUBLIC_USE_MOCK_DATA === '0') {
  ok('eas.json production profile sets EXPO_PUBLIC_USE_MOCK_DATA=0');
} else fail('eas.json production mock flag');

const fnEnv = readFileSync(join(root, 'firebase/functions/.env.em-fit-system-c0d3d'), 'utf8');
if (/ALLOW_DEV_SUBSCRIPTION=false/.test(fnEnv)) ok('ALLOW_DEV_SUBSCRIPTION=false in functions env');
else fail('ALLOW_DEV_SUBSCRIPTION not locked down');

if (/GOOGLE_PLAY_PACKAGE_NAME=com\.jorgeitglobalsolutionssorganization\.emfitsystem/.test(fnEnv)) {
  ok('GOOGLE_PLAY_PACKAGE_NAME configured');
} else fail('GOOGLE_PLAY_PACKAGE_NAME missing');

// Trial + paywall logic (mirrors subscription.ts)
function computeAccessLevel(sub) {
  const now = Date.now();
  const trialEnd = sub.trialEndsAt ? new Date(sub.trialEndsAt) : null;
  const periodEnd = sub.currentPeriodEndsAt ? new Date(sub.currentPeriodEndsAt) : null;
  if (sub.status === 'active') {
    if (periodEnd && periodEnd.getTime() < now) return { level: 'paywalled', status: 'expired' };
    return { level: 'full', status: 'active' };
  }
  if (sub.status === 'trial') {
    if (trialEnd && trialEnd.getTime() >= now) return { level: 'full', status: 'trial' };
    return { level: 'paywalled', status: 'expired' };
  }
  if (sub.status === 'expired') return { level: 'paywalled', status: 'expired' };
  return { level: 'paywalled', status: 'unknown' };
}

const future = new Date(Date.now() + 7 * 864e5).toISOString();
const past = new Date(Date.now() - 864e5).toISOString();
if (computeAccessLevel({ status: 'trial', trialEndsAt: future }).level === 'full') {
  ok('Trial in progress grants full access');
} else fail('Trial access logic');

if (computeAccessLevel({ status: 'trial', trialEndsAt: past }).level === 'paywalled') {
  ok('Expired trial shows paywall');
} else fail('Expired trial logic');

if (computeAccessLevel({ status: 'active', currentPeriodEndsAt: future }).level === 'full') {
  ok('Active subscription grants full access');
} else fail('Active subscription logic');

console.log(failed ? `\n${failed} check(s) failed.\n` : '\nAll static smoke checks passed.\n');
process.exit(failed ? 1 : 0);
