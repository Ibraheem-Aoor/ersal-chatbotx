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

## 3. Startup License Enforcement Bypass

**File:** `packages/business/src/enterprise/license/startup.ts`

**What:** `assertLicenseAtStartup()` early-returns when `isEnterprise()`, skipping
the `getLicenseStatus()` check and `process.exit(1)` path.

**Upstream code:**
```typescript
export const assertLicenseAtStartup = async (): Promise<void> => {
  if (!(isEnterprise() || isCloud())) {
    return
  }
  const license = await getLicenseStatus()
  if (license.state === "missing" || license.state === "invalid") {
    logLicenseError(license.state, license.error)
    process.exit(1)
    return
  }
  // ... expired warning, valid info log
}
```

**Our code:**
```typescript
export const assertLicenseAtStartup = async (): Promise<void> => {
  if (!(isEnterprise() || isCloud())) {
    return
  }
  // FORK PATCH: skip license enforcement for self-hosted enterprise.
  if (isEnterprise()) {
    return
  }
  const license = await getLicenseStatus()
  // ... rest unchanged (only runs for isCloud())
}
```

**Why:** With `NEXT_PUBLIC_EDITION=enterprise`, the upstream code calls
`getLicenseStatus()` which finds no `LICENSE_KEY` → state `"missing"` →
`process.exit(1)` → container crash-loops. This patch makes the function
silently return for enterprise edition, matching patch #2's entitlement bypass.

**Call sites (both bypass cleanly):**
- `apps/builder/src/instrumentation.ts:16-19` — Next.js instrumentation hook
- `apps/worker/src/lib/bootstrap.ts:1-4` — worker startup

**Verify after sync:** App boots without `LICENSE_KEY` when `NEXT_PUBLIC_EDITION=enterprise`.

---

## 4. syncUserQuota Enabled for Enterprise Edition

**File:** `apps/worker/src/schedule/handlers/register-schedules.ts`

**What:** Moved `syncUserQuota` from the cloud-only scheduler list to a new
`CLOUD_OR_ENTERPRISE_SCHEDULERS` list. The scheduler now registers when
`NEXT_PUBLIC_EDITION` is `"cloud"` **or** `"enterprise"`.

**Upstream code (gates to cloud only):**
```typescript
const CLOUD_ONLY_SCHEDULERS = [
  ScheduleJobData.syncUserQuota,
  ScheduleJobData.reconcileTenants,
  ScheduleJobData.unsubscribeExpiredTrials,
] as const

// Registration:
if (isCloud) { /* register syncUserQuota, reconcileTenants */ }
```

**Our code:**
```typescript
const CLOUD_ONLY_SCHEDULERS = [
  ScheduleJobData.reconcileTenants,
  ScheduleJobData.unsubscribeExpiredTrials,
] as const

const CLOUD_OR_ENTERPRISE_SCHEDULERS = [
  ScheduleJobData.syncUserQuota,
] as const

// Registration:
if (isCloud || isEnterprise) { /* register syncUserQuota */ }
if (isCloud) { /* register reconcileTenants */ }
```

**Why:** syncUserQuota recounts contacts, workspaces, channels, and team members
from the source DB tables and writes corrected values to `UserQuota` + Redis.
It has **no portal dependency** — unlike `publishEntitlements`/`backfillDefaultPlan`
which call the private billing portal. Without this, enterprise deployments
accumulate counter drift (e.g., `workspacesUsed=2` when only 1 workspace exists).

**Portal-safe / portal-dependent classification:**
- ✅ `syncUserQuota` — DB-only, safe for enterprise
- ❌ `reconcileTenants` — reseller-specific, cloud-only
- ❌ `unsubscribeExpiredTrials` — disconnects all channels, dangerous off-cloud
- ❌ `publishEntitlements` / `backfillDefaultPlan` — private portal dependency

**Verify after sync:** Worker logs show `syncUserQuota` job registering. Run
`ScheduleJobData.syncUserQuota` → UserQuota counters match actual DB counts.

---

## 5. Plan Limit Propagation

**File:** `packages/business/src/billing/plan-service.ts` + `apps/builder/src/features/billing/actions/update-plan.action.ts`

**What:** Added `propagatePlanLimits()` method to `BillingPlanService` that
re-applies a plan's limits to all active/trial subscribers when an admin edits
the plan. Called automatically from `updatePlanAction` when `parsedInput.limits`
is present.

**Why:** Without this, when an admin changes a plan's contact or workspace limit,
existing subscribers keep the old limits until their next renewal cycle. This
bridges a gap in our self-hosted billing: upstream's cloud edition re-anchors
limits via the private portal `publishEntitlements` job, which we can't use.

