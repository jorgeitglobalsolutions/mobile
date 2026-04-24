# Apple Root CA for IAP JWS verification

`AppleRootCA-G3.cer` must be present for `verifyPurchase` to validate iOS StoreKit signed transactions (see `verifyPurchaseStores.ts`).

Download from Apple (official):

- [Apple Root CA - G3](https://www.apple.com/certificateauthority/AppleRootCA-G3.cer)

Place the `.cer` file in this folder next to this README. It is checked into the repo when available so Cloud Functions deployments include it.

If you rotate or add roots, follow [Apple PKI](https://www.apple.com/certificateauthority/) and update the verifier setup in code if multiple roots are required.
