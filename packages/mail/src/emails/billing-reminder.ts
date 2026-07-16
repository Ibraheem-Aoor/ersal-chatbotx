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
        <mj-text padding="0 0 8px 0">Hi {{userName}},</mj-text>
        <mj-text padding="0">
          Your <strong>{{planName}}</strong> subscription ({{amount}} {{currency}}/{{cycle}})
          will auto-renew on <strong>{{expiryDate}}</strong>.
        </mj-text>
        <mj-text padding="8px 0 0 0">
          If you have a saved payment method, the renewal will happen automatically.
          Otherwise, please update your payment method to avoid interruption.
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="0 0 16px 0">
      <mj-column>
        <mj-button href="{{renewUrl}}" align="left">Manage Subscription</mj-button>
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
        <mj-text padding="0 0 8px 0">Hi {{userName}},</mj-text>
        <mj-text padding="0">
          We were unable to process the automatic renewal for your <strong>{{planName}}</strong> subscription.
          Your account is now in a grace period — you have <strong>3 days</strong> to update your payment method
          before your subscription is downgraded.
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="0 0 16px 0">
      <mj-column>
        <mj-button href="{{renewUrl}}" align="left" background-color="#dc2626">Update Payment Method</mj-button>
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
        <mj-text padding="0 0 8px 0">Hi {{userName}},</mj-text>
        <mj-text padding="0">
          Your <strong>{{planName}}</strong> subscription has expired due to a payment failure.
          Your account has been moved to the free plan with limited features.
        </mj-text>
        <mj-text padding="8px 0 0 0">
          To restore your previous plan and features, please subscribe again.
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="0 0 16px 0">
      <mj-column>
        <mj-button href="{{renewUrl}}" align="left">Resubscribe Now</mj-button>
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
