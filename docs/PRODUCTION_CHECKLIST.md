# Production deployment checklist (Firebase + EAS)

Use this when moving from local/mock development to a store-ready build aligned with the MVP quotation (Firebase backend, subscription validation, real push).

## Mobile app (Expo / EAS)

1. **Firebase client config**  
   Set `EXPO_PUBLIC_FIREBASE_*` in a local `.env` (see `.env.example`) and in **EAS → Environment variables → production**. Callable functions region defaults to `us-central1` (`extra.firebaseFunctionsRegion`). **Never commit Firebase keys in `app.json`** — use EAS Secrets for Play Store builds. If a key was exposed on GitHub, rotate it in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and update EAS + `.env`.

2. **Mock data off**  
   `app.json` sets `extra.useMockData` to `false` for release alignment. For local work **without** Firebase, set `EXPO_PUBLIC_USE_MOCK_DATA=1` (see [mockMode.ts](../src/config/mockMode.ts)) in your shell, `.env`, or a non-production EAS profile before `expo start`.

3. **EAS env**  
   The `production` profile sets `EXPO_PUBLIC_USE_MOCK_DATA=0`. All `EXPO_PUBLIC_FIREBASE_*` values must live in **EAS production environment variables** (not in git).

4. **EAS Build on Windows**  
   `eas.json` sets `cli.requireCommit: true` to avoid `EPERM: rmdir` during upload (shallow-clone cleanup on Windows/OneDrive). **Commit all changes before** `eas build`. If upload still fails, move the repo out of OneDrive or run the build from GitHub Actions / WSL.

5. **Native store config**  
   - Android: `google-services.json` from Firebase, package name matches Play Console.  
   - iOS: `GoogleService-Info.plist`, bundle ID matches App Store Connect.

6. **IAP product IDs**  
   Ensure `app.json` → `extra.iapSkuMonthly` / `iapSkuYearly` match App Store Connect and Play Console SKUs.

## Cloud Functions (`mobile/firebase`)

1. **Deploy**  
   From project root: `npm run firebase:deploy` (or `npm run firebase:deploy:functions` for functions only).  
   On Windows / OneDrive, if deploy fails with *"User code failed to load… Timeout after 10000"*, the scripts already set `FUNCTIONS_DISCOVERY_TIMEOUT=60` (seconds). Retry after a minute if you hit Cloud Billing API rate limits (429).

2. **`verifyPurchase` production**  
   - **Do not** set `ALLOW_VERIFY_PURCHASE_STUB` in production.  
   - Configure environment parameters / secrets for:
     - **Apple:** `APPLE_IOS_BUNDLE_ID`, `APPLE_APP_APPLE_ID` (production), Apple root CA file under `functions/certs/`
     - **Google:** `GOOGLE_PLAY_PACKAGE_NAME`, `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (service account JSON with Android Publisher API access)
     - **SKUs:** `IAP_SKU_MONTHLY`, `IAP_SKU_YEARLY`, or combined `IAP_ALLOWED_PRODUCT_IDS` (comma-separated)

3. **Scheduler**  
   Deploy `sendDailyHabitReminders` (hourly). Monitor logs for `sendDailyHabitReminders done`.

4. **Dev-only grant**  
   Keep `ALLOW_DEV_SUBSCRIPTION` **unset** in production (or `false`). Use only for internal QA with `grantDevSubscription`.

5. **Firestore**  
   Deploy rules (`firestore.rules`) and create any required composite indexes reported by the Firebase console.

## Legal / store

- Update `extra.legalTermsUrl`, `legalPrivacyUrl`, `supportEmail` in `app.json` to real URLs and contacts.  
- Confirm account deletion and data handling meet store policies (see Profile / Settings flows).
- **Google Play Console:** follow [play-store/README.md](../play-store/README.md) (app, subscriptions `em_fit_monthly` / `em_fit_yearly`, Data safety, listing assets).
