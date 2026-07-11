import { MyFatoorahGateway } from "./gateways/myfatoorah"
import type { PaymentGateway } from "./payment-gateway"

export function getPaymentGateway(): PaymentGateway {
  const gatewayName = process.env.PAYMENT_GATEWAY ?? "myfatoorah"

  switch (gatewayName) {
    case "myfatoorah":
      return new MyFatoorahGateway()
    default:
      throw new Error(`Unknown payment gateway: ${gatewayName}`)
  }
}
