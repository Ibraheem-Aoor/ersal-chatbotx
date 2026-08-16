# Phase 4 Custom Feature Audit

**Branch:** `sync/phase-4-base-ui`
**Compared against:** `origin/staging` (pre-sync source of truth)
**Date:** 2026-08-16
**Method:** Full-path functional trace (UI trigger → handler → action → DB) for each feature, not just file existence

---

## Summary

| # | Feature | Status | Priority |
|---|---------|--------|----------|
| 1 | Create Workspace | ❌ BROKEN (hidden by `isCommunity()`) | BLOCKER |
| 2 | Team Member Invitations | ⚠️ BROKEN (superAdmin toggle disabled) | BLOCKER |
| 3 | Member Roles & Permissions | ❌ BROKEN (superAdmin toggle disabled) | BLOCKER |
| 4 | Billing System | ✅ WORKING (i18n gaps) | IMPORTANT |
| 5 | Admin Panel | ⚠️ BROKEN (sidebar labels) | BLOCKER |
| 6 | Branding | ❌ BROKEN (hidden by enterprise license gate) | BLOCKER |
| 7 | Suspended/Banned Checks | ✅ WORKING | — |
| 8 | WhatsApp Template Creation | ✅ WORKING | — |
| 9 | Notification Badge + Store | ✅ WORKING | — |
| 10 | Locale Restriction | ❌ BROKEN (20 locales shown) | BLOCKER |
| 11 | Translations — Missing Keys | ❌ BROKEN (22 keys missing) | BLOCKER |
| 12 | Other Staging Customizations | ⚠️ See details | mixed |

**BLOCKERS: 7** — Create workspace, invite superAdmin toggle, member superAdmin toggle, admin sidebar labels+branding, locale restriction, missing translation keys
**IMPORTANT: 1** — Billing usage translation keys
**DEFERRABLE: 1** — Member notification preferences reset

---

## Detailed Findings

### 1. Create Workspace

**Status:** ❌ BROKEN — hidden by upstream `isCommunity()` gate

There are **two** places to create a workspace — one is broken, one should work:

| Link | Location | Staging | Current | Status |
|------|----------|---------|---------|--------|
| Workspaces list card | `workspaces-list.tsx:200` | `showCreateCard = true` | `showCreateCard = !isCommunity()` | ❌ BROKEN — card hidden |
| Workspace-switcher dropdown | `workspace-switcher.tsx:117-130` — PlusCircle at bottom of dropdown | unconditional | unconditional | ✅ Code OK (verify in browser) |
| Route | `/channels/create` → `app/(no-sidebar)/channels/create/page.tsx` | exists | exists | ✅ |
| Server action | Channel connect actions create workspace if none exists | same | same | ✅ |

**Root cause:** Upstream changed `workspaces-list.tsx:200` from `const showCreateCard = true` (staging) to `const showCreateCard = !isCommunity()`. Since `NEXT_PUBLIC_EDITION=community` → `isCommunity() === true` → the create workspace card on the home/workspaces page is hidden.

The workspace-switcher dropdown button (PlusCircle at bottom of dropdown) has NO gate and should still work — if it doesn't appear at runtime, it's a Base UI rendering issue, not a gating issue.

**Fix needed:** Change `workspaces-list.tsx:200` from `!isCommunity()` back to `true`.

**Priority:** BLOCKER

---

### 2. Team Member Invitations

**Status:** ⚠️ BROKEN — superAdmin toggle disabled when inviting

| Link | Location | Status |
|------|----------|--------|
| UI Trigger | `workspace-members-table.tsx:280` → `InviteWorkspaceMemberDialog` | ✅ |
| Dialog | `invite-workspace-member.tsx:88-97` — `DialogTrigger render=` | ✅ Correctly converted |
| At-limit gate | `invite-workspace-member.tsx:61-82` — disabled tooltip when at team member limit | ✅ `TooltipTrigger render=` correct |
| SuperAdmin toggle | `invite-workspace-member.tsx:196` | ❌ `disabled={isCommunity()}` — staging had `disabled={false}` |
| Server action | `invite-workspace-member.action.ts` → inserts into `invitationModel` + sends email | ✅ |
| Accept page | `app/(no-sidebar)/invitations/[code]/page.tsx` → `InvitationCard` | ✅ |
| Accept action | `features/invitations/actions/accept-invitation.ts` | ✅ |

