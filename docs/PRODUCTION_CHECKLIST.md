# Production deployment checklist (Firebase + EAS)

Use this when moving from local/mock development to a store-ready build aligned with the MVP quotation (Firebase backend, subscription validation, real push).

## Mobile app (Expo / EAS)

1. **Firebase client config**  
   Add production web SDK keys under `expo.extra.firebase` (or your chosen pattern) in `app.json`, matching the Firebase project used in production. Without valid Firebase config, `isMockDataMode()` may enable demo data—only acceptable for internal demos.

2. **Mock data off**  
   `app.json` sets `extra.useMockData` to `false` for release alignment. For local work **without** Firebase, set `EXPO_PUBLIC_USE_MOCK_DATA=1` (see [mockMode.ts](../src/config/mockMode.ts)) in your shell, `.env`, or a non-production EAS profile before `expo start`.

3. **EAS env**  
   The `production` profile in `eas.json` sets `EXPO_PUBLIC_USE_MOCK_DATA=0`. Add other secrets via [EAS Secrets](https://docs.expo.dev/build-reference/variables/) (e.g. API endpoints) as needed.

4. **Native store config**  
   - Android: `google-services.json` from Firebase, package name matches Play Console.  
   - iOS: `GoogleService-Info.plist`, bundle ID matches App Store Connect.

5. **IAP product IDs**  
   Ensure `app.json` → `extra.iapSkuMonthly` / `iapSkuYearly` match App Store Connect and Play Console SKUs.

## Cloud Functions (`mobile/firebase`)

1. **Deploy**  
   From `mobile/firebase` (or project root per your layout): `firebase deploy --only functions`

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
