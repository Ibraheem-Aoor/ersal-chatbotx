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

## 13. Flow Quota Enforcement at Creation Time

**Files:** `apps/builder/src/features/flows/actions/create-flow-action.ts`,
`packages/business/src/user-quota/service.ts`

**What:** Before creating a flow, the action looks up the workspace owner's
`UserQuota` row and checks `flowsUsed < flowsLimit`. If at limit, creation
is blocked with a `flowLimitReached` error. On success, `flowsUsed` is
atomically incremented via a conditional SQL UPDATE (race-safe without
distributed locks).

**Why:** The `flowsLimit` and `flowsUsed` columns already exist (added in
migration `20260712153647`) and are set by `applyPlanEntitlements`, but
there was no enforcement gate — any user could create unlimited flows
regardless of their plan's configured limit.

**Verify after sync:** Set a plan with `flowsLimit: 2`, create 2 flows →
third creation is blocked with "Flow limit reached for this plan".

---

## 14. AI Agent Quota Enforcement at Creation Time

**File:** `apps/builder/src/features/ai-agents/actions/create.action.ts`

**What:** Before creating an AI agent, the action looks up the workspace
owner's `UserQuota.aiAgentsEnabled` flag. If `false`, creation is blocked
with an `aiAgentNotEnabled` error.

**Why:** The `aiAgentsEnabled` column exists and is set by
`applyPlanEntitlements`, but there was no enforcement — users on plans
with AI agents disabled could still create them.

**Verify after sync:** Set a plan with `aiAgents: false`, attempt to create
an AI agent → blocked with "AI agents are not available on this plan".

---

## 15. Quota Usage Display — Flows & Broadcasts

**File:** `apps/builder/src/app/space/[workspaceId]/billing/page.tsx`

**What:** The billing page's "Usage Summary" section now shows flows and
broadcasts alongside the 5 upstream metrics (contacts, MAC, workspaces,
channels, team members). Each shows "X of Y used" with a progress bar
when a limit is configured, or "Unlimited" when the limit is null.

**Why:** The fork-only `flowsUsed`/`flowsLimit` and
`broadcastsUsed`/`broadcastsLimit` columns were never wired into the
display. Users had no way to see how many flows or broadcasts they had
used against their plan's limits.

**Verify after sync:** Navigate to `/space/{workspaceId}/billing` →
"Usage Summary" card shows flows and broadcasts with their current
used/limit values.

---

## 16. Always Fetch UserQuota for Plan Name Display

**File:** `apps/builder/src/lib/workspace-quota.ts`

**What:** `resolveWorkspaceBlockState()` previously short-circuited on
`!isCloud()`, returning `quota: null`. This meant `planName` was always
null for non-cloud editions, causing NavUser to show "Subscribe now"
instead of "Manage subscription" even when the user has an active plan
assigned by admin. Now the `UserQuota` row is always fetched so
`planName` flows through to the sidebar. Blocking logic (trial expiry,
MAC limit) remains cloud-only.

**Why:** The fork runs as `enterprise`, not `cloud`. Without this patch
the admin-assigned plan is invisible in the sidebar — users can't access
the manage-subscription page or see their current plan badge.

**Verify after sync:** Assign a plan to a user via admin panel → their
NavUser dropdown shows the plan badge and "Manage subscription" link
(not "Subscribe now").

---

## 17. SKIP_WABA_* Attempt-and-Skip Pattern (Restored)

**Files:**
- `integrations/whatsapp/src/api/waba-setup.ts` — flags 1–3
- `integrations/whatsapp/src/api/webhook.ts` — flag 4

**What:** Restores the pre-sync attempt-and-skip pattern for four
SKIP_WABA_* env flags. The upstream sync changed them from error-recovery
guards (try → catch → skip if flag set) to early-return guards (skip
before calling). The pre-sync pattern is better for non-BSP self-hosted
deployments because it **attempts** the call (which may succeed) and only
skips on failure. Also restores specific Facebook API error subcode
handling in `shareCreditLine` (1752244 = same business; 1752294 =
invoicing policy) that was lost in the sync.

| Flag | Function | File |
|------|----------|------|
| `SKIP_WABA_USER_ASSIGNMENT` | `addSystemUser` | `waba-setup.ts` |
| `SKIP_WABA_CREDIT_SHARING` | `shareCreditLine` | `waba-setup.ts` |
| `SKIP_WABA_PHONE_REGISTRATION` | `registerPhoneNumber` | `waba-setup.ts` |
| `SKIP_WABA_WEBHOOK_SUBSCRIBE` | `subscribeWebhook` | `webhook.ts` |

**Why:** Non-BSP self-hosted deployments (like ours) don't have the Meta
BSP system-user setup. Without the try-catch-skip pattern,
`connectWhatsappAction` fails fatally on `addSystemUser` with
"(#100) Param user does not accept global user IDs".

**Env vars to set (staging + production `.env`):**
```
SKIP_WABA_USER_ASSIGNMENT=true
SKIP_WABA_CREDIT_SHARING=true
SKIP_WABA_PHONE_REGISTRATION=true
SKIP_WABA_WEBHOOK_SUBSCRIBE=true
```

**Verify after sync:** grep for `SKIP_WABA` in `integrations/whatsapp/`
and confirm each function has the outer try-catch-skip wrapper (not
early-return). Verify WhatsApp connect completes with all four flags set.

---

## 18. Public Asset Paths in Middleware (sounds, fonts)

**Files:** `apps/builder/src/proxy.ts`

**What:** Added `/sounds` and `/fonts` to BOTH the `publicRoutes` array AND the
matcher negative-lookahead regex. Without this, requests to static assets in
`apps/builder/public/sounds/` and `public/fonts/` pass through the auth middleware
and may be redirected to `/auth/sign-in` instead of being served directly.

**Why:** The notification sound (`/sounds/notification.wav`) is loaded by an
`HTMLAudioElement` that may not carry session cookies in all contexts. Fonts
loaded via `@font-face` fail on unauthenticated pages like `/auth/sign-in`.
Other public dirs (`brand/`, `chat-widget/`) were already excluded.

**Verify after sync:** `GET /sounds/notification.wav` returns 200 (audio data),
not 307 to `/auth/sign-in`. Font files load on the sign-in page.

---

## 19. Notification Audio Unlock on User Gesture

**Files:**
- `apps/builder/src/features/notifications/notification-store.ts`
- `apps/builder/src/features/notifications/workspace-notifications.tsx`

**What:** Added `unlockNotificationAudio()` function that plays the notification
audio element silently (volume 0) during the first user interaction (pointerdown,
keydown, touchstart). `WorkspaceNotifications` attaches these listeners with
`{ once: true }` at the workspace layout level.

**Why:** Browser autoplay policy blocks `HTMLAudioElement.play()` until a page has
received a user-activation event. Without priming, `playNotificationSound()` is
silently rejected on fresh/incognito sessions. This pattern satisfies the browser
requirement on the very first interaction, so all subsequent notification sounds
play reliably — no user configuration needed.

**Verify after sync:** In an incognito window, sign in, click anywhere once, then
receive an incoming message — notification sound should play.

---

## 20. Flow Import Schema Extraction ("use server" Compliance)

**Files:**
- `apps/builder/src/features/flows/schema/action.ts` (NEW)
- `apps/builder/src/features/flows/actions/import-flow.action.ts`
- `apps/builder/src/features/flows/import-flow-dialog.tsx`

**What:** Moved `importFlowSchema` (zod object) and `ImportFlowSchema` (inferred
type) out of the `"use server"` action file into a new `schema/action.ts` file.
The action file now imports them; `import-flow-dialog.tsx` imports the schema from
`./schema/action` and the action from `./actions/import-flow.action`.

**Why:** Next.js 16 forbids non-async-function exports from `"use server"` modules.
The exported zod schema object caused a runtime error:
`A "use server" file can only export async functions, found object (digest 87439518@E352)`.
This poisoned the entire flows action chunk, breaking server actions app-wide.

**Upstream convention:** Upstream keeps action schemas in `features/<name>/schema/action.ts`
(26 features use `schema/`, 53 use `schemas/`). Flows' adjacent features (`flow-versions`,
`folders`) use `schema/`, so this patch matches.

**Verify after sync:** Flow import dialog opens without runtime errors. Importing a
valid `.json` file creates the flow.

---

## 21. Coerce rootFolderId to null on Flow Insert (FK Violation Fix)

**Files:**
- `apps/builder/src/features/flows/import-flow-dialog.tsx`
- `apps/builder/src/features/flows/actions/import-flow.action.ts`
- `apps/builder/src/features/flows/actions/create-flow-action.ts`
- `packages/business/src/flow/service.ts`

**What:** `rootFolderId` is the string `"0"` — a UI sentinel meaning "no folder"
(used in queries as `{ isNull: true }`, in the URL as the default search param).
The import-flow dialog and action were passing it through to `flowModel.insert()`
as `folderId: "0"`, triggering a Postgres FK constraint violation because no
`Folder` row with `id = 0` exists.

Fixed at three layers (defense in depth):
1. **import-flow-dialog.tsx**: coerce `folderId` to null when it equals `rootFolderId`
2. **import-flow.action.ts**: guard `parsedInput.folderId !== rootFolderId`
3. **create-flow-action.ts**: guard `parsedInput.folderId !== rootFolderId` (safety net)
4. **flowService.importFlow()**: guard `input.folderId !== rootFolderId` (service-layer safety net)