**Access path:** Settings → Admins tab → "Invite Member" button

**Root cause:** Upstream added `disabled={isCommunity()}` to the superAdmin toggle in the invite member dialog. Since `NEXT_PUBLIC_EDITION=community`, the toggle is always disabled — you cannot grant superAdmin permission when inviting a new member.

**Fix needed:** Change `invite-workspace-member.tsx:196` from `disabled={isCommunity()}` to `disabled={false}`.

**Priority:** BLOCKER

---

### 3. Member Roles & Permissions

**Status:** ❌ BROKEN — superAdmin toggle disabled by `isCommunity()`

| Link | Location | Status |
|------|----------|--------|
| Members table | `workspace-members-table.tsx` — DropdownMenu with edit/delete | ✅ `render=` correct |
| Update dialog | `update-workspace-member.tsx` — controlled Dialog | ✅ |
| Delete dialog | `delete-workspace-member.tsx` — controlled Dialog | ✅ Identical to staging |
| SuperAdmin toggle | `update-workspace-member.tsx:158` | ❌ `disabled={isCommunity()}` — staging had `disabled={false}` |
| Other permission toggles | `update-workspace-member.tsx:164-213` — analytics, contacts, etc. | ✅ |
| Permission coupling | `use-permissions-coupling.ts` hook | ✅ |
| Server actions | `update-workspace-member.action.ts`, `delete-workspace-member.action.ts` | ✅ |

**Root cause:** Upstream added `disabled={isCommunity()}` to the superAdmin toggle. Since `NEXT_PUBLIC_EDITION=community`, the toggle is always disabled — you cannot change an existing member's superAdmin permission. Staging had `disabled={false}`.

**Additional regression (DEFERRABLE):** `update-workspace-member.tsx:142-143` — Notification type/channel defaults are **commented out** in the form `reset()`:
```typescript
// notificationTypes: workspaceMember.notificationTypes,
// notificationChannels: workspaceMember.notificationChannels,
```
This is an **upstream change**. The notification preference checkboxes still render and submit, but saved preferences won't pre-fill when editing a member.

**Fix needed:**
1. **BLOCKER:** Change `update-workspace-member.tsx:158` from `disabled={isCommunity()}` to `disabled={false}`
2. **DEFERRABLE:** Uncomment lines 142-143 to restore notification preference pre-fill

**Priority:** BLOCKER

---

### 4. Billing System

**Status:** ✅ WORKING (i18n gaps)

| Link | Location | Status |
|------|----------|--------|
| Billing page | `app/space/[workspaceId]/billing/page.tsx` | ✅ |
| Pricing cards | `features/billing/components/pricing-cards.tsx` — subscribe button wired to `handleSubscribe()` | ✅ |
| Checkout route | `app/api/billing/checkout/route.ts` — calls `getPaymentGateway().initiate()` | ✅ |
| All 7 billing API routes | `app/api/billing/*/route.ts` (callback, checkout, expire, remind, renew, retry-charge, save-token) | ✅ Match staging 1:1 |
| Billing pages | checkout, error, success, receipt — all 4 in `app/(no-sidebar)/billing/` | ✅ |
| Pricing page | `app/(no-sidebar)/pricing/page.tsx` | ✅ |
| Moyasar form | `features/billing/components/moyasar-checkout-form.tsx` | ✅ |
| Plan form dialog | `features/billing/components/plan-form-dialog.tsx` — `render=` | ✅ Correctly converted |
| Billing banner | `features/billing/components/billing-banner-server.tsx` — rendered in workspace layout | ✅ |
| Trial auto-provisioning | `lib/auth/on-user-created.ts` — `billingPlanService.findDefault()` + `subscriptionService.createOrUpdate()` | ✅ |
| Nav-user links | `nav-user.tsx:158-188` — conditional manage/subscribe based on subscription status | ✅ |
| Business services | `packages/business/src/billing/` — 9 services (plan, subscription, payment-history, billing-info, renewal, gateways) | ✅ |
| DB schemas | billing-plan, subscription, payment-history, billing-info | ✅ |
| Enterprise upgrade | `enterprise/features/billing/upgrade-plan-dialog.tsx` | ✅ |
| No stale `asChild` | All billing components | ✅ |