**Verify after sync:** Edit a plan's limits in admin → existing subscribers' `UserQuota`
rows update immediately.

---

## 6. Branding Root-Tenant Fallback (Self-Hosted Fix)

**File:** `packages/business/src/platform/settings.ts`

**What:** `resolveTenantSettingsByDomain()` falls back to the root tenant's
branding when the upstream CustomDomain → Tenant path does not resolve, instead
of returning bare env defaults.

**Upstream code:**
```typescript
export const resolveTenantSettingsByDomain = async (
  domain: string | null | undefined,
): Promise<TenantSettings> => {
  if (!(domain && (await hasEnterpriseFeatures()))) {
    return getDefaultSettings()         // ← bare defaults
  }
  const customDomain = await customDomainService.findActiveByDomain(domain)
  if (!customDomain) {
    return getDefaultSettings()         // ← bare defaults
  }
  // ... apply custom domain branding
}
```

**Our code:**
```typescript
const resolveRootTenantFallback = async (): Promise<TenantSettings> => {
  // FORK PATCH: not gated by hasEnterpriseFeatures()
  const rootTenant = await tenantService.findById(ROOT_TENANT_ID)
  if (rootTenant?.status === "active") {
    const [defaults, helpItems] = await Promise.all([
      getDefaultSettings(),
      tenantHelpItemService.listByTenant(ROOT_TENANT_ID),
    ])
    return applyTenantSetting(defaults, rootTenant, helpItems, true)
  }
  return getDefaultSettings()
}

export const resolveTenantSettingsByDomain = async (
  domain: string | null | undefined,
): Promise<TenantSettings> => {
  // Upstream CustomDomain path (unchanged)
  if (domain && (await hasEnterpriseFeatures())) {
    const customDomain = await customDomainService.findActiveByDomain(domain)
    if (customDomain) { /* ... apply custom domain branding ... */ }
  }
  // FORK PATCH: fall back to root tenant branding
  return resolveRootTenantFallback()
}
```

