# Fork Patches — ErsalTech ChatbotX

Deliberate divergences from upstream that must survive every sync.
After merging upstream changes, verify each patch is still applied.

---

## 1. Enterprise Edition Assumption

**File:** `NEXT_PUBLIC_EDITION` environment variable (`.env`, not committed)

**What:** Set `NEXT_PUBLIC_EDITION=enterprise` instead of upstream's default `community`.

**Why:** Upstream gates many features behind `isCommunity()` checks (create workspace,
superAdmin toggles, etc.) and `showEnterpriseItems` / `hasEnterpriseFeatures()` guards
(branding, email templates, help items). Running as `enterprise` makes all of these
pass without per-file patches. The only code change needed is patch #2 below.

**Env lines to set (both staging and production `.env`):**
```
NEXT_PUBLIC_EDITION=enterprise
```

**Verify after sync:** `isCommunity()` returns `false`, `isEnterprise()` returns `true`.

---

## 2. Enterprise Entitlement Bypass

**File:** `packages/business/src/user/entitlements.ts`

**What:** `hasEnterpriseFeatures()` returns `true` immediately when `isEnterprise()`,
bypassing the offline license key check (`getLicenseStatus()`).

**Upstream code:**
```typescript
export const hasEnterpriseFeatures = async (): Promise<boolean> => {
  if (!(isCloud() || isEnterprise())) {
    return false
  }
  const license = await getLicenseStatus()
  return license.state === "valid"
}
```

**Our code:**
```typescript
export const hasEnterpriseFeatures = async (): Promise<boolean> => {
  // FORK PATCH: bypass license check for self-hosted enterprise
  if (isEnterprise()) {
    return true
  }
  if (!isCloud()) {
    return false
  }
  const license = await getLicenseStatus()
  return license.state === "valid"
}
```

**Why:** We don't have an upstream license key. Without this patch,
`hasEnterpriseFeatures()` returns `false` even with `NEXT_PUBLIC_EDITION=enterprise`,
which hides branding, email templates, and blocks the admin enterprise layout.

**Downstream effects (all positive):**
- `showEnterpriseItems` in `app/admin/layout.tsx` → `true` → sidebar shows branding + email templates + help items
- `app/admin/(enterprise)/layout.tsx` guard → passes → `/admin/branding` and `/admin/email-templates` load
- `assertEnterpriseFeatures()` (4 call sites: branding update, email template update/preview, audit logs) → passes → mutations succeed
- `packages/business/src/platform/settings.ts` (3 call sites: tenant settings entitlement, custom domain) → behaves as enterprise

**Verify after sync:** `hasEnterpriseFeatures()` returns `true`. Admin → Branding page loads.

---

## Data Patches (non-edition, re-apply if overwritten)

These are translation/config fixes, not edition-gated. They may be overwritten
if upstream modifies the same files.

| # | File | Change | Why |
|---|------|--------|-----|
| D1 | `apps/builder/src/i18n/config.ts` | Added `enabledLocales: ["ar", "en"]` | Upstream has 20 locales; we only show ar + en in the selector |
| D2 | `apps/builder/src/components/lang-selector.tsx` | Uses `enabledLocales` instead of `locales` | Filters the language selector to our 2 locales |
| D3 | `apps/builder/src/features/admin/components/admin-sidebar.tsx` | Plans/Subscriptions/PaymentHistory use staging translation keys (`plans.title`, `subscriptions.title`, `billing.manage.paymentHistory`) | Upstream renamed to `platformAdmin.*` keys that don't exist in our translation files |
| D4 | `apps/builder/messages/en.json` | 20 restored translation keys (billing, fields, flows, platformSettings, whatsapp) | Lost during Phase 4 merge |
| D5 | `apps/builder/messages/ar.json` | `fields.wabaId.label` = `"معرّف WABA"` | Overwritten with English during merge |

---

## What is NOT patched (upstream code runs unchanged)

These upstream gates work correctly with `NEXT_PUBLIC_EDITION=enterprise`:

- `isCommunity()` → `false` — create workspace card, superAdmin toggles, OAuth providers all enabled
- `isCloud()` → `false` — cloud-only Stripe scoping, manage layout, platform credentials stay hidden (correct)
- `showEnterpriseItems` → `true` — branding, email templates, help items shown in admin sidebar
- `assertEnterpriseFeatures()` → passes — branding/email template mutations succeed
- `app/admin/(enterprise)/layout.tsx` → passes — enterprise admin pages load
- `app/space/[workspaceId]/(enterprise)/layout.tsx` → passes — workspace enterprise features accessible