**Issue:** Billing usage page references translation keys `billing.usage.flows` and `billing.usage.broadcasts` which are among the 19 missing keys (see §11).

**Fix needed:** Restore the 2 missing billing translation keys (see §11).

**Priority:** IMPORTANT (billing page renders but shows raw key paths for "Flows" / "Broadcasts" labels)

---

### 5. Admin Panel

**Status:** ⚠️ BROKEN (sidebar labels show raw key paths)

| Link | Location | Status |
|------|----------|--------|
| Admin layout guard | `app/admin/layout.tsx` — `isSuperAdmin(user)` enforced | ✅ |
| Admin sidebar | `features/admin/components/admin-sidebar.tsx` | ❌ 3 broken labels |
| Users page | `app/admin/users/page.tsx` + `users/[id]/page.tsx` | ✅ |
| Plans page | `app/admin/plans/page.tsx` — `billingPlanService.list()` + `PlanFormDialog` | ✅ |
| Subscriptions page | `app/admin/subscriptions/page.tsx` — `subscriptionService.listAll()` | ✅ |
| Payment History page | `app/admin/payment-history/page.tsx` — `paymentHistoryService.listAll()` | ✅ |
| Platform Credentials | `app/admin/platform-credentials/page.tsx` | ✅ |
| Platform Channels | `app/admin/platform-channels/page.tsx` | ✅ NEW from upstream |
| Admin actions (4 files) | `features/admin/actions/*.ts` — all use `superAdminActionClient` | ✅ |
| Users table | `features/admin/components/users-table.tsx` — `render=` | ✅ |
| No stale `asChild` | All admin components | ✅ |

**Broken:** The admin sidebar changed translation key references between staging and current:

| Sidebar item | Staging used | Current uses | Key exists? |
|-------------|-------------|-------------|-------------|
| Plans | `t("plans.title")` | `t("platformAdmin.plans.title")` | ❌ MISSING |
| Subscriptions | `t("subscriptions.title")` | `t("platformAdmin.subscriptions.title")` | ❌ MISSING |
| Payment History | `t("billing.manage.paymentHistory")` | `t("platformAdmin.paymentHistory.title")` | ❌ MISSING |

These 3 items will render as raw key paths (e.g., `platformAdmin.plans.title`) instead of translated labels in both English and Arabic.

**Fix needed:** Either:
- **(A)** Add the 3 missing keys to both `en.json` and `ar.json` under `platformAdmin`, OR
- **(B)** Revert the sidebar code to use the old staging keys (`plans.title`, `subscriptions.title`, `billing.manage.paymentHistory`)

Option (B) is simpler and lower risk — only 3 lines in `admin-sidebar.tsx`.

**Priority:** BLOCKER (admin sidebar is broken for 3 of its most important links — users see raw key paths)

---

### 6. Branding

**Status:** ❌ BROKEN — hidden by `showEnterpriseItems` enterprise license gate

| Link | Location | Staging | Current | Status |
|------|----------|---------|---------|--------|
| Admin sidebar link | `admin-sidebar.tsx:64` | `!isCloud()` | `showEnterpriseItems && !isCloud()` | ❌ Gate changed |
| Email templates link | `admin-sidebar.tsx:64-76` | `!isCloud()` | `showEnterpriseItems && !isCloud()` | ❌ Same gate |
| `showEnterpriseItems` prop | `app/admin/layout.tsx:23` | not used | `await hasEnterpriseFeatures()` | ❌ Returns `false` |
| `hasEnterpriseFeatures()` | `packages/business/src/user/entitlements.ts:10-13` | n/a | requires `isCloud() \|\| isEnterprise()` + valid license | ❌ Community = `false` |
| Branding page | `app/admin/(enterprise)/(non-cloud)/branding/page.tsx` | ✅ exists | ✅ exists | ✅ |
| Branding settings | `enterprise/features/platform-branding/platform-branding-settings.tsx` | ✅ | ✅ | ✅ |
| Update action | `update-platform-branding.action.ts` | ✅ | ✅ | ✅ |
| Brand icon | `brand-icon.tsx` — `height={64} width={200} unoptimized` | ✅ | ✅ | ✅ |

