# Phase 4 Custom Feature Audit

**Branch:** `sync/phase-4-base-ui`
**Compared against:** `origin/staging` (pre-sync source of truth)
**Date:** 2026-08-16
**Method:** Full-path functional trace (UI trigger → handler → action → DB) for each feature, not just file existence

---

## Summary

| # | Feature | Status | Resolution |
|---|---------|--------|------------|
| 1 | Create Workspace | ✅ FIXED | Edition approach (`NEXT_PUBLIC_EDITION=enterprise`) |
| 2 | Team Member Invitations | ✅ FIXED | Edition approach |
| 3 | Member Roles & Permissions | ✅ FIXED | Edition approach |
| 4 | Billing System | ✅ FIXED | Data patch — restored translation keys |
| 5 | Admin Panel | ✅ FIXED | Data patch — reverted sidebar key paths |
| 6 | Branding | ✅ FIXED | Edition approach + entitlement bypass |
| 7 | Suspended/Banned Checks | ✅ WORKING | No changes needed |
| 8 | WhatsApp Template Creation | ✅ WORKING | No changes needed |
| 9 | Notification Badge + Store | ✅ WORKING | No changes needed |
| 10 | Locale Restriction | ✅ FIXED | Data patch — `enabledLocales: ["ar", "en"]` |
| 11 | Translations — Missing Keys | ✅ FIXED | Data patch — restored 20 en.json keys + 1 ar.json key |
| 12 | Other Staging Customizations | ⚠️ See details | mixed |

**ALL BLOCKERS RESOLVED** via two approaches:
- **Edition approach** (B1–B5): Set `NEXT_PUBLIC_EDITION=enterprise` + bypass license check in `hasEnterpriseFeatures()`. All upstream `isCommunity()` / `showEnterpriseItems` gates pass without per-file patches. See `FORK-PATCHES.md`.
- **Data patches** (B6–B9): Translation keys, locale filtering, sidebar key paths. Applied directly, documented in `FORK-PATCHES.md`.

**DEFERRABLE: 1** — Member notification preferences reset (upstream intentional change)

---

## How the Edition Approach Works

Instead of patching 5 files to override upstream gates, we run as `enterprise` edition:

```
NEXT_PUBLIC_EDITION=enterprise    # in .env (both staging and production)
```

This makes `isCommunity()` return `false` and `isEnterprise()` return `true`, so all upstream gates open naturally. The only code change is in `packages/business/src/user/entitlements.ts` where `hasEnterpriseFeatures()` returns `true` for enterprise edition without checking for a license key.

**Why this is better than per-file patches:**
- 1 code divergence vs 5 scattered file edits
- Future upstream `isCommunity()` gates won't break our features
- All `assertEnterpriseFeatures()` call sites pass (branding, email templates, audit logs)
- Upstream code runs completely unchanged — zero merge conflicts on gated files

**Full documentation:** `FORK-PATCHES.md` at repo root.

---

## Detailed Findings

### 1. Create Workspace

**Status:** ✅ FIXED via edition approach

| Link | Location | Gate | With `enterprise` edition |
|------|----------|------|---------------------------|
| Workspaces list card | `workspaces-list.tsx:200` | `showCreateCard = !isCommunity()` | `!false` → `true` ✅ |
| Workspace-switcher dropdown | `workspace-switcher.tsx:117-130` | unconditional | ✅ |
| Route | `/channels/create` | none | ✅ |
| Server action | Channel connect actions | none | ✅ |

**Original issue:** Upstream changed `showCreateCard = true` (staging) to `showCreateCard = !isCommunity()`. With community edition this hid the create workspace card.

**Resolution:** `NEXT_PUBLIC_EDITION=enterprise` → `isCommunity()` returns `false` → `showCreateCard = true`. No code change needed.

---

### 2. Team Member Invitations

**Status:** ✅ FIXED via edition approach

| Link | Location | Gate | With `enterprise` edition |
|------|----------|------|---------------------------|
| UI Trigger | `workspace-members-table.tsx:280` | none | ✅ |
| Dialog | `invite-workspace-member.tsx:88-97` | none | ✅ |
| SuperAdmin toggle | `invite-workspace-member.tsx:196` | `disabled={isCommunity()}` | `disabled={false}` ✅ |
| Server action | `invite-workspace-member.action.ts` | none | ✅ |
| Accept flow | `invitations/[code]/page.tsx` → `accept-invitation.ts` | none | ✅ |

