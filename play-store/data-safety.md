# Data safety form (Google Play)

Use **App content → Data safety**. Answers reflect the current app (Firebase Auth + Firestore, `expo-iap`, `expo-notifications`). Update if you add analytics SDKs or new data types.

**Privacy policy (required):** https://estaciondemusculacion.com/privacy

---

## Overview

| Question | Answer |
|----------|--------|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (HTTPS / TLS to Firebase and Google) |
| Do you provide a way for users to request that their data is deleted? | **Yes** — Profile → **Delete account** (removes Firestore data + Firebase Auth via `deleteAccount` Cloud Function) |

---

## Data types collected

### Personal info

| Data type | Collected | Shared | Purpose | Optional | Ephemeral |
|-----------|-----------|--------|---------|----------|-----------|
| **Email address** | Yes | No* | Account management, authentication | No (required to sign up) | No |
| **Name** | Yes (display name) | No* | Account management | Yes (profile) | No |

\*Data is stored on **Google Firebase** (processor/hosting). Declare **third-party sharing** only if Play treats cloud processors as “sharing”; many developers select data is **not shared with third parties for advertising** and document Firebase under “data is processed by service providers” per current Play wording — align with your privacy policy.

### Health and fitness

| Data type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| **Fitness info** | Yes | No* | App functionality — workouts, routines, exercise logs, habit completion |
| **Health info** (if Console lists nutrition/weight separately) | Yes | No* | Nutrition habits, body weight, macros, custom foods |

Includes: workout sessions, routines, habit day logs (protein, water, calories, carbs, fat, mood), weight entries, custom foods, user profile (height, weight, goal).

### App activity

| Data type | Collected | Purpose |
|-----------|-----------|---------|
| **App interactions** (if offered) | Optional | In-app event log under `users/{uid}/events` for audit (sign-in, settings, meals, etc.) — app functionality |

### Financial info

| Data type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| **Purchase history** | Yes | With **Google Play** | Subscription status via Play Billing; server verifies token via `verifyPurchase` |

Payment card data is handled by **Google Play**, not stored in your Firestore.

### Device or other IDs

| Data type | Collected | Purpose |
|-----------|-----------|---------|
| **Device or other IDs** | Yes (push token) | Push notifications for habit reminders when user enables notifications |

Stored as `pushToken` on `users/{uid}`.

---

## Data NOT collected (typical)

- Location (GPS)
- Photos / videos / audio / files
- Contacts, SMS, call logs
- Web browsing history
- Precise device advertising ID (no ad SDK in app)

---

## Data usage purposes (select in form)

- **App functionality** — primary
- **Account management**
- **Developer communications** (if you email users from support address)
- **Fraud prevention, security, and compliance** (auth, subscription validation)

Do **not** select **Advertising** or **Marketing** unless you add those features.

---

## Data handling

| Question | Answer |
|----------|--------|
| Data collection required or optional | Email required for account; fitness/habit data optional but needed to use features |
| Users can request deletion | **Yes** — in-app delete account |
| Data retention | Deleted when user deletes account; otherwise retained while account is active |
| Sold to third parties | **No** |
| Used for targeted ads | **No** (no ad SDK) |

---

## Security practices

- Data encrypted in transit: **Yes**
- Users can ask for deletion: **Yes** (in-app)

---

## Third parties (declare in form / privacy policy)

| Service | Role |
|---------|------|
| **Google Firebase** (Auth, Firestore, Cloud Functions) | Authentication, database, backend |
| **Google Play** | Subscriptions and payments |
| **Expo** (push) | Delivering push notifications when enabled |

---

## Account deletion (Play policy)

- **Where:** Profile screen → **Delete account**
- **What:** Recursive delete of `users/{uid}` and subcollections (`routines`, `workouts`, `habitDays`, `workoutDrafts`, `events`, `weightEntries`, `customFoods`), then Firebase Auth user removal

Ensure the public privacy policy describes the same.
