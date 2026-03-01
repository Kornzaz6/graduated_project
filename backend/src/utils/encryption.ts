import crypto from "crypto"

const algorithm = "aes-256-cbc"

const key = crypto
  .createHash("sha256")
  .update(String(process.env.ENCRYPTION_SECRET))
  .digest()
  .subarray(0, 32)

const iv = Buffer.alloc(16, 0)

export function encrypt(text: string) {
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")
  return encrypted
}

export function decrypt(text: string) {
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(text, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}

export function maskAccount(account: string) {
  if (!account) return ""
  const visible = account.slice(-4)
  return "xxxxxx" + visible
}