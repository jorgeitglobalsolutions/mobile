# Exercise GIFs — Firebase Storage

Exercise demo GIFs are loaded from **Firebase Storage** at runtime (not bundled in the app).

## One-time setup

1. **Enable Storage** in [Firebase Console → Storage](https://console.firebase.google.com/project/em-fit-system-c0d3d/storage) → **Get started**.
2. Ensure `.env` has `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` matching the bucket name shown in Console (e.g. `em-fit-system-c0d3d.firebasestorage.app`).
3. Deploy rules and upload assets from repo root:

```powershell
npm run firebase:deploy:storage
npm run exercises:upload
```

## Adding or updating GIFs

1. Add `.gif` files under `assets/exercises/<muscle folder>/`.
2. Regenerate catalog: `npm run exercises:generate`
3. Upload new files: `npm run exercises:upload`  
   (Use `node firebase/functions/scripts/uploadExerciseGifs.mjs --skip-existing` to only upload new IDs.)

## App behavior

- URLs: `exercises/{exerciseId}.gif` via `getExerciseGifUrl()` in `src/data/exerciseGifUrls.ts`
- Storage rules: public read on `exercises/*` (`firebase/storage.rules`)
- Local `assets/exercises/` remains the source of truth for uploads; it is no longer `require()`’d in the app bundle
