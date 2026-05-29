# Play Console subscriptions

Product IDs must match [`app.json`](../app.json) `extra.iapSkuMonthly` / `iapSkuYearly` and Cloud Functions `IAP_SKU_MONTHLY` / `IAP_SKU_YEARLY`.

## Products to create

Path: **Monetize → Products → Subscriptions → Create subscription**

---

### Subscription 1: Monthly

| Field | Value |
|-------|--------|
| Product ID | `em_fit_monthly` |
| Name (admin) | EM Fit Monthly |
| Description (admin) | Full access — billed monthly after free trial |

**Base plan**

| Field | Value |
|-------|--------|
| Base plan ID | `monthly` (or default) |
| Billing period | 1 month |
| Price | USD **9.99** (set other countries via pricing template) |
| Renewal | Auto-renewing |

**Free trial offer** (required — matches 7-day in-app trial)

1. Base plan → **Add offer** → **Free trial**
2. Duration: **7 days**
3. Eligibility: **New customer acquisition** (or equivalent for first-time subscribers)
4. Activate the offer and base plan

---

### Subscription 2: Yearly

| Field | Value |
|-------|--------|
| Product ID | `em_fit_yearly` |
| Name (admin) | EM Fit Yearly |
| Description (admin) | Full access — billed yearly after free trial |

**Base plan**

| Field | Value |
|-------|--------|
| Base plan ID | `yearly` (or default) |
| Billing period | 1 year |
| Price | USD **79.99** |
| Renewal | Auto-renewing |

**Free trial offer**

- Same as monthly: **7 days** free trial for new subscribers

---

## Subscription benefits (Play listing)

Use for **Subscription details** / benefits text:

- Unlimited workouts and custom routines
- Exercise library (90+ exercises)
- Habit and nutrition tracking
- Progress charts and cloud sync

## Testing

1. **Monetize → Monetization setup:** complete merchant account if prompted
2. Activate both subscriptions (status **Active**)
3. **Setup → License testing:** add tester Gmail accounts
4. Upload build to **Internal testing**; install via opt-in link
5. Verify purchase + **Restore purchase** against deployed `verifyPurchase` function

## Backend alignment

| Env / config | Value |
|--------------|--------|
| `GOOGLE_PLAY_PACKAGE_NAME` | `com.jorgeitglobalsolutionssorganization.emfitsystem` |
| `IAP_SKU_MONTHLY` | `em_fit_monthly` |
| `IAP_SKU_YEARLY` | `em_fit_yearly` |
| Service account | Play Console → **Setup → API access** → link project, grant **Financial data** |

Do **not** enable `ALLOW_DEV_SUBSCRIPTION` in production Functions env.
