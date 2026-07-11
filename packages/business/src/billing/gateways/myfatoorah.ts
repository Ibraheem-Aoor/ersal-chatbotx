import type {
  PaymentGateway,
  PaymentInitiation,
  PaymentResult,
  RefundResult,
} from "../payment-gateway"

export class MyFatoorahGateway implements PaymentGateway {
  private readonly apiKey: string
  private readonly apiUrl: string

  constructor() {
    this.apiKey = process.env.MYFATOORAH_API_KEY ?? ""
    this.apiUrl =
      process.env.MYFATOORAH_API_URL ?? "https://apitest.myfatoorah.com"
  }

  name(): string {
    return "myfatoorah"
  }

  async initiate(params: {
    amount: number
    currency: string
    description: string
    callbackUrl: string
    errorUrl: string
    metadata: Record<string, string>
  }): Promise<PaymentInitiation> {
    const response = await fetch(`${this.apiUrl}/v2/SendPayment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        NotificationOption: "LNK",
        InvoiceValue: params.amount,
        CustomerName: params.metadata.userName ?? "Customer",
        CustomerEmail: params.metadata.userEmail,
        DisplayCurrencyIso: params.currency,
        CallBackUrl: params.callbackUrl,
        ErrorUrl: params.errorUrl,
        Language: "AR",
        InvoiceItems: [
          {
            ItemName: params.description,
            Quantity: 1,
            UnitPrice: params.amount,
          },
        ],
        UserDefinedField: JSON.stringify(params.metadata),
      }),
    })

    const data = await response.json()

    if (!data.IsSuccess) {
      throw new Error(data.Message ?? "Failed to create MyFatoorah payment")
    }

    return {
      gatewayName: this.name(),
      type: "redirect",
      redirectUrl: data.Data?.InvoiceURL,
      paymentId: data.Data?.InvoiceId?.toString(),
    }
  }

  async verify(paymentId: string): Promise<PaymentResult> {
    const response = await fetch(`${this.apiUrl}/v2/GetPaymentStatus`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Key: paymentId,
        KeyType: "PaymentId",
      }),
    })

    const data = await response.json()
    const invoiceStatus = data.Data?.InvoiceStatus
    const transactions = data.Data?.InvoiceTransactions
    const lastTransaction = Array.isArray(transactions)
      ? transactions.at(-1)
      : undefined

    return {
      success: invoiceStatus === "Paid",
      paymentId: lastTransaction?.PaymentId ?? paymentId,
      status: invoiceStatus === "Paid" ? "paid" : "failed",
      amount: data.Data?.InvoiceValue ?? 0,
      currency: data.Data?.InvoiceDisplayCurrencyIso ?? "SAR",
      method: lastTransaction?.PaymentGateway,
      errorMessage: lastTransaction?.ErrorMessage || undefined,
      rawResponse: data,
    }
  }

  async refund(paymentId: string, amount: number): Promise<RefundResult> {
    const response = await fetch(`${this.apiUrl}/v2/MakeRefund`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Key: paymentId,
        KeyType: "PaymentId",
        RefundChargeOnCustomer: false,
        ServiceChargeOnCustomer: false,
        Amount: amount,
        Comment: "Subscription refund",
      }),
    })

    const data = await response.json()

    return {
      success: data.IsSuccess === true,
      refundId: data.Data?.Key ?? "",
      amount,
      errorMessage: data.Message,
    }
  }
}
