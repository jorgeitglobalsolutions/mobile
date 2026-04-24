# Milestone 4 — QA & release (smoke matrix)

Use before tagging a release candidate or submitting to App Store / Play Console.

## Builds

```bash
cd mobile
npx eas-cli build --profile preview --platform android
npx eas-cli build --profile production --platform all
```

Submit (after successful production build):

```bash
npx eas-cli submit --profile production --platform ios
npx eas-cli submit --profile production --platform android
```

Adjust profiles in `eas.json` to match your org.

## Smoke tests (real Firebase + native IAP build)

| Area | Steps | Pass |
|------|--------|------|
| Auth | Sign up / sign in / sign out | |
| Onboarding | Complete profile wizard | |
| Routines | Open predefined routine, start workout | |
| Active workout | Log sets, Rest timer, End → Save / Discard | |
| History | Week strip, open session detail, Stats / Progress tabs | |
| Profile | Settings: units, notifications, reminder UTC | |
| Paywall | Trial → expiry path (or dev unlock only in dev builds) | |
| IAP | Purchase / restore (store sandbox or internal track) | |
| Push | Enable reminders, token saved; optional: wait for scheduled hour | |

## Performance / stability

- Cold start: app opens without red box errors.  
- Navigate rapidly between tabs 10+ times: no crashes.  
- Finish a workout with 5+ exercises: save succeeds, appears in History.

## Rollback

- Keep previous store binary available; Firebase Functions can be rolled back via release history if needed.
