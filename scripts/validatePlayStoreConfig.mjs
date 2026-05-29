#!/usr/bin/env node
/**
 * Verifies app.json IAP SKUs and legal URLs align with play-store/ docs.
 * Run: node scripts/validatePlayStoreConfig.mjs
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appJson = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8'));
const extra = appJson.expo?.extra ?? {};

const expected = {
  package: 'com.jorgeitglobalsolutionssorganization.emfitsystem',
  iapSkuMonthly: 'em_fit_monthly',
  iapSkuYearly: 'em_fit_yearly',
};

let ok = true;
const androidPkg = appJson.expo?.android?.package;
if (androidPkg !== expected.package) {
  console.error(`android.package: expected ${expected.package}, got ${androidPkg}`);
  ok = false;
}
for (const [key, val] of Object.entries({ iapSkuMonthly: expected.iapSkuMonthly, iapSkuYearly: expected.iapSkuYearly })) {
  if (extra[key] !== val) {
    console.error(`extra.${key}: expected ${val}, got ${extra[key]}`);
    ok = false;
  }
}
if (!extra.legalPrivacyUrl || extra.legalPrivacyUrl.includes('example.com')) {
  console.error('extra.legalPrivacyUrl must be a real privacy policy URL');
  ok = false;
}

const subsDoc = readFileSync(join(root, 'play-store', 'subscriptions.md'), 'utf8');
for (const sku of [expected.iapSkuMonthly, expected.iapSkuYearly]) {
  if (!subsDoc.includes(sku)) {
    console.error(`play-store/subscriptions.md missing SKU ${sku}`);
    ok = false;
  }
}

if (ok) {
  console.log('Play Store config OK (app.json matches play-store/ subscriptions doc).');
} else {
  process.exit(1);
}
