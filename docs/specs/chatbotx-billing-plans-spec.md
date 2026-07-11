# Billing & Plans Module — ChatbotX Self-Hosted

## Overview

Enable the billing system so merchants can subscribe to plans, pay via MyFatoorah, and have their quotas enforced automatically. This replaces the private billing portal that ChatbotX Cloud uses.

---

## What Already Exists (don't rebuild)

- `Plan` table — name, price, limits, currency
- `Subscription` table — status, period, billing interval
- `UserQuota` table — all limit/used counters
- Quota enforcement services — `quotaEnforcementService`, `userQuotaService`
- Usage display UI — sidebar shows usage meters
- Upgrade dialog component — `UpgradePlanButton`
- Trial expired page

## What We Need to Build

### 1. Admin Plan Management (`/manage/plans`)

**Route:** `/manage/plans` (platform admin only)

**UI:** Table listing all plans with Create/Edit/Delete actions.

**Plan fields:**
```
name           → "أساسي" / "احترافي" / "أعمال"
description    → Plan description (ar/en)
price          → Monthly price in SAR (stored as decimal, e.g. 99.00)
currency       → "SAR"
billingCycle   → "monthly" / "annual"
annualPrice    → Annual price in SAR (optional, for discount)
limits         → JSON:
  {
    "contacts": 2000,
    "mac": 500,
    "workspaces": 1,
    "channels": 2,
    "teamMembers": 3,
    "flows": 10,
    "broadcasts": true,
    "aiAgents": false,
    "removeBranding": false
  }
features       → Array of marketing feature strings for pricing page
isActive       → boolean (hide/show plan)
sortOrder      → integer (display order)
```

**Implementation:**
- New page component at `apps/builder/src/app/manage/plans/page.tsx`
- CRUD actions in `apps/builder/src/features/plans/actions/`
- Insert/update Plan table directly
- Remove `organizationId` requirement (that's for multi-tenant Cloud)

---

### 2. Pricing Page for Users

**Route:** `/pricing` or `/space/[workspaceId]/pricing`

**UI:** Card grid showing all active plans with:
- Plan name and price (SAR/month)
- Feature list with checkmarks
- "اشترك الآن" (Subscribe) button
- Current plan highlighted
- Annual toggle showing discounted price

**Implementation:**
- Unlock the existing `(enterprise)/pricing/page.tsx` OR create new page outside enterprise group
- Replace hardcoded `samplePlans` with real data from Plan table
- "Subscribe" button redirects to MyFatoorah payment page
- After payment → create Subscription + set UserQuota

---

### 3. MyFatoorah Payment Integration

**Replace Stripe with MyFatoorah.** Same pattern as Campaign Tool payment spec.

**Flow:**
```
User clicks "Subscribe" on plan card
    → MyFatoorah payment page opens (card/mada/STC Pay/Apple Pay/KNET)
    → User pays
    → MyFatoorah redirects to callback URL with payment ID
    → Callback verifies payment via MyFatoorah API
    → On success:
        → Create/update Subscription record
        → Set UserQuota limits from Plan.limits
        → Redirect to workspace with success message
```

**Files needed:**
```
apps/builder/src/lib/myfatoorah.ts              → MyFatoorah client (verify, refund)
apps/builder/src/app/api/billing/
  ├── checkout/route.ts                       → Initiate payment (returns form config)
  ├── callback/route.ts                       → MyFatoorah redirect callback (verify + activate)
  └── webhook/route.ts                        → MyFatoorah webhook (status updates)
apps/builder/src/features/billing/
  ├── actions/subscribe.action.ts             → Create subscription after payment
  ├── actions/cancel.action.ts                → Cancel subscription
  ├── components/payment-redirect.tsx              → Payment redirect handler
  ├── components/pricing-cards.tsx             → Plan cards grid
  └── components/subscription-status.tsx       → Current plan display
```

**MyFatoorah config:**
```env
MYFATOORAH_API_KEY=your-api-key-here
MYFATOORAH_API_URL=https://apitest.myfatoorah.com
```

**Payment verification:**
```typescript
// MyFatoorah callback
const response = await fetch(`${apiUrl}/v2/GetPaymentStatus`, {
  headers: {
    Authorization: `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
  }
})
const payment = await response.json()

if (payment.status === 'paid') {
  // Activate subscription
  // Set quotas
}
```

---

### 4. Subscription Lifecycle

**States:**
```
trialing    → Free trial period (optional)
active      → Paid and current
past_due    → Payment failed, grace period
cancelled   → User cancelled, access until period end
expired     → Period ended, no renewal
```

**On subscribe:**
```typescript
// 1. Create Subscription
await db.insert(subscriptionModel).values({
  plan: plan.name,
  status: 'active',
  periodStart: now(),
  periodEnd: addMonths(now(), 1),
  billingInterval: 'monthly',
})

// 2. Set UserQuota from plan limits
await db.update(userQuotaModel).set({
  contactsLimit: plan.limits.contacts,
  macLimit: plan.limits.mac,
  workspacesLimit: plan.limits.workspaces,
  channelsLimit: plan.limits.channels,
  teamMembersLimit: plan.limits.teamMembers,
  planName: plan.name,
  planStatus: 'active',
}).where(eq(userQuotaModel.userId, userId))
```

**On cancel:**
- Set `cancelAtPeriodEnd = true`
- User keeps access until `periodEnd`
- After `periodEnd` → downgrade to free tier limits

**Renewal (cron job):**
- Daily check: find subscriptions where `periodEnd < now()` and `status = active`
- MyFatoorah does not support auto-recurring
- Send WhatsApp reminder 3 days before expiry with payment link
- If no payment after periodEnd: downgrade to free tier

---

### 5. Enable Quota Enforcement

**Remove `isCloud()` guards** so limits actually apply on self-hosted.

**Files to change:**
```
apps/builder/src/app/space/[workspaceId]/layout.tsx
  → Remove isCloud() check around quota loading
  → Always load quota and enforce trial/plan status