**Original issue:** Upstream added `disabled={isCommunity()}` to the superAdmin toggle.

**Resolution:** `isCommunity()` returns `false` → toggle enabled. Upstream code unchanged.

---

### 3. Member Roles & Permissions

**Status:** ✅ FIXED via edition approach

| Link | Location | Gate | With `enterprise` edition |
|------|----------|------|---------------------------|
| SuperAdmin toggle | `update-workspace-member.tsx:158` | `disabled={isCommunity()}` | `disabled={false}` ✅ |
| Other toggles | `update-workspace-member.tsx:164-213` | none | ✅ |
| Delete dialog | `delete-workspace-member.tsx` | none | ✅ |
| Server actions | `update/delete-workspace-member.action.ts` | none | ✅ |

**Original issue:** Same as §2 — `disabled={isCommunity()}` on superAdmin toggle.

**Resolution:** `isCommunity()` returns `false` → toggle enabled. Upstream code unchanged.

**Remaining regression (DEFERRABLE):** `update-workspace-member.tsx:142-143` — Notification type/channel defaults are commented out in the form `reset()`. This is an upstream change; saved preferences won't pre-fill when editing a member. Form still submits correctly.

---

### 4. Billing System

**Status:** ✅ FIXED (translation keys restored)

All billing routes, components, services, and schemas are intact and match staging. The only issue was missing translation keys for `billing.usage.flows` and `billing.usage.broadcasts` — now restored in `en.json` (data patch B8).

Full chain verified: pricing cards → checkout route → Moyasar form → callback → subscription creation → billing banner → nav-user links. All 47 billing files present. No stale `asChild`.

---

### 5. Admin Panel

**Status:** ✅ FIXED (sidebar key paths reverted)

| Link | Location | Status |
|------|----------|--------|
| Admin layout guard | `app/admin/layout.tsx` — `isSuperAdmin(user)` | ✅ |
| Admin sidebar | `admin-sidebar.tsx` | ✅ Key paths fixed (data patch B7) |
| Users page | `app/admin/users/page.tsx` + `users/[id]/page.tsx` | ✅ |
| Plans page | `app/admin/plans/page.tsx` | ✅ |
| Subscriptions page | `app/admin/subscriptions/page.tsx` | ✅ |
| Payment History page | `app/admin/payment-history/page.tsx` | ✅ |
| Platform Credentials | `app/admin/platform-credentials/page.tsx` | ✅ |
| Platform Channels | `app/admin/platform-channels/page.tsx` | ✅ NEW from upstream |

**Original issue:** Upstream renamed translation keys to `platformAdmin.plans.title` etc., but those keys don't exist in our files.

**Resolution:** Reverted 3 lines in `admin-sidebar.tsx` to use staging key paths (`plans.title`, `subscriptions.title`, `billing.manage.paymentHistory`). This is a data patch (B7) that may need re-applying if upstream modifies the same file.

---

### 6. Branding

**Status:** ✅ FIXED via edition approach + entitlement bypass

| Link | Location | Gate | With `enterprise` edition |
|------|----------|------|---------------------------|
| Admin sidebar link | `admin-sidebar.tsx:64` | `showEnterpriseItems && !isCloud()` | `true && true` → shows ✅ |
| Email templates link | `admin-sidebar.tsx:64-76` | same | shows ✅ |
| `showEnterpriseItems` | `app/admin/layout.tsx:23` | `hasEnterpriseFeatures()` | returns `true` ✅ |
| Enterprise layout guard | `app/admin/(enterprise)/layout.tsx:9` | `hasEnterpriseFeatures()` | passes ✅ |
| Branding page | `app/admin/(enterprise)/(non-cloud)/branding/page.tsx` | none | ✅ |
| Update action | `update-platform-branding.action.ts:35` | `assertEnterpriseFeatures()` | passes ✅ |
| Brand icon | `brand-icon.tsx` — `height={64} width={200} unoptimized` | none | ✅ |

**Original issue chain:**
1. `hasEnterpriseFeatures()` returned `false` for community edition (requires license)
2. `showEnterpriseItems = false` → sidebar links hidden
3. `(enterprise)` layout guard → branding page 404'd

**Resolution:** `hasEnterpriseFeatures()` now returns `true` for enterprise edition (entitlement bypass in `entitlements.ts`). All gates pass. Upstream code unchanged except the entitlement function.

