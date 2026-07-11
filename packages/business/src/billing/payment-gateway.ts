export interface PaymentInitiation {
  formConfig?: Record<string, unknown>
  gatewayName: string
  paymentId?: string
  redirectUrl?: string
  type: "redirect" | "embedded"
}

export interface PaymentResult {
  amount: number
  currency: string
  errorMessage?: string
  method?: string
  paymentId: string
  rawResponse: Record<string, unknown>
  status: "paid" | "failed" | "pending"
  success: boolean
}

export interface RefundResult {
  amount: number
  errorMessage?: string
  refundId: string
  success: boolean
}

export interface PaymentGateway {
  initiate(params: {
    amount: number
    currency: string
    description: string
    callbackUrl: string
    errorUrl: string
    metadata: Record<string, string>
  }): Promise<PaymentInitiation>
  name(): string

  refund(paymentId: string, amount: number): Promise<RefundResult>

  verify(paymentId: string): Promise<PaymentResult>
}