The create-flow-dialog already had this guard (line 78), matching every other
create dialog in the codebase (email-topics, bot-fields, custom-fields, tags).
The import path was the only one missing it.

**Verify after sync:** Create and import a flow from the root flows page (no folder
selected) — both must succeed with `folderId = null` in the DB, not `"0"`.

---

## 22. NavUser Theme Switcher — Plain Menu Items (Base UI Error #31)

**File:** `apps/builder/src/components/nav-user.tsx`

**What:** Replaced the embedded `<ThemeSwitcher />` component (renders interactive
`Button` components) inside a `DropdownMenuItem` with plain `DropdownMenuItem`s
per theme option (light / dark / system), each with an `onClick` that calls
`setTheme()`. Shows a `Check` icon on the active theme, mirroring the locale
group directly above it.

**Why:** `ThemeSwitcher` renders `<Button>` components — interactive Base UI
primitives. Nesting them inside `DropdownMenuItem` triggers Base UI production
error #31 on `onMouseDown`, crashing the user avatar menu. This is the same
nesting-violation class already fixed for dialogs in this file. The standalone
`ThemeSwitcher` component is preserved for use outside menus (e.g. auth layout).

**Verify after sync:** User avatar menu opens without crash; all three theme
options appear with a check on the active one; switching themes works. Auth page
theme switcher (standalone) still works.

---

## 23. Fix Base UI error #31 — DropdownMenuLabel outside DropdownMenuGroup + RefreshAllChannelTokensButton prop forwarding

**Files:** `apps/builder/src/components/nav-user.tsx`,
`apps/builder/src/features/workspaces/components/refresh-all-channel-tokens-button.tsx`

**What (nav-user):** The `{workspaceId && ...}` block rendered a `<DropdownMenuLabel>`
(plan `<Badge>`) as a sibling of `<DropdownMenuGroup>` rather than inside it. Since
`DropdownMenuLabel` wraps `MenuPrimitive.GroupLabel`, it requires a parent
`MenuPrimitive.Group` (= `DropdownMenuGroup`) for `MenuGroupContext`. Without it,
Base UI throws production error #31 ("MenuGroupContext is missing"). The fix moves the
label inside the `DropdownMenuGroup` alongside the billing/subscribe menu items.

This error only triggered for workspace users (where `workspaceId` is set and
`planName` is present). Admin-only menus had no orphan labels, so they never crashed.

**What (RefreshAllChannelTokensButton):** The component is used as
`render={<RefreshAllChannelTokensButton />}` inside a `DropdownMenuItem`. Base UI
clones the element via `React.cloneElement` and merges its own props (role, tabIndex,
keyboard handlers, ref). The original component ignored all incoming props — it
rendered a hardcoded `<button>` with its own styles. This meant Base UI's menu
keyboard navigation, focus management, and ARIA attributes never reached the DOM.

Fixed by accepting `ComponentProps<"button">` with `ref` and spreading `...rest` onto
the root `<button>`, so Base UI's merged props reach the DOM element.

**Why:** Base UI `MenuPrimitive.GroupLabel` requires `MenuGroupContext` from a parent
`MenuPrimitive.Group`. Without it, accessing the context throws error #31 on any mouse
event. The `RefreshAllChannelTokensButton` fix ensures proper render-prop composition
so the menu item is keyboard-navigable and accessible.

**Verify after sync:** Open the user avatar menu while logged in as a workspace user
with a plan. Menu opens without crash, plan badge displays, keyboard navigation works
on all items including "Refresh all channel tokens".

---

## 24. Enable usage metrics display for enterprise edition

**File:** `apps/builder/src/app/space/[workspaceId]/layout.tsx`

**What:** Removed the `isCloud()` gate on the `quotaEnforcementService.getWorkspaceUsageSummary()`
call. Previously, the workspace usage summary was only fetched for the cloud edition —
enterprise always received `null`, so `buildWorkspaceQuotaMetrics(null)` returned `[]`
and `NavUsage` rendered nothing in the sidebar.

Now the usage summary is fetched unconditionally. The `NavUsage` component renders a
usage ring for any metric that has a numeric `limit` in the plan's `UserQuota` row.
Metrics with `null` limits are automatically hidden by `buildWorkspaceQuotaMetrics`.

The expired-trial banner (`ExpiredBanner`) remains cloud-only — that blocking UX does
not apply to enterprise.

**Why:** Enterprise billing plans set numeric limits on contacts, channels, workspaces,
and team members via the `UserQuota` row. Without fetching the usage summary, the
sidebar never displayed how much of the plan's quota was consumed.

**Verify after sync:** Sidebar footer shows a usage ring when the workspace owner's
plan has numeric limits. Metrics without limits are hidden. Expired-trial banner does
NOT appear for enterprise users.