---

### 7. Suspended/Banned User Checks

**Status:** ✅ WORKING — no changes needed

All 4 enforcement points identical to staging:
- `safe-action.ts:63-68` — server action guard
- `app/space/[workspaceId]/layout.tsx:55-59` — workspace layout redirect
- `middlewares/auth.ts:31-38` — oRPC middleware
- `app/(no-sidebar)/suspended/page.tsx` — suspended page

---

### 8. WhatsApp Template Creation

**Status:** ✅ WORKING — no changes needed

Dialog, form, server action, DB write all intact. `asChild` → `render=` correctly converted. 3 missing translation keys (`whatsapp.messageTemplate.*`) restored in data patch B8.

**Note:** `create-message-template.action.ts:4` directly imports `db` — pre-existing invariant #9 violation, same as staging.

---

### 9. Notification Badge + Store

**Status:** ✅ WORKING — no changes needed

Full chain intact: `notification-store.ts` → `app-sidebar.tsx` badge → `chat-store.ts` integration → `workspace-notifications.tsx` realtime listener → `notification.wav` sound file.

---

### 10. Locale Restriction

**Status:** ✅ FIXED (data patch B6)

**Resolution:** Added `enabledLocales: Locale[] = ["ar", "en"]` to `i18n/config.ts`. Language selector (`lang-selector.tsx`) now iterates `enabledLocales` instead of the full 20-locale `locales` array. The full array, `localeMeta`, and all JSON files are preserved for upstream compatibility — only the UI selector is filtered.

To enable additional languages later, add entries to `enabledLocales` in `config.ts`.

---

### 11. Translations — Missing Keys

**Status:** ✅ FIXED (data patches B8 + B9)

**B8 — `en.json`:** Restored 20 missing keys across `billing.usage`, `billing.pastDue`, `fields.authType`, `fields.language`, `flows.openaiCompatible`, `platformSettings.errors`, and `whatsapp.messageTemplate` namespaces.

**B9 — `ar.json`:** Restored `fields.wabaId.label` from `"WABA ID"` (English) to `"معرّف WABA"` (Arabic). Verified byte-exact match on disk.

---

### 12. Other Staging Customizations

#### 12a. Files on staging but missing from current

| File | Status | Notes |
|------|--------|-------|
| `apps/builder/src/features/contact/filter-contact.ts` | Intentionally removed | Replaced by upstream's condition step (`c7f8e4373`) |

No other custom files are missing. All 47 billing files, 10 admin files, notification files, and WhatsApp template files are present.

#### 12b. Upstream-adopted changes (no action needed)

| Our custom change | Upstream status |
|-------------------|-----------------|
| Tiptap `isSettingContent` guard | ✅ Upstream adopted our fix |
| Instagram `ig_exchange_token` / `ig_refresh_token` fix | ✅ Upstream adopted our fix |
| WhatsApp CTA URL buttons (`cta_url` handler) | ✅ Preserved |
| Docker Node pin `24.18.0-bookworm-slim` | ✅ Preserved |

#### 12c. Upstream changes with minor impact

| Change | Impact |
|--------|--------|
| `update-workspace-member.tsx` — notification preferences reset commented out | DEFERRABLE — upstream change, form still submits correctly |
| `workspace-switcher.tsx` — `ChevronsUpDown` → `ChevronDown` icon | Cosmetic — upstream change |
| `channels/create/page.tsx` — Messenger OAuth import removed, tenant resolution changed | Upstream architecture change — needs runtime verification |

---

## Edition-Gating Analysis

### Approach: `NEXT_PUBLIC_EDITION=enterprise` + entitlement bypass

Instead of reverting 5 upstream gates individually, we set the edition to `enterprise` and bypass the license check. This is a **single-point divergence** in `packages/business/src/user/entitlements.ts`.

### How each gate resolves

