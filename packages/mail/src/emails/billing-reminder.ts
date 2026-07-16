import { type BaseEmailProps, buildSystemEmail, esc } from "./base-template"

export type BillingReminderProps = BaseEmailProps & {
  userName: string
  planName: string
  amount: string
  currency: string
  cycle: string
  expiryDate: string
  renewUrl: string
}

export const RENEWAL_REMINDER_BODY_MJML = `<mj-section padding="0 0 16px 0">
      <mj-column>
        <mj-text padding="0 0 8px 0" align="right"><div dir="rtl" style="text-align: right;">مرحباً {{userName}}،</div></mj-text>
        <mj-text padding="0" align="right"><div dir="rtl" style="text-align: right;">
          سيتم تجديد اشتراكك في باقة <strong>{{planName}}</strong> ({{amount}} {{currency}}/{{cycle}})
          تلقائياً بتاريخ <strong>{{expiryDate}}</strong>.
        </div></mj-text>
        <mj-text padding="8px 0 0 0" align="right"><div dir="rtl" style="text-align: right;">
          إذا كانت لديك طريقة دفع محفوظة، سيتم التجديد تلقائياً.
          وإلا، يرجى تحديث طريقة الدفع لتجنب انقطاع الخدمة.
        </div></mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="0 0 16px 0">
      <mj-column>
        <mj-button href="{{renewUrl}}" align="right">إدارة الاشتراك</mj-button>
      </mj-column>
    </mj-section>`

export function buildRenewalReminderMjml(props: BillingReminderProps): string {
  const body = RENEWAL_REMINDER_BODY_MJML.replace(
    /\{\{userName\}\}/g,
    esc(props.userName),
  )
    .replace(/\{\{planName\}\}/g, esc(props.planName))
    .replace(/\{\{amount\}\}/g, esc(props.amount))
    .replace(/\{\{currency\}\}/g, esc(props.currency))
    .replace(/\{\{cycle\}\}/g, esc(props.cycle))
    .replace(/\{\{expiryDate\}\}/g, esc(props.expiryDate))
    .replace(/\{\{renewUrl\}\}/g, esc(props.renewUrl))
  return buildSystemEmail(props, body)
}

export type PaymentFailedProps = BaseEmailProps & {
  userName: string
  planName: string
  renewUrl: string
}

export const PAYMENT_FAILED_BODY_MJML = `<mj-section padding="0 0 16px 0">
      <mj-column>
        <mj-text padding="0 0 8px 0" align="right"><div dir="rtl" style="text-align: right;">مرحباً {{userName}}،</div></mj-text>
        <mj-text padding="0" align="right"><div dir="rtl" style="text-align: right;">
          لم نتمكن من معالجة التجديد التلقائي لاشتراكك في باقة <strong>{{planName}}</strong>.
          حسابك الآن في فترة سماح — لديك <strong>3 أيام</strong> لتحديث طريقة الدفع
          قبل تخفيض اشتراكك.
        </div></mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="0 0 16px 0">
      <mj-column>
        <mj-button href="{{renewUrl}}" align="right" background-color="#dc2626">تحديث طريقة الدفع</mj-button>
      </mj-column>
    </mj-section>`

export function buildPaymentFailedMjml(props: PaymentFailedProps): string {
  const body = PAYMENT_FAILED_BODY_MJML.replace(
    /\{\{userName\}\}/g,
    esc(props.userName),
  )
    .replace(/\{\{planName\}\}/g, esc(props.planName))
    .replace(/\{\{renewUrl\}\}/g, esc(props.renewUrl))
  return buildSystemEmail(props, body)
}

export type SubscriptionExpiredProps = BaseEmailProps & {
  userName: string
  planName: string
  renewUrl: string
}

export const SUBSCRIPTION_EXPIRED_BODY_MJML = `<mj-section padding="0 0 16px 0">
      <mj-column>
        <mj-text padding="0 0 8px 0" align="right"><div dir="rtl" style="text-align: right;">مرحباً {{userName}}،</div></mj-text>
        <mj-text padding="0" align="right"><div dir="rtl" style="text-align: right;">
          انتهى اشتراكك في باقة <strong>{{planName}}</strong> بسبب فشل عملية الدفع.
          تم نقل حسابك إلى الباقة المجانية بميزات محدودة.
        </div></mj-text>
        <mj-text padding="8px 0 0 0" align="right"><div dir="rtl" style="text-align: right;">
          لاستعادة باقتك السابقة وجميع الميزات، يرجى إعادة الاشتراك.
        </div></mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="0 0 16px 0">
      <mj-column>
        <mj-button href="{{renewUrl}}" align="right">أعد الاشتراك الآن</mj-button>
      </mj-column>
    </mj-section>`

export function buildSubscriptionExpiredMjml(
  props: SubscriptionExpiredProps,
): string {
  const body = SUBSCRIPTION_EXPIRED_BODY_MJML.replace(
    /\{\{userName\}\}/g,
    esc(props.userName),
  )
    .replace(/\{\{planName\}\}/g, esc(props.planName))
    .replace(/\{\{renewUrl\}\}/g, esc(props.renewUrl))
  return buildSystemEmail(props, body)
}