**Why:** Self-hosted deployments have no `CustomDomain` rows (that table is for
upstream's cloud multi-tenancy). Without this patch, the admin's branding
configuration (brand name, logos, favicon, theme, custom CSS/JS, email
templates) set on the root tenant is silently ignored — the function returns
hardcoded defaults ("ChatbotX" name, generic logo paths, chatbotx.io URLs).

The fallback is deliberately **not** gated by `hasEnterpriseFeatures()` so that
branding resolves regardless of edition. The root tenant's branding columns are
NULL by default (set by the migration), so when no admin branding is configured
the result is identical to the old behavior — `applyTenantSetting` uses
`setting.brandName ?? defaults.name` and similar `??` chains.

**Verify after sync:** Set a brand name on the root tenant via Admin → Branding,
then reload any page — the configured brand name appears instead of "ChatbotX".

---

## 7. Seed Sets Root Tenant ownerId

**File:** `packages/database/src/seed/index.ts`

**What:** After creating the demo user, the seed updates the root tenant's
`ownerId` to point to that user.

**Upstream seed:** Does not touch the Tenant table (root tenant is created by
migration `20260614163529_add_tenant_tables` with `ownerId = NULL`).

**Our code (added after account creation):**
```typescript
// FORK PATCH: Link the root tenant (id 1) to the platform owner.
if (user?.id) {
  await db
    .update(tenantModel)
    .set({ ownerId: user.id })
    .where(eq(tenantModel.id, ROOT_TENANT_ID))
}
```

**Why:** The migration cannot set `ownerId` because no user exists at migration
time. On a fresh self-hosted install, the seed creates the first admin user —
this patch links that user as the root tenant's owner so that:
- `tenantService.findByOwner(userId)` resolves for the platform operator
- `resolveTenantSettingsByOwner()` returns the root tenant's branding
- Admin panel tenant management works end-to-end

**Verify after sync:** Run `db:setup` (migrate + seed) on a fresh database, then
query `SELECT "ownerId" FROM "Tenant" WHERE id = 1` — it should return the
demo user's ID, not NULL.

---

## 8. JavaScript Executor Step Hidden

**File:** `apps/builder/src/features/flows/react-flow/nodes/perform-action/menu.tsx`

**What:** The `executeJavascript` menu item in the flow editor's "Tools" step
picker is commented out so users cannot add it to new flows.

**Why:** The `executeJavascript` step POSTs user code to `JAVASCRIPT_EXECUTOR_URL`
(a sandboxed Docker service at `apps/javascript-executor/`). That service does
not exist in our deployment — the directory is missing and no container image is
built. Adding the step to a flow would cause a silent runtime failure. The
underlying step code (schema, editor/viewer UI, worker handler) is preserved
intact so re-enabling is a one-line uncomment when the executor is built.

**Not hidden:** The `generateCode` step is independent (uses `@faker-js/faker`
locally, no external service) and remains available.

**Verify after sync:** Open the flow editor → Add Step → Tools → confirm
"Execute Javascript" does not appear. Existing flows that already use the step
still render and display in the editor (the step definition remains registered).

---

## 9. Email Branding — Use Tenant Brand Name

**File:** `packages/mail/src/emails/dynamic-template.ts`

**What:** The dynamic email template footer uses `props.brandName` instead of
the hardcoded "⚡ Built with chatbotx.io".

**Upstream code:**
```html
<mj-text ...>⚡ Built with chatbotx.io</mj-text>
```

**Our code:**
```html
<mj-text ...>${esc(props.brandName)}</mj-text>
```

**Why:** All transactional emails should show our tenant's configured brand name,
not upstream's "ChatbotX" branding. The `brandName` prop is already passed to
`buildMjmlTemplate()` from every call site — this just uses it.

**Also:** `packages/mail/src/preview.ts` — preview sample `brandName` changed
from `"ChatbotX"` to `"Ersal"`.

**Verify after sync:** Send a test email → footer shows the configured brand
name, not "Built with chatbotx.io".

---

## 10. Thmanyah Sans Font

**Files:** `apps/builder/src/app/layout.tsx`, `apps/builder/src/app/globals.css`,
`apps/builder/public/fonts/thmanyah/` (5 woff2 files)

**What:** Thmanyah Sans (Arabic-native typeface) is loaded via `next/font/local`
and set as the default font via `--font-sans` CSS variable override.

**Why:** The app's default font (Inter) has limited Arabic support. Thmanyah Sans
is designed for Arabic text and provides proper glyph coverage for RTL content.
Falls back to Inter for Latin characters.

**Verify after sync:** Arabic text renders in Thmanyah Sans. Font loads without
CDN dependency (self-hosted woff2).

---

## 11. Arabic Zod Validation Messages

**File:** `apps/builder/src/components/zod-error-map-provider.tsx`

**What:** A client provider component sets Zod v4's built-in Arabic error map
(`zod/locales/ar`) when the app locale is `"ar"`. Rendered once in the root
layout.

**Why:** Without this, all form validation messages (required, invalid email,
min length, etc.) render in English regardless of the app locale. Zod v4 ships
with a complete Arabic locale that maps all standard issue codes.

**Verify after sync:** Set app locale to `ar` → submit an empty form → error
messages appear in Arabic (e.g., "حقل مطلوب" instead of "Required").

---

## 12. VAT Number Validation Removed

**File:** `apps/builder/src/features/billing/schema/billing-info.ts`

**What:** Removed the `regex(/^\d{15}$/)` constraint from the `vatNumber` field.
Now accepts any string (or empty).

**Why:** The 15-digit regex rejected valid Saudi VAT numbers and international
tax IDs that don't follow that exact format.

**Verify after sync:** Billing info form → enter any VAT number → saves
without validation errors.

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
| D6 | `packages/database/drizzle/20260711114121_billing-plans/migration.sql` | Removed duplicate IntegrationOpenaiCompatible + IntegrationInstagram DDL (already in upstream migrations 20260705000000 and 20260624063603). Hardened Subscription replacement: conditional DROP detects upstream's Stripe schema via `stripeCustomerId` column before dropping, `CREATE TABLE IF NOT EXISTS` guards re-runs. | Fixes fresh-migrate-from-zero failure: "relation already exists" |

---

## What is NOT patched (upstream code runs unchanged)

These upstream gates work correctly with `NEXT_PUBLIC_EDITION=enterprise`:

- `isCommunity()` → `false` — create workspace card, superAdmin toggles, OAuth providers all enabled
- `isCloud()` → `false` — cloud-only Stripe scoping, manage layout, platform credentials stay hidden (correct)
- `showEnterpriseItems` → `true` — branding, email templates, help items shown in admin sidebar
- `assertEnterpriseFeatures()` → passes — branding/email template mutations succeed
- `app/admin/(enterprise)/layout.tsx` → passes — enterprise admin pages load
- `app/space/[workspaceId]/(enterprise)/layout.tsx` → passes — workspace enterprise features accessible