---

## 25. Restore WhatsApp template creation — button, validation, multi-WA safety

**Files:**
- `apps/builder/src/features/integration-whatsapp/message-templates/message-templates-table-toolbar-actions.tsx`
- `apps/builder/src/features/integration-whatsapp/message-templates/create-message-template-dialog.tsx`
- `apps/builder/src/features/integration-whatsapp/message-templates/actions/create-message-template.action.ts`
- `apps/builder/src/features/integration-whatsapp/message-templates/schema/mutation.ts`
- `apps/builder/src/features/integration-whatsapp/message-templates/templates/button/edit-button-dialog.tsx`
- `apps/builder/src/features/integration-whatsapp/message-templates/templates/{text,image,video,document,catalog,product}/partial.tsx`
- `apps/builder/messages/en.json`, `apps/builder/messages/ar.json`

**What:** The "Create Template" button was silently dropped during the Phase 4 Base UI
sync (commit `6211e702d`), along with two earlier bugfix commits (`97403aaae`,
`0a8a8c0b7`). This patch restores everything:

1. **Re-wired Create button** in the toolbar actions (next to Synchronize).
2. **Thread `integrationWhatsappId`** through dialog → action → DB lookup. The action
   previously looked up the WhatsApp integration by `workspaceId` only — silently
   picking an arbitrary integration when a workspace has multiple WhatsApp numbers.
   Now scoped to both `workspaceId` + `id` using `workspaceIdAndIdRequestParams`.
3. **Latin-only name validation** (`/^[a-z0-9_]+$/`) on the template name field. Meta
   rejects non-latin names; without this, the form submits and the API returns an error.
4. **SwitchField instead of CheckboxGroupField** for boolean toggles (show header /
   show footer) across 6 template partials. CheckboxGroupField renders a checkbox list
   which is wrong UX for a single boolean.
5. **useWatch with `control: form.control`** in `edit-button-dialog.tsx`. Without the
   explicit `control`, `useWatch` reads from the parent form context instead of the
   dialog's own form, causing the button type dropdown to malfunction.
6. **Category descriptions** in en.json and ar.json — replaced placeholder strings.
7. **Deleted 3 dead files** (`._ts`/`._tsx` extensions, unreferenced predecessors).

**Why:** The Base UI migration commit adapted the `integrationWhatsapp` prop type from
`IntegrationWhatsappModel` to `IntegrationWhatsappLinkable` but dropped the dialog
import and JSX as collateral damage. The Phase 4 audit checked file existence but not
the render tree, so the regression went unnoticed.

**Verify after sync:** Navigate to WhatsApp channel → Message Templates tab. "Create"
button appears next to "Synchronize". Click Create → type selector opens → select Text
→ form shows name (latin-only), language, category (with real descriptions), header/
footer toggles (switches not checkboxes). Submit → template appears in the list.

---

## 26. WhatsApp Templates sidebar quick-access nav item

**Files:**
- `apps/builder/src/app/space/[workspaceId]/layout.tsx`
- `apps/builder/src/components/app-sidebar.tsx`

**What:** Adds a "Message Templates" item to the workspace sidebar for quick access to
WhatsApp template management. The layout fetches the workspace's WhatsApp integrations
and passes their IDs to the sidebar. The nav item's URL resolves based on how many WA
integrations the workspace has:

- **1 integration** → links directly to `/whatsapps/{id}/message-templates`
- **0 or 2+ integrations** → links to `/settings/channels/whatsapp` (connect or pick one)

The item is gated behind `superAdmin` permission, consistent with other settings-level
nav items.

**Why:** WhatsApp template management is a frequent workflow for users sending broadcast
campaigns. Without a sidebar item, the user has to navigate Settings → Channels →
WhatsApp → select integration → Message Templates tab — five clicks. The sidebar link
reduces this to one click.

**Verify after sync:** Open any workspace sidebar. "Message Templates" item appears
(with a LayoutTemplate icon) between Webhooks and Tools. With 1 WA integration: click
goes to that integration's templates page. With 0 or 2+: click goes to WA channel
settings page. Non-superAdmin users do not see the item.

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
- `isCloud()` → `false` — cloud-only Stripe scoping, manage layout, action-level blocking, expired-trial banner stay hidden (correct); quota *read* for planName is always-on (patch #16); usage metrics display is always-on (patch #24)
- `showEnterpriseItems` → `true` — branding, email templates, help items shown in admin sidebar
- `assertEnterpriseFeatures()` → passes — branding/email template mutations succeed
- `app/admin/(enterprise)/layout.tsx` → passes — enterprise admin pages load
- `app/space/[workspaceId]/(enterprise)/layout.tsx` → passes — workspace enterprise features accessible
