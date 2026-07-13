import { MoyasarGateway } from "./gateways/moyasar"
import { MyFatoorahGateway } from "./gateways/myfatoorah"
import type { PaymentGateway } from "./payment-gateway"

export function getPaymentGateway(): PaymentGateway {
  const gatewayName = process.env.PAYMENT_GATEWAY ?? "moyasar"

  switch (gatewayName) {
    case "myfatoorah":
      return new MyFatoorahGateway()
    case "moyasar":
      return new MoyasarGateway()
    default:
      throw new Error(`Unknown payment gateway: ${gatewayName}`)
  }
}
