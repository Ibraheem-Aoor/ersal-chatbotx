import type {
  ChargeTokenResult,
  PaymentGateway,
  PaymentInitiation,
  PaymentResult,
  RefundResult,
} from "../payment-gateway"

const API_BASE = "https://api.moyasar.com/v1"

function mapStatus(status: string): "paid" | "pending" | "failed" {
  if (status === "paid") {
    return "paid"
  }
  if (status === "initiated" || status === "authorized") {
    return "pending"
  }
  return "failed"
}

function toHalalas(sar: number): number {
  return Math.round(sar * 100)
}

function toSar(halalas: number): number {
  return halalas / 100
}

function basicAuthHeader(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`
}

export class MoyasarGateway implements PaymentGateway {
  private readonly secretKey: string
  private readonly publishableKey: string

  constructor() {
    this.secretKey = process.env.MOYASAR_SECRET_KEY ?? ""
    this.publishableKey = process.env.MOYASAR_PUBLISHABLE_KEY ?? ""
  }

  name(): string {
    return "moyasar"
  }

  initiate(params: {
    amount: number
    currency: string
    description: string
    callbackUrl: string
    errorUrl: string
    metadata: Record<string, string>
  }): Promise<PaymentInitiation> {
    return Promise.resolve({
      gatewayName: this.name(),
      type: "embedded",
      formConfig: {
        publishable_api_key: this.publishableKey,
        amount: toHalalas(params.amount),
        currency: params.currency,
        description: params.description,
        callback_url: params.callbackUrl,
        methods: ["creditcard", "applepay", "stcpay"],
        // Apple Pay requires domain verification via Moyasar dashboard.
        // Place the verification file at /.well-known/apple-developer-merchantid-domain-association
        apple_pay: {
          country: "SA",
          label: params.description,
          validate_merchant_url: "https://api.moyasar.com/v1/applepay/initiate",
        },
        supported_networks: ["visa", "mastercard", "mada", "amex"],
        metadata: params.metadata,
      },
    })
  }

  async verify(paymentId: string): Promise<PaymentResult> {
    const response = await fetch(`${API_BASE}/payments/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: basicAuthHeader(this.secretKey),
      },
    })

    const data = await response.json()
    const status = data.status as string
    const amountHalalas = typeof data.amount === "number" ? data.amount : 0

    return {
      success: status === "paid",
      paymentId: data.id?.toString() ?? paymentId,
      status: mapStatus(status),
      amount: toSar(amountHalalas),
      currency: data.currency ?? "SAR",
      method: data.source?.type,
      errorMessage: data.source?.message || undefined,
      rawResponse: data,
    }
  }

  async chargeToken(params: {
    token: string
    amount: number
    currency: string
    description: string
    metadata?: Record<string, string>
  }): Promise<ChargeTokenResult> {
    const response = await fetch(`${API_BASE}/payments`, {
      method: "POST",
      headers: {
        Authorization: basicAuthHeader(this.secretKey),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: toHalalas(params.amount),
        currency: params.currency,
        description: params.description,
        source: {
          type: "token",
          token: params.token,
        },
        metadata: params.metadata,
      }),
    })

    const data = await response.json()
    const status = data.status as string

    return {
      success: status === "paid",
      paymentId: data.id?.toString() ?? "",
      amount: params.amount,
      currency: params.currency,
      errorMessage:
        status === "paid" ? undefined : (data.message ?? "Charge failed"),
    }
  }

  async refund(paymentId: string, amount: number): Promise<RefundResult> {
    const response = await fetch(`${API_BASE}/payments/${paymentId}/refund`, {
      method: "POST",
      headers: {
        Authorization: basicAuthHeader(this.secretKey),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: toHalalas(amount),
      }),
    })

    const data = await response.json()
    const refunded = data.status === "refunded"

    return {
      success: refunded,
      refundId: data.id?.toString() ?? "",
      amount,
      errorMessage: refunded ? undefined : (data.message ?? "Refund failed"),
    }
  }
}
