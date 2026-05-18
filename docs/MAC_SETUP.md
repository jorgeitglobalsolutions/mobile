# macOS setup — EM Fit System (Expo / iOS)

This checklist matches the **EM Fit System** repo: Expo SDK **54**, Firebase Auth + Firestore, `expo-iap`, `expo-notifications`. Use it when moving development from Windows (or another machine) to a **Mac** for the iOS Simulator or Xcode workflows.

---

## 1. Hardware and OS

- Use a Mac that supports a **current Xcode** release (see [Apple’s Xcode requirements](https://developer.apple.com/support/xcode/)).
- Prefer cloning the repo under a normal folder such as `~/Developer/mobile`. Avoid relying on **OneDrive / iCloud-synced folders** as the only working copy (sync conflicts and locks can break Metro or `node_modules`).

---

## 2. Xcode and Simulator

1. Install **Xcode** from the Mac App Store (large download).
2. Open Xcode once; accept the license and finish **additional components** if prompted.
3. Install Command Line Tools if needed:

   ```bash
   xcode-select --install
   ```

4. Install an **iOS Simulator** runtime if Xcode prompts you (**Xcode → Settings → Platforms** or **Components**, depending on version).

---

## 3. Node.js

Install **Node 20 LTS** (or match whatever the team uses):

- [nodejs.org](https://nodejs.org), or  
- **nvm**: `nvm install 20 && nvm use 20`

Verify:

```bash
node -v
npm -v
```

Optional (helps React Native file watchers):

```bash
brew install watchman
```

---

## 4. Project on the Mac

Clone from Git (recommended):

```bash
cd ~/Developer
git clone <your-remote-url> mobile
cd mobile
```

Copy **`.env`** from your secure backup or recreate it from **`.env.example`** using Firebase Console → Project settings → Web app config.  
Do **not** commit `.env`.

---

## 5. Dependencies

From the repo root (`mobile/`):

```bash
npm install
```

---

## 6. Run on iOS Simulator

```bash
npm run ios
```

Or:

```bash
npx expo start
```

Then press **`i`** for the iOS Simulator.

Restart Metro after changing `.env` (`EXPO_PUBLIC_*` values are baked in at bundle time).

---

## 7. EAS (device builds, TestFlight)

This project includes **`eas.json`** and an Expo/EAS project reference in **`app.json`**.

```bash
npx eas-cli login
npx eas-cli build --platform ios --profile development
```

Use **`development`** when you need native modules (`expo-iap`, notifications) on a **physical device**. **Expo Go** alone does not mirror production for those features.

Production-oriented builds typically use the **`production`** profile in `eas.json`.

---

## 8. Firebase from the Mac

Use the same Firebase project as in `.env`. From the repo root:

```bash
npm run firebase:deploy:rules
```

Full backend deploy (Functions + Firestore rules), when needed:

```bash
npm run firebase:deploy
```

Ensure **`firebase/.firebaserc`** targets the correct project ID.

### QA subscription unlock (Paywall testing)

The repo includes **`firebase/functions/.env.em-fit-system-c0d3d`** with `ALLOW_DEV_SUBSCRIPTION=true`. That enables the callable **`grantDevSubscription`** used by the paywall **QA unlock via Firebase** button.

After changing Functions env, redeploy:

```bash
npm run firebase:deploy
```

In **Expo Go**, use **Unlock for testing** or **QA unlock via Firebase**. For UI-only testing without backend, use **Unlock on this device only**.

Remove or set `ALLOW_DEV_SUBSCRIPTION=false` before a production App Store release (see `docs/PRODUCTION_CHECKLIST.md`).

---

## 9. What behaves differently on iOS vs Simulator

| Area | Notes |
|------|--------|
| **In-app purchases (`expo-iap`)** | Real StoreKit behavior needs **device** + App Store Connect products (see `app.json` → `extra.iapSkuMonthly` / yearly). Simulator support is limited. |
| **Push notifications** | Needs proper certs / EAS setup and usually a **physical device**; Simulator is not a substitute for full APNs testing. |
| **Ports** | If Metro fails on **8081**, try `npx expo start --port 8082`. |

---

## 10. Quick troubleshooting

- **`permission-denied` in the app** — Deploy Firestore rules so they match the repo (`firebase/firestore.rules`), especially newer collections such as `weightEntries`.
- **`firebase-tools` / deploy errors** — Run `firebase login` and confirm project selection matches `.firebaserc` and `EXPO_PUBLIC_FIREBASE_PROJECT_ID`.
- **Native build issues after upgrading** — Run `npx expo-doctor` and align Node with [Expo’s docs for SDK 54](https://docs.expo.dev/).

---

## 11. Same-day sanity check

1. Xcode + Simulator opens cleanly.  
2. `npm install` completes without errors.  
3. `.env` present with valid `EXPO_PUBLIC_FIREBASE_*` keys.  
4. `npm run ios` launches the app and **sign-in** works against your Firebase project.  
5. Optional: `npm run firebase:deploy:rules` if you recently changed rules.
