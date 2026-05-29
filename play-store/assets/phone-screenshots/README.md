# Phone screenshots (Play Store)

Google Play requires **at least 2** phone screenshots. Recommended: **4–8** showing core flows.

## Specs

| Requirement | Value |
|-------------|--------|
| Format | PNG or JPEG |
| Min size | 320 px on short side |
| Max size | 3840 px on long side |
| Aspect ratio | 16:9 to 9:16 (e.g. 1080×1920 or 1080×2400) |

## Suggested captures (internal testing build)

Save files here as `01-home.png`, `02-workout.png`, etc.

1. **Home** — habits / daily dashboard
2. **Routine detail** — exercises in a routine
3. **Active workout** — logging sets
4. **Paywall** — subscription plans (optional; avoid misleading claims)
5. **Progress / history** — charts or week strip
6. **Profile** — settings (shows account controls)

## How to capture

1. `npx eas-cli build --profile production --platform android` (or preview APK)
2. Install from **Internal testing** track
3. Use device screenshot (Power + Volume Down) or Android Studio **Device Manager → Screenshot**
4. Crop to phone frame if needed; no status-bar personal info

## Do not commit

Screenshots may contain test account emails. Add personal captures to `.gitignore` if preferred:

```
play-store/assets/phone-screenshots/*.png
play-store/assets/phone-screenshots/*.jpg
```

Keep this README in git; upload images directly in Play Console.