| File | Gate | With `enterprise` edition | Status |
|------|------|---------------------------|--------|
| `workspaces-list.tsx:200` | `!isCommunity()` | `!false` → `true` | ✅ Card visible |
| `update-workspace-member.tsx:158` | `disabled={isCommunity()}` | `disabled={false}` | ✅ Toggle enabled |
| `invite-workspace-member.tsx:196` | `disabled={isCommunity()}` | `disabled={false}` | ✅ Toggle enabled |
| `admin-sidebar.tsx:64` | `showEnterpriseItems && !isCloud()` | `true && true` | ✅ Branding visible |
| `admin/(enterprise)/layout.tsx:9` | `hasEnterpriseFeatures()` | `true` | ✅ Pages load |
| `sign-up.tsx:46` | `!isCommunity()` | `true` | ✅ OAuth shown (no providers configured — harmless) |
| `sign-in.tsx:71` | `!isCommunity()` | `true` | ✅ Same as above |
| `webchat/page.tsx:143` | `isCommunity()` | `false` | ✅ Full webchat config |
| `persistent-menu-field.tsx:229` | `!isCommunity()` | `true` | ✅ Full menu options |

### `isCloud()` gates — confirmed all correct for us

Nothing we use requires `isCloud()` to return `true`. All `isCloud()` call sites gate cloud-only behavior (Stripe scoping, manage layout, platform credentials, quota enforcement, bootstrap plan) — correct for self-hosted.

### `assertEnterpriseFeatures()` call sites — all pass

| Call site | Feature | Effect |
|-----------|---------|--------|
| `update-platform-branding.action.ts:35,47` | Branding mutations | ✅ Passes |
| `update-email-template.action.ts:50,62` | Email template mutations | ✅ Passes |
| `preview-email-template.action.ts:23` | Email template preview | ✅ Passes |
| `audit-logs/queries/index.ts:18` | Audit log queries | ✅ Passes |

---

## Applied Fixes

### Fork patches (survive upstream syncs — 1 code file)

| # | What | File | Survives sync? |
|---|------|------|----------------|
| F1 | `.env`: `NEXT_PUBLIC_EDITION=enterprise` | `.env` (not committed) | ✅ Always — env is gitignored |
| F2 | `hasEnterpriseFeatures()` bypasses license for enterprise | `packages/business/src/user/entitlements.ts` | ⚠️ Re-apply if upstream modifies this file |

### Data patches (may need re-applying if upstream touches same files)

| # | What | File | Applied |
|---|------|------|---------|
| D1 | `enabledLocales: ["ar", "en"]` | `apps/builder/src/i18n/config.ts` | ✅ `2da04ee8b` |
| D2 | Lang selector uses `enabledLocales` | `apps/builder/src/components/lang-selector.tsx` | ✅ `2da04ee8b` |
| D3 | Sidebar uses staging translation key paths | `apps/builder/src/features/admin/components/admin-sidebar.tsx` | ✅ `2da04ee8b` |
| D4 | 20 restored translation keys | `apps/builder/messages/en.json` | ✅ `2da04ee8b` |
| D5 | `fields.wabaId.label` = `"معرّف WABA"` | `apps/builder/messages/ar.json` | ✅ `2da04ee8b` |

### DEFERRABLE

| # | Issue | Fix | File |
|---|-------|-----|------|
| D1 | Member notification preferences not pre-filled | Uncomment lines 142-143 | `update-workspace-member.tsx` |

---

## Verification Checklist

### Prerequisites
- [ ] `.env` has `NEXT_PUBLIC_EDITION=enterprise` (both staging and production)

### Edition-gated features (resolved by enterprise edition)
- [ ] Create workspace card visible on workspaces list page
- [ ] Create workspace button visible in workspace switcher dropdown
- [ ] SuperAdmin toggle enabled when editing a member
- [ ] SuperAdmin toggle enabled when inviting a member
- [ ] Admin sidebar → Branding link visible
- [ ] Admin sidebar → Email Templates link visible
- [ ] `/admin/branding` page loads (not 404)
- [ ] Branding update saves successfully

### Data-patched features
- [ ] Language selector shows only Arabic + English (2 options)
- [ ] Admin sidebar → Plans, Subscriptions, Payment History show translated labels
- [ ] Billing page → "Flows" and "Broadcasts" labels render (not raw keys)
- [ ] WhatsApp template dialog → "Create Message Template" title renders
- [ ] Platform Settings → validation error messages render for all channels
- [ ] `fields.wabaId.label` shows `"معرّف WABA"` in Arabic locale

### Unaffected features (should still work)
- [ ] Billing checkout flow completes (Moyasar)
- [ ] Admin panel → all pages load with correct content
- [ ] Notification badge appears on inbox when messages arrive
- [ ] Suspended user is redirected to /suspended page
- [ ] Invite member dialog opens from Settings → Admins