**Root cause chain:**
1. `app/admin/layout.tsx:23` — `const showEnterpriseItems = await hasEnterpriseFeatures()` (NEW — staging didn't have this)
2. `hasEnterpriseFeatures()` in `entitlements.ts:11` — returns `false` for community edition (requires `isCloud() || isEnterprise()`, and community is neither)
3. `admin-sidebar.tsx:64` — `showEnterpriseItems && !isCloud()` — since `showEnterpriseItems = false`, branding + email templates links are hidden
4. Staging used `!isCloud()` directly — always `true` for community edition, so branding was visible

**The branding page itself still exists and works** — only the sidebar link is hidden. If you navigate directly to `/admin/branding`, it may still work (unless the `(enterprise)` layout guard also blocks it — see `app/admin/(enterprise)/layout.tsx:9` which has `if (isCommunity()) return notFound()`).

Wait — `app/admin/(enterprise)/layout.tsx:9` has `if (isCommunity())` redirect! This means even direct navigation to `/admin/branding` is blocked for community edition. **Double gate.**

**Fix needed (2 files):**
1. `admin-sidebar.tsx:64` — Change `showEnterpriseItems && !isCloud()` back to `!isCloud()` for branding + email templates
2. `app/admin/(enterprise)/layout.tsx:9` — Remove or relax the `isCommunity()` guard (staging didn't have this file or gate)

**Priority:** BLOCKER

---

### 7. Suspended/Banned User Checks

**Status:** ✅ WORKING

| Enforcement Point | Location | Status |
|-------------------|----------|--------|
| Server actions | `safe-action.ts:63-68` — throws `ChatbotXException("Account suspended", "accountSuspended", 403)` | ✅ Identical to staging |
| Workspace layout | `app/space/[workspaceId]/layout.tsx:55-59` — `redirect("/suspended")` | ✅ Identical to staging |
| oRPC middleware | `middlewares/auth.ts:31-38` — throws `ORPCError("FORBIDDEN")` | ✅ Identical to staging |
| Suspended page | `app/(no-sidebar)/suspended/page.tsx` — renders ban/suspend message with sign-out | ✅ Identical to staging |

**Fix needed:** None

---

### 8. WhatsApp Template Creation

**Status:** ✅ WORKING

| Link | Location | Status |
|------|----------|--------|
| Dialog component | `create-message-template-dialog.tsx:281-305` — Sheet with `SheetTrigger render=` | ✅ Correctly converted |
| Dialog content | `CreateMessageTemplateDialogContent` — form, type selection, preview | ✅ |
| Server action | `create-message-template.action.ts` — `workspaceActionClient.bindArgsSchemas()`, correctly bound | ✅ |
| DB write | Action inserts into `whatsappMessageTemplateModel` | ✅ |
| Toolbar | `message-templates-table-toolbar-actions.tsx` — sync button | ✅ |

**Note:** The action file (`create-message-template.action.ts:4`) directly imports `db` from `@chatbotx.io/database/client` — this is a pre-existing invariant #9 violation, same as staging, NOT a regression.

**Fix needed:** None (the 3 missing `whatsapp.messageTemplate.*` translation keys are covered in §11)

---

### 9. Notification Badge + Store

**Status:** ✅ WORKING

| Link | Location | Status |
|------|----------|--------|
| Notification store | `features/notifications/notification-store.ts` — exports `useUnreadCount`, `notificationStore` | ✅ Identical to staging |
| Sidebar badge | `app-sidebar.tsx:37` imports `useUnreadCount`, line 78 calls it, line 97 passes `badge: unreadCount` | ✅ |
| SidebarMenuBadge | `packages/ui/src/components/sidebar/index.tsx:85-88` — renders badge with destructive color, 99+ cap | ✅ |
| Chat store integration | `chat-store.ts:21` imports, line 313+377 calls `setActiveConversation` | ✅ |
| Chat layout integration | `chat-layout.tsx:20` imports, line 52 calls `clearAll()` on mount | ✅ |
| Workspace layout | `layout.tsx:132` renders `<WorkspaceNotifications workspaceId={workspaceId} />` | ✅ |
| Realtime listener | `workspace-notifications.tsx` — listens for `messageCreated` via PartySocket | ✅ Identical to staging |
| Sound file | `public/sounds/notification.wav` | ✅ |

**Fix needed:** None

---

### 10. Locale Restriction

**Status:** ❌ BROKEN

**Root cause:** Staging had `locales = ["ar", "en", "vi"]` in `i18n/config.ts`. During the Phase 4 i18n merge, the array was expanded to upstream's 20 locales. The language selector (`lang-selector.tsx:25`) iterates over all `locales`, so all 20 now appear to users.

| Item | Staging | Current |
|------|---------|---------|
| `locales` array | `["ar", "en", "vi"]` | 20 locales (ar, da, de, en, es, fi, fr, he, id, it, ja, nl, pt-BR, pt-PT, ro, sv, tr, vi, zh-CN, zh-TW) |
| `defaultLocale` | `"ar"` | `"ar"` ✅ |
| `localeMeta` | 3 entries | 20 entries |
| Lang selector shows | 3 languages | 20 languages |
| Locale JSON files | `ar.json`, `en.json` | 20 files |

**Fix needed (two options):**

- **Option A (simple):** Change `locales` array in `config.ts` to `["ar", "en"]` and `localeMeta` to only those two entries. Quick but loses upstream's locale infrastructure.
- **Option B (recommended):** Add an `enabledLocales` subset (e.g. `["ar", "en"]`) alongside the full `locales` array. Filter in `lang-selector.tsx`: `const items = enabledLocales.map(...)`. Keeps upstream infrastructure intact so other deployments can enable more locales by editing one line, and avoids type errors from the 18 locale JSON files that still exist on disk.

**Additional note:** Staging's `lang-selector.tsx` was a simple `<Select>` with hardcoded `<SelectItem value="ar">` and `<SelectItem value="en">`. The current version was rewritten by upstream to use a `Popover/Command` that dynamically iterates `locales.map(...)` — this is why all 20 now appear.

**Decision needed:** Keep Vietnamese (`vi`) or drop it? Staging had it; the user said "only ar and en."

**Priority:** BLOCKER (users see 20 languages they can't use — switching to one with untranslated keys causes broken UI)

---

### 11. Translations — Missing Keys

**Status:** ❌ BROKEN (22 total missing keys)

#### 11a. Missing from `en.json` (19 keys — were in staging, lost during merge)

| Namespace | Key | Value |
|-----------|-----|-------|
| billing | `billing.usage.flows` | `"Flows"` |
| billing | `billing.usage.broadcasts` | `"Broadcasts"` |
| billing | `billing.pastDue.gracePeriod` | `"You have {days} days to update your payment before your subscription is suspended."` |
| fields | `fields.authType.none` | `"None"` |
| fields | `fields.language.arabic` | `"العربية"` |
| fields | `fields.language.english` | `"English"` |
| fields | `fields.language.vietnamese` | `"Tiếng Việt"` |
| flows | `flows.openaiCompatible.none` | `"None"` |
| platformSettings | `platformSettings.errors.googleClientSecretRequired` | `"Client Secret is required to configure Google."` |
| platformSettings | `platformSettings.errors.googleVerifyTokenRequired` | `"Verify Token is required to configure Google."` |
| platformSettings | `platformSettings.errors.messengerAppSecretRequired` | `"App Secret is required to configure Messenger."` |
| platformSettings | `platformSettings.errors.zaloAppSecretRequired` | `"App Secret is required to configure Zalo."` |
| platformSettings | `platformSettings.errors.stripeSecretKeyRequired` | `"Secret Key is required to configure Stripe."` |
| platformSettings | `platformSettings.errors.whatsappAppSecretRequired` | `"App Secret is required to configure WhatsApp."` |
| platformSettings | `platformSettings.errors.whatsappSystemUserTokenRequired` | `"System User Token is required to configure WhatsApp."` |
| platformSettings | `platformSettings.errors.tiktokAppSecretRequired` | `"App Secret is required to configure TikTok."` |
| whatsapp | `whatsapp.messageTemplate.createTitle` | `"Create Message Template"` |
| whatsapp | `whatsapp.messageTemplate.label` | `"Message Template"` |
| whatsapp | `whatsapp.messageTemplate.nameHint` | `"Lowercase letters, numbers and underscores only (e.g. order_update)"` |

#### 11b. Admin sidebar keys — wrong key paths (3 keys)

The admin sidebar code was changed to reference non-existent keys:

| Sidebar item | Code uses | Should use (staging) | en value | ar value |
|-------------|-----------|---------------------|----------|----------|
| Plans | `platformAdmin.plans.title` | `plans.title` | `"Plans Management"` | `"إدارة الباقات"` |
| Subscriptions | `platformAdmin.subscriptions.title` | `subscriptions.title` | `"Subscriptions"` | `"الاشتراكات"` |
| Payment History | `platformAdmin.paymentHistory.title` | `billing.manage.paymentHistory` | *(exists)* | `"سجل المدفوعات"` |

#### 11c. Arabic translations (`ar.json`)

**0 keys missing**, but **1 key overwritten** with English fallback:

| Key | Staging (Arabic) | Current (English fallback) |
|-----|-----------------|---------------------------|
| `fields.wabaId.label` | `"معرّف WABA"` | `"WABA ID"` |

The 3 admin sidebar keys are a code issue, not a translation file issue.

**Fix needed:**
1. Add the 19 missing keys to `en.json` (copy values from staging)
2. Revert 3 lines in `admin-sidebar.tsx` to use the old key paths (or add the 3 new keys to both `en.json` and `ar.json`)

**Priority:** BLOCKER

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
| ~~`isCommunity()` added to superAdmin toggle~~ | **PROMOTED TO BLOCKER** — see §2, §3 |
| ~~Create workspace card gated by `!isCommunity()`~~ | **PROMOTED TO BLOCKER** — see §1 |
| ~~Branding gated by `showEnterpriseItems`~~ | **PROMOTED TO BLOCKER** — see §6 |

---

## Action Items

### BLOCKER — Fix before testing

| # | Issue | Fix | Files to change |
|---|-------|-----|-----------------|
| B1 | Create workspace card hidden | Change `showCreateCard = !isCommunity()` → `showCreateCard = true` | `apps/builder/src/features/workspaces/components/workspaces-list.tsx:200` |
| B2 | SuperAdmin toggle disabled (update member) | Change `disabled={isCommunity()}` → `disabled={false}` | `apps/builder/src/features/workspace-members/components/update-workspace-member.tsx:158` |
| B3 | SuperAdmin toggle disabled (invite member) | Change `disabled={isCommunity()}` → `disabled={false}` | `apps/builder/src/features/workspace-members/components/invite-workspace-member.tsx:196` |
| B4 | Branding/email-templates hidden from admin sidebar | Change `showEnterpriseItems && !isCloud()` → `!isCloud()` for branding+email items | `apps/builder/src/features/admin/components/admin-sidebar.tsx:64` |
| B5 | Enterprise admin pages blocked for community | Remove `hasEnterpriseFeatures()` guard (staging was a pass-through) | `apps/builder/src/app/admin/(enterprise)/layout.tsx:9` |
| B6 | Locale restriction — 20 locales shown | Restrict `locales` array to `["ar", "en"]` in `i18n/config.ts`, trim `localeMeta` | `apps/builder/src/i18n/config.ts` |
| B7 | Admin sidebar — 3 labels show raw keys | Revert lines 88, 93, 98 in `admin-sidebar.tsx` to use staging key paths | `apps/builder/src/features/admin/components/admin-sidebar.tsx` |
| B8 | 19 missing translation keys | Add missing keys from staging to `en.json` | `apps/builder/messages/en.json` |
| B9 | 1 overwritten Arabic key (`fields.wabaId.label`) | Restore `"معرّف WABA"` | `apps/builder/messages/ar.json` |

### IMPORTANT — Fix before deploy

| # | Issue | Fix | Files to change |
|---|-------|-----|-----------------|
| I1 | Billing usage labels (`billing.usage.flows`, `billing.usage.broadcasts`) | Included in B8 above | `apps/builder/messages/en.json` |

### DEFERRABLE — Fix after Phase 6

| # | Issue | Fix | Files to change |
|---|-------|-----|-----------------|
| D1 | Member notification preferences not pre-filled | Uncomment lines 142-143 in `update-workspace-member.tsx` | `apps/builder/src/features/workspace-members/components/update-workspace-member.tsx` |

---

## Edition-Gating Analysis

Upstream introduced several `isCommunity()` and `hasEnterpriseFeatures()` gates that break features we had working on staging (community edition). Full scan of all `isCommunity()` and `showEnterpriseItems` usage in `apps/builder/src`:

### Gates that MUST be reverted (broke our features)

| File | Line | Current gate | Staging value | Effect |
|------|------|-------------|---------------|--------|
| `workspaces-list.tsx` | 200 | `!isCommunity()` | `true` | Hides create workspace card |
| `update-workspace-member.tsx` | 158 | `disabled={isCommunity()}` | `disabled={false}` | Disables superAdmin toggle |
| `invite-workspace-member.tsx` | 196 | `disabled={isCommunity()}` | `disabled={false}` | Disables superAdmin toggle |
| `admin-sidebar.tsx` | 64 | `showEnterpriseItems && !isCloud()` | `!isCloud()` | Hides branding + email templates |
| `admin/(enterprise)/layout.tsx` | 9 | `hasEnterpriseFeatures()` guard | pass-through | Blocks `/admin/branding`, `/admin/email-templates` |

### Gates that are OK (expected upstream behavior)

| File | Line | Gate | Why OK |
|------|------|------|--------|
| `webchat/page.tsx` | 143 | `isCommunity()` | Webchat config subset — acceptable upstream behavior |
| `(enterprise)/layout.tsx` (workspace zone) | 9 | `isCommunity()` | Upstream enterprise features we don't use yet |
| `sign-up.tsx` | 46 | `!isCommunity()` | OAuth providers hidden — we don't have OAuth configured |
| `sign-in.tsx` | 71 | `!isCommunity()` | OAuth providers hidden — same as above |
| `persistent-menu-field.tsx` | 229 | `!isCommunity()` | Webchat menu option — acceptable |
| `admin-sidebar.tsx` | 78 | `showEnterpriseItems` | Help items — new upstream feature, not a regression |

---

## Verification Checklist (after fixes applied)

- [ ] Create workspace card visible on workspaces list page
- [ ] Create workspace button visible in workspace switcher dropdown
- [ ] SuperAdmin toggle enabled when editing a member
- [ ] SuperAdmin toggle enabled when inviting a member
- [ ] Admin sidebar → Branding link visible
- [ ] Admin sidebar → Email Templates link visible
- [ ] `/admin/branding` page loads (not 404)
- [ ] Language selector shows only Arabic + English (2 options)
- [ ] Admin sidebar → Plans, Subscriptions, Payment History show translated labels
- [ ] Billing page → "Flows" and "Broadcasts" labels render (not raw keys)
- [ ] WhatsApp template dialog → "Create Message Template" title renders
- [ ] Platform Settings → validation error messages render for all channels
- [ ] Invite member dialog opens from Settings → Admins
- [ ] Billing checkout flow completes (Moyasar)
- [ ] Admin panel → all 7 pages load with correct content
- [ ] Notification badge appears on inbox when messages arrive
- [ ] Suspended user is redirected to /suspended page
