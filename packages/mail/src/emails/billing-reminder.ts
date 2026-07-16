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

export type TrialExpiryProps = BaseEmailProps & {
  userName: string
  planName: string
  expiryDate: string
  renewUrl: string
}

export const TRIAL_EXPIRY_BODY_MJML = `<mj-section padding="0 0 16px 0">
      <mj-column>
        <mj-text padding="0 0 8px 0" align="right"><div dir="rtl" style="text-align: right;">مرحباً {{userName}}،</div></mj-text>
        <mj-text padding="0" align="right"><div dir="rtl" style="text-align: right;">
          فترة تجربتك لباقة <strong>{{planName}}</strong> تنتهي في <strong>{{expiryDate}}</strong>.
          اشترك في باقة مدفوعة للمتابعة والاستفادة من جميع الميزات.
        </div></mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="0 0 16px 0">
      <mj-column>
        <mj-button href="{{renewUrl}}" align="right">اشترك الآن</mj-button>
      </mj-column>
    </mj-section>`

export function buildTrialExpiryMjml(props: TrialExpiryProps): string {
  const body = TRIAL_EXPIRY_BODY_MJML.replace(
    /\{\{userName\}\}/g,
    esc(props.userName),
  )
    .replace(/\{\{planName\}\}/g, esc(props.planName))
    .replace(/\{\{expiryDate\}\}/g, esc(props.expiryDate))
    .replace(/\{\{renewUrl\}\}/g, esc(props.renewUrl))
  return buildSystemEmail(props, body)
}

export type ActiveNoTokenReminderProps = BaseEmailProps & {
  userName: string
  planName: string
  expiryDate: string
  renewUrl: string
}

export const ACTIVE_NO_TOKEN_REMINDER_BODY_MJML = `<mj-section padding="0 0 16px 0">
      <mj-column>
        <mj-text padding="0 0 8px 0" align="right"><div dir="rtl" style="text-align: right;">مرحباً {{userName}}،</div></mj-text>
        <mj-text padding="0" align="right"><div dir="rtl" style="text-align: right;">
          اشتراكك في باقة <strong>{{planName}}</strong> ينتهي في <strong>{{expiryDate}}</strong>.
          يرجى تحديث طريقة الدفع لتجنب انقطاع الخدمة.
        </div></mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="0 0 16px 0">
      <mj-column>
        <mj-button href="{{renewUrl}}" align="right" background-color="#f59e0b">تحديث طريقة الدفع</mj-button>
      </mj-column>
    </mj-section>`

export function buildActiveNoTokenReminderMjml(
  props: ActiveNoTokenReminderProps,
): string {
  const body = ACTIVE_NO_TOKEN_REMINDER_BODY_MJML.replace(
    /\{\{userName\}\}/g,
    esc(props.userName),
  )
    .replace(/\{\{planName\}\}/g, esc(props.planName))
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

export type PaymentConfirmationProps = BaseEmailProps & {
  userName: string
  planName: string
  amount: string
  currency: string
  cycle: string
  periodStart: string
  periodEnd: string
  gatewayPaymentId: string
  companyName?: string
  vatNumber?: string
  baseAmount: string
  vatAmount: string
  totalAmount: string
  receiptUrl: string
}

export const PAYMENT_CONFIRMATION_BODY_MJML = `<mj-section padding="0 0 16px 0">
      <mj-column>
        <mj-text padding="0 0 8px 0" align="right"><div dir="rtl" style="text-align: right;">مرحباً {{userName}}،</div></mj-text>
        <mj-text padding="0" align="right"><div dir="rtl" style="text-align: right;">
          شكراً لك! تم الدفع بنجاح لباقة <strong>{{planName}}</strong>.
        </div></mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="0 0 16px 0">
      <mj-column>
        <mj-text padding="0" align="right"><div dir="rtl" style="text-align: right;">
          <strong>تفاصيل الدفع:</strong><br/>
          الباقة: {{planName}} ({{cycle}})<br/>
          فترة الاشتراك: {{periodStart}} → {{periodEnd}}<br/>
          رقم المرجع: {{gatewayPaymentId}}<br/>
          {{companyInfo}}
        </div></mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="0 0 16px 0" background-color="#f8f9fa">
      <mj-column>
        <mj-text padding="8px 0" align="right"><div dir="rtl" style="text-align: right;">
          المبلغ قبل الضريبة: {{baseAmount}} {{currency}}<br/>
          ضريبة القيمة المضافة (15%): {{vatAmount}} {{currency}}<br/>
          <strong>الإجمالي: {{totalAmount}} {{currency}}</strong>
        </div></mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="0 0 16px 0">
      <mj-column>
        <mj-button href="{{receiptUrl}}" align="right">عرض الإيصال</mj-button>
      </mj-column>
    </mj-section>`

export function buildPaymentConfirmationMjml(
  props: PaymentConfirmationProps,
): string {
  let companyInfo = ""
  if (props.companyName) {
    companyInfo += `الشركة: ${esc(props.companyName)}<br/>`
  }
  if (props.vatNumber) {
    companyInfo += `الرقم الضريبي: ${esc(props.vatNumber)}<br/>`
  }
  const body = PAYMENT_CONFIRMATION_BODY_MJML.replace(
    /\{\{userName\}\}/g,
    esc(props.userName),
  )
    .replace(/\{\{planName\}\}/g, esc(props.planName))
    .replace(/\{\{cycle\}\}/g, esc(props.cycle))
    .replace(/\{\{periodStart\}\}/g, esc(props.periodStart))
    .replace(/\{\{periodEnd\}\}/g, esc(props.periodEnd))
    .replace(/\{\{gatewayPaymentId\}\}/g, esc(props.gatewayPaymentId))
    .replace(/\{\{companyInfo\}\}/g, companyInfo)
    .replace(/\{\{baseAmount\}\}/g, esc(props.baseAmount))
    .replace(/\{\{vatAmount\}\}/g, esc(props.vatAmount))
    .replace(/\{\{totalAmount\}\}/g, esc(props.totalAmount))
    .replace(/\{\{currency\}\}/g, esc(props.currency))
    .replace(/\{\{receiptUrl\}\}/g, esc(props.receiptUrl))
  return buildSystemEmail(props, body)
}
