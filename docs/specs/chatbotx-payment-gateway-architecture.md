# Payment Gateway Architecture — ChatbotX Self-Hosted

## Design: Strategy Pattern (Pluggable Gateways)

```
PaymentGateway (interface)
├── initiate(plan, user): PaymentInitiation
├── verify(paymentId): PaymentResult
├── refund(paymentId, amount): RefundResult
│
├── MyFatoorahGateway implements PaymentGateway     ← active now
├── MoyasarGateway implements PaymentGateway         ← future
├── TapGateway implements PaymentGateway             ← future
└── StripeGateway implements PaymentGateway           ← future

PaymentGatewayFactory
├── getGateway(): PaymentGateway
├── resolves from config: PAYMENT_GATEWAY=myfatoorah
└── switching = change one env var
```

Adding a new gateway = one class + config. Zero changes to billing logic, pricing page, or subscription management.

---

## Interface

```typescript
// packages/business/src/billing/payment-gateway.ts

export interface PaymentInitiation {
  gatewayName: string
  type: 'redirect' | 'embedded'     // MyFatoorah = redirect, Moyasar = embedded
  redirectUrl?: string               // For redirect-based gateways
  formConfig?: Record<string, any>   // For embedded form gateways
  paymentId?: string                 // Gateway's payment/invoice ID
}

export interface PaymentResult {
  success: boolean
  paymentId: string
  status: 'paid' | 'failed' | 'pending'
  amount: number                     // In SAR (e.g. 99.00)
  currency: string
  method?: string                    // 'visa', 'mada', 'stcpay', 'applepay'
  errorMessage?: string
  rawResponse: Record<string, any>
}

export interface RefundResult {
  success: boolean
  refundId: string
  amount: number
  errorMessage?: string
}

export interface PaymentGateway {
  name(): string
  initiate(params: {
    amount: number                   // In SAR (e.g. 99.00)
    currency: string
    description: string
    callbackUrl: string
    errorUrl: string
    metadata: Record<string, string>
  }): Promise<PaymentInitiation>

  verify(paymentId: string): Promise<PaymentResult>
  
  refund(paymentId: string, amount: number): Promise<RefundResult>
}
```

---

## MyFatoorah Implementation

**Official API Docs:** https://docs.myfatoorah.com/docs
- SendPayment: https://docs.myfatoorah.com/docs/send-payment
- GetPaymentStatus: https://docs.myfatoorah.com/docs/get-payment-details
- Payment Inquiry: https://docs.myfatoorah.com/docs/payment-inquiry
- Embedded Payment: https://docs.myfatoorah.com/docs/embedded-integration-steps
- Webhooks: https://docs.myfatoorah.com/docs/update-payment-status-guidelines

**IMPORTANT:** Claude Code MUST read the official docs above before implementing. Do NOT rely on the code samples below — they are simplified references. The official docs have the exact request/response schemas.

```typescript
// packages/business/src/billing/gateways/myfatoorah.ts

export class MyFatoorahGateway implements PaymentGateway {
  private apiKey: string
  private apiUrl: string

  constructor() {
    this.apiKey = process.env.MYFATOORAH_API_KEY!
    this.apiUrl = process.env.MYFATOORAH_API_URL || 'https://api.myfatoorah.com'
    // Test: https://apitest.myfatoorah.com
  }

  name(): string {
    return 'myfatoorah'
  }

  async initiate(params): Promise<PaymentInitiation> {
    const response = await fetch(`${this.apiUrl}/v2/SendPayment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        NotificationOption: 'LNK',
        InvoiceValue: params.amount,  // Amount in SAR (e.g. 99.00)
        CustomerName: params.metadata.userName || 'Customer',
        CustomerEmail: params.metadata.userEmail,
        DisplayCurrencyIso: params.currency,
        CallBackUrl: params.callbackUrl,
        ErrorUrl: params.errorUrl,
        Language: 'AR',
        InvoiceItems: [{
          ItemName: params.description,
          Quantity: 1,
          UnitPrice: params.amount,
        }],
        UserDefinedField: JSON.stringify(params.metadata),
      }),
    })

    const data = await response.json()

    return {
      gatewayName: this.name(),
      type: 'redirect',
      redirectUrl: data.Data?.InvoiceURL,
      paymentId: data.Data?.InvoiceId?.toString(),
    }
  }

  async verify(paymentId: string): Promise<PaymentResult> {
    const response = await fetch(`${this.apiUrl}/v2/GetPaymentStatus`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Key: paymentId,
        KeyType: 'PaymentId',
      }),
    })

    const data = await response.json()
    const invoiceStatus = data.Data?.Invoice?.Status  // "PAID" or "PENDING" or "EXPIRED"
    const transaction = data.Data?.Transaction

    return {
      success: invoiceStatus === 'PAID',
      paymentId: transaction?.PaymentId || paymentId,
      status: invoiceStatus === 'PAID' ? 'paid' : 'failed',
      amount: data.Data?.Invoice?.InvoiceValue || 0,
      currency: data.Data?.Invoice?.DisplayCurrencyIso || 'SAR',
      method: transaction?.PaymentMethod,
      errorMessage: transaction?.Error?.Message || undefined,
      rawResponse: data,
    }
  }

  async refund(paymentId: string, amount: number): Promise<RefundResult> {
    const response = await fetch(`${this.apiUrl}/v2/MakeRefund`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Key: paymentId,
        KeyType: 'PaymentId',
        RefundChargeOnCustomer: false,
        ServiceChargeOnCustomer: false,
        Amount: amount,  // Amount in SAR
        Comment: 'Subscription refund',
      }),
    })

    const data = await response.json()

    return {
      success: data.IsSuccess,
      refundId: data.Data?.Key || '',
      amount: amount,
      errorMessage: data.Message,
    }
  }
}
```

---

## Gateway Factory

```typescript
// packages/business/src/billing/payment-gateway-factory.ts

