import generatePayload from "promptpay-qr"

/* ==============================
   Detect PromptPay Type
============================== */
export function detectPromptPayType(value: string) {
  const cleaned = value.replace(/\D/g, "")

  if (cleaned.length === 10) {
    return "MOBILE"
  }

  if (cleaned.length === 13) {
    return "CITIZEN"
  }

  if (cleaned.length === 15) {
    return "EWALLET"
  }

  return null
}

/* ==============================
   Normalize Value
============================== */
export function normalizePromptPay(value: string) {
  return value.replace(/\D/g, "")
}

/* ==============================
   Generate PromptPay QR Payload
============================== */
export function generatePromptPayQR(
  account: string,
  amount: number
) {
  const cleaned = normalizePromptPay(account)

  const type = detectPromptPayType(cleaned)

  if (!type) {
    throw new Error("Invalid PromptPay format")
  }

  if (!amount || amount <= 0) {
    throw new Error("Invalid amount")
  }

  return generatePayload(cleaned, { amount })
}