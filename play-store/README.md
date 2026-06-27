# Google Play Console setup (EM Fit System)

Use this folder when creating the Play app, subscriptions, Data safety form, and store listing. Values match [`app.json`](../app.json) and [`PaywallScreen.tsx`](../src/screens/PaywallScreen.tsx).

**Console:** [Google Play Console](https://play.google.com/console)

## Quick checklist

| Step | Doc / asset | Done |
|------|-------------|------|
| Create app (package name) | [app-details.md](./app-details.md) | ☐ |
| Monetization → Subscriptions | [subscriptions.md](./subscriptions.md) | ☐ |
| Main store listing (en-US) | [listing/en-US/](./listing/en-US/) + [assets/](./assets/) | ☐ |
| Phone screenshots (min 2) | [assets/phone-screenshots/README.md](./assets/phone-screenshots/README.md) | ☐ |
| Data safety | [data-safety.md](./data-safety.md) | ☐ |
| Content rating, target audience, ads | Console wizards | ☐ |
| Link Cloud project + service account | [../docs/PRODUCTION_CHECKLIST.md](../docs/PRODUCTION_CHECKLIST.md) | ☐ |
| Internal testing track + license testers | Below | ☐ |

## 1. Create the app

1. Play Console → **Create app**
2. **App name:** EM Fit System
3. **Default language:** English (United States)
4. **App or game:** App
5. **Free or paid:** Free (subscriptions are in-app)
6. Accept declarations → **Create app**

### App identity (must match build)

| Field | Value |
|-------|--------|
| Package name | `com.jorgeitglobalsolutionssorganization.emfitsystem` |
| Firebase Android app | Register same package in Firebase Console |

Set under **Grow → Store presence → Main store listing** (see section 3).

## 2. Subscriptions

Follow [subscriptions.md](./subscriptions.md). Product IDs **must** be:

- `em_fit_monthly`
- `em_fit_yearly`

Activate both before internal-track IAP testing.

## 3. Store listing assets

### Generate graphics

From repo root (Windows):

```powershell
.\scripts\generatePlayStoreAssets.ps1
```

Upload outputs from `play-store/assets/`:

| File | Play Console field | Spec |
|------|-------------------|------|
| `icon-512.png` | App icon | 512×512 PNG |
| `feature-graphic.png` | Feature graphic | 1024×500 PNG |

### Copy (en-US)

Paste from `play-store/listing/en-US/`:

- `title.txt` (max 30 characters)
- `short-description.txt` (max 80 characters)
- `full-description.txt` (max 4000 characters)

### Screenshots

Capture from a **production or internal** Android build (not Expo Go). See [assets/phone-screenshots/README.md](./assets/phone-screenshots/README.md).

**Also required:** Privacy policy URL `https://estaciondemusculacion.com/privacy` (same as `app.json` → `legalPrivacyUrl`).

## 4. Data safety

Complete **App content → Data safety** using the pre-filled answers in [data-safety.md](./data-safety.md). Review with your privacy policy before publishing.

## 5. Policies & testing

- **App content → Privacy policy:** `https://estaciondemusculacion.com/privacy`
- **App content → Account deletion:** In-app **Profile → Delete account** (calls Cloud Function `deleteAccount`)
- **Testing → Internal testing:** Create release, upload AAB from `eas build --profile production --platform android`, add license testers
- **Setup → API access:** Link Google Cloud project; grant service account permissions (see below)

### EAS Submit service account (`eas submit`)

If submit fails with *"The service account is missing the necessary permissions"*, fix **Play Console**, not the app code.

**Service account email (from your key):** `play-submit@em-fit-system-c0d3d.iam.gserviceaccount.com`

#### A. Google Cloud (project `em-fit-system-c0d3d`)

1. [Google Play Android Developer API](https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com) → **Enable** for this project.
2. Confirm the JSON key at `.eas-play-service-account.json` belongs to `play-submit@...` (same email as above).

#### B. Play Console → link Cloud project

1. **Setup → API access**
2. Link the Google Cloud project **em-fit-system-c0d3d** if not already linked.
3. Under **Service accounts**, you should see `play-submit@em-fit-system-c0d3d.iam.gserviceaccount.com`. If it shows **Grant access**, click it and continue with step C.

#### C. Play Console → invite user & app permissions

1. **Users and permissions** → **Invite new users** (or edit existing `play-submit@...`).
2. Email: `play-submit@em-fit-system-c0d3d.iam.gserviceaccount.com`
3. **App permissions** tab → add app **EM Fit System** (`com.jorgeitglobalsolutionssorganization.emfitsystem`).
4. Role: **Release manager** (recommended). Or enable at minimum:
   - **Release apps to testing tracks** (required for `track: internal` in `eas.json`)
   - **View app information and download bulk reports**
   - **Manage testing tracks and edit tester lists** (optional but useful)
5. Save / **Invite user**. Status must be **Active** (not “Invitation sent” only).

#### D. Retry submit

```powershell
eas submit --platform android --profile production
```

Permissions can take **15–30 minutes** (sometimes up to 24h) to propagate after changes.

#### E. First release note

If the app has **never** had an AAB uploaded to any track, upload **one release manually** in Play Console → **Testing → Internal testing** → Create release → upload the same `.aab` from EAS once. After that, `eas submit` usually works for subsequent builds.

**Separate account for IAP verification:** Cloud Functions use `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (may be a different service account). Play **submit** and **purchase verification** can use the same account if it has both Play Console release permissions and Android Publisher API access.

## 6. Subscription disclosure (store)

In listing / subscription benefits, state:

- 7-day free trial for new subscribers
- Then $9.99/month or $79.99/year (localized by Play)
- Auto-renews until canceled in Google Play
- Matches in-app paywall copy

## Related docs

- [PRODUCTION_CHECKLIST.md](../docs/PRODUCTION_CHECKLIST.md) — Firebase, Functions, EAS
- [QA_RELEASE_CHECKLIST.md](../docs/QA_RELEASE_CHECKLIST.md) — Smoke tests before submit