import { MyFatoorahGateway } from './gateways/myfatoorah'
// import { MoyasarGateway } from './gateways/moyasar'     // future
// import { TapGateway } from './gateways/tap'             // future

export function getPaymentGateway(): PaymentGateway {
  const gatewayName = process.env.PAYMENT_GATEWAY || 'myfatoorah'

  switch (gatewayName) {
    case 'myfatoorah':
      return new MyFatoorahGateway()
    // case 'moyasar':
    //   return new MoyasarGateway()
    // case 'tap':
    //   return new TapGateway()
    default:
      throw new Error(`Unknown payment gateway: ${gatewayName}`)
  }
}
```

---

## Config

```env
# .env
PAYMENT_GATEWAY=myfatoorah
MYFATOORAH_API_KEY=your-api-key-here
MYFATOORAH_API_URL=https://apitest.myfatoorah.com
# Production: https://api.myfatoorah.com
```

---

## Checkout Flow

```
User clicks "Subscribe" on pricing page
    → POST /api/billing/checkout { planId, billingCycle }
    → Server:
        1. Load plan from DB
        2. getPaymentGateway().initiate({ amount, callbackUrl, metadata })
        3. Return: { redirectUrl } or { formConfig }
    → Client:
        - If redirect → window.location = redirectUrl
        - If embedded → show Moyasar/Stripe form

User pays on MyFatoorah page
    → MyFatoorah redirects to callbackUrl with paymentId
    → GET /api/billing/callback?paymentId=xxx
    → Server:
        1. getPaymentGateway().verify(paymentId)
        2. If paid:
            a. Create/update Subscription (status=active, periodStart, periodEnd)
            b. Update UserQuota with plan.limits
            c. Redirect to workspace with success toast
        3. If failed:
            a. Redirect to pricing page with error message
```

---

## Switching Gateways

To switch from MyFatoorah to Moyasar:

```env
# Just change one line in .env
PAYMENT_GATEWAY=moyasar
MOYASAR_PUBLISHABLE_KEY=pk_live_xxx
MOYASAR_SECRET_KEY=sk_live_xxx
```

Add `MoyasarGateway` class, uncomment in factory. Zero changes to checkout flow, pricing page, or subscription logic.

---

## File Structure

```
packages/business/src/billing/
├── payment-gateway.ts                → Interface + DTOs
├── payment-gateway-factory.ts        → Factory resolver
├── gateways/
│   ├── myfatoorah.ts                 → MyFatoorah implementation
│   ├── moyasar.ts                    → (future)
│   └── tap.ts                        → (future)
└── subscription-service.ts           → Create, cancel, renew, expire

apps/builder/src/app/api/billing/
├── checkout/route.ts                 → Initiate payment
├── callback/route.ts                 → Verify payment + activate
└── webhook/route.ts                  → Gateway webhooks (optional)

apps/builder/src/app/pricing/
└── page.tsx                          → Pricing cards page

apps/builder/src/app/manage/plans/
└── page.tsx                          → Admin plan CRUD

apps/builder/src/features/billing/
├── components/
│   ├── pricing-cards.tsx             → Plan card grid
│   ├── subscription-status.tsx       → Current plan display
│   └── payment-form.tsx              → Embedded form (for Moyasar/Stripe)
├── actions/
│   ├── subscribe.action.ts           → Activate subscription after payment
│   └── cancel.action.ts              → Cancel subscription
└── hooks/
    └── use-subscription.ts           → Current subscription state
```