packages/business/src/user-quota/service.ts
  → getForUser() currently returns null for non-cloud
  → Change to always return quota data

packages/business/src/quota-enforcement/service.ts
  → Enable tryConsume() and hasReachedLimit() for all editions

apps/builder/src/features/workspace-members/actions/invite-workspace-member.action.ts
  → Enable team member limit check

apps/worker/src/integration/handlers/received-message.ts
  → Enable contact/MAC limit check

packages/business/src/workspace/service.ts
  → Enable workspace limit check

packages/business/src/inbox/service.ts
  → Enable channel limit check
```

**Important:** Before enabling enforcement, ALL existing users must have a UserQuota row with appropriate limits. Otherwise they'll be blocked from everything.

**Migration step:**
```sql
-- Give all existing users a default free plan quota
INSERT INTO "UserQuota" (id, "createdAt", "updatedAt", "userId", 
  "contactsLimit", "contactsUsed", "macLimit", "macUsed",
  "workspacesLimit", "workspacesUsed", "channelsLimit", "channelsUsed", 
  "teamMembersLimit", "teamMembersUsed", "planName", "planStatus",
  "whiteLabel", "ssoSaml", "saasMode")
SELECT 
  NEXTVAL('user_quota_id_seq'), NOW(), NOW(), u.id,
  500, 0, 100, 0,  -- free tier limits
  1, 0, 1, 0,
  1, 0, 'free', 'active',
  false, false, false
FROM "User" u
WHERE NOT EXISTS (SELECT 1 FROM "UserQuota" q WHERE q."userId" = u.id);
```

---

### 6. Free Tier (Default for new signups)

Every new user gets a free plan automatically:
```
Contacts:     500
MAC:          100
Workspaces:   1
Channels:     1
Team Members: 1
Flows:        3
Broadcasts:   No
AI Agents:    No
Branding:     Can't remove
```

This is set in the signup flow — when a new user registers, create their UserQuota with free tier limits.

---

### 7. Plan Upgrade/Downgrade

**Upgrade:**
- User selects higher plan → pays full price of new plan
- Immediately apply new higher limits from the new plan
- Old subscription period resets (new 30-day cycle starts)
- Previous remaining period is NOT prorated/refunded (keeps it simple)

**Downgrade:**
- User selects lower plan
- Apply at end of current billing period (user keeps current limits until period ends)
- When period ends:
  - New plan limits applied to UserQuota
  - If current usage exceeds new plan limits:
    - Existing data preserved (don't delete contacts/channels)
    - Block new creation until user is within limits
    - Show warning: "أنت تتجاوز حدود خطتك الحالية. لن تتمكن من إضافة جهات اتصال جديدة حتى تقل عن الحد المسموح أو تقوم بالترقية."
    - Example: user has 5,000 contacts, downgrades to plan with 2,000 limit → keeps all 5,000 but can't add new ones

**Limit enforcement rules:**
- Limits are ALWAYS applied according to the user's active plan
- When plan changes, UserQuota limits update to match the new plan exactly
- Enforcement happens at creation time (create contact, create channel, invite member, create workspace)
- Never delete existing data when downgrading — only block new creation
- Free tier users who never subscribed get default free limits on signup

---

## Implementation Phases

### Phase 1: Admin Plan CRUD + Pricing Page (3-4 days)
- Create `/manage/plans` admin page
- Create pricing page for users
- Display plans from database
- No payment yet — just the UI

### Phase 2: MyFatoorah Payment (3-4 days)
- MyFatoorah payment integration
- Checkout API route
- Callback verification
- Subscription creation on successful payment

### Phase 3: Quota Enforcement (2-3 days)
- Remove isCloud() guards
- Assign free tier to all existing users
- Test limit enforcement: contacts, channels, workspaces, team members

### Phase 4: Subscription Lifecycle (2-3 days)
- Cancel/reactivate subscription
- Renewal reminders (WhatsApp message before expiry)
- Expiry handling (downgrade to free tier)
- Subscription management page for users

### Phase 5: Polish (1-2 days)
- Usage meters on dashboard
- Upgrade prompts when approaching limits
- Arabic translations for all billing strings
- Email notifications (welcome, payment receipt, expiry warning)

---

## Total Effort: ~2 weeks

## Files Summary

```
NEW:
apps/builder/src/app/manage/plans/page.tsx          → Admin plan management
apps/builder/src/features/plans/                     → Plan CRUD actions/schemas
apps/builder/src/app/pricing/page.tsx                → User-facing pricing page
apps/builder/src/lib/myfatoorah.ts              → MyFatoorah client (verify, refund)
apps/builder/src/app/api/billing/checkout/route.ts   → Payment initiation
apps/builder/src/app/api/billing/callback/route.ts   → Payment verification
apps/builder/src/app/api/billing/webhook/route.ts    → MyFatoorah webhooks
apps/builder/src/features/billing/                   → Billing components/actions

MODIFY:
apps/builder/src/app/space/[workspaceId]/layout.tsx  → Enable quota loading
packages/business/src/user-quota/service.ts          → Remove isCloud() guard
packages/business/src/quota-enforcement/service.ts   → Remove isCloud() guard
+ 4-5 action files for limit enforcement
```
