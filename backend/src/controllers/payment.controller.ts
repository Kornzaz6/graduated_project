import { Request, Response } from "express"
import prisma from "../prisma"
import sharp from "sharp"
import jsQR from "jsqr"
import Tesseract from "tesseract.js"
import crypto from "crypto"
import fs from "fs"
import generatePayload from "promptpay-qr"
import QRCode from "qrcode"
import { decrypt } from "../utils/encryption"
import { generatePromptPayQR } from "../utils/promptpay"

/* =====================================================
   CREATE MONTHLY PAYMENT RECORD
===================================================== */
export const createMonthlyPayment = async (req: Request, res: Response) => {
  try {
    const { contractId, billingMonth, amount, dueDate } = req.body

    if (!contractId || !billingMonth || !amount || !dueDate) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const payment = await prisma.payment.create({
      data: {
        contractId: Number(contractId),
        billingMonth: new Date(billingMonth),
        amount: Number(amount),
        dueDate: new Date(dueDate),
      }
    })

    res.status(201).json(payment)

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to create payment" })
  }
}

/* =====================================================
   UPLOAD SLIP
===================================================== */
export const uploadSlip = async (req: Request, res: Response) => {
  try {
    const paymentId = Number(req.params.id)

    if (!req.file) {
      return res.status(400).json({ message: "Slip file required" })
    }

    const filePath = req.file.path
    const buffer = fs.readFileSync(filePath)

    const imageHash = crypto
      .createHash("sha256")
      .update(buffer)
      .digest("hex")

    const duplicate = await prisma.payment.findFirst({
      where: {
        imageHash,
        NOT: { id: paymentId }
      }
    })

    if (duplicate) {
      fs.unlinkSync(filePath)
      return res.status(400).json({
        message: "Duplicate slip image detected"
      })
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        slipImageUrl: filePath,
        imageHash,
        status: "VERIFYING"
      }
    })

    // 🔥 async verify
    verifyPayment(paymentId).catch(console.error)

    res.json({ message: "Slip uploaded. Verification started." })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Upload failed" })
  }
}

/* =====================================================
   VERIFY PAYMENT (QR + OCR)
===================================================== */
async function verifyPayment(paymentId: number) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        contract: {
          include: {
            room: {
              include: {
                dormitory: {
                  include: { owner: true }
                }
              }
            }
          }
        }
      }
    })

    if (!payment || !payment.slipImageUrl) return

    const ownerAccount =
      payment.contract.room.dormitory.owner.bankAccountNo

    let slipData = await tryDecodeQR(payment.slipImageUrl)

    // 🔥 ถ้า QR อ่านได้ แต่ไม่มี amount → fallback OCR
    if (!slipData || slipData.amount == null) {
      const text = await runOCR(payment.slipImageUrl)
      slipData = parseOCRText(text)
    }

    if (!slipData || slipData.amount == null) {
      return rejectPayment(paymentId, "Cannot read slip amount")
    }
    console.log("Expected:", payment.amount)
    console.log("Slip:", slipData.amount)

    /* ========= Amount check (with tolerance) ========= */
    if (
      slipData.amount == null ||
      Math.abs(Number(slipData.amount) - Number(payment.amount)) > 0.01
    ) {
      return rejectPayment(paymentId, "Amount mismatch")
    }

    /* ========= Duplicate transactionRef ========= */
    if (slipData.transactionRef) {
      const duplicateRef = await prisma.payment.findFirst({
        where: { transactionRef: slipData.transactionRef }
      })

      if (duplicateRef) {
        return rejectPayment(paymentId, "Duplicate transaction reference")
      }
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "VERIFIED",
        verifiedByAI: true,
        paidAt: new Date(),
        transactionRef: slipData.transactionRef || null
      }
    })

  } catch (error) {
    console.error("VERIFY ERROR:", error)
    await rejectPayment(paymentId, "Verification error")
  }
}

/* =====================================================
   QR DECODE
===================================================== */
async function tryDecodeQR(imagePath: string) {
  try {
    const image = await sharp(imagePath)
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true })

    const qr = jsQR(
      new Uint8ClampedArray(image.data),
      image.info.width,
      image.info.height
    )

    if (!qr) return null

    return parseQRData(qr.data)

  } catch {
    return null
  }
}

//emv parser (สำหรับ PromptPay QR จะอยู่ในรูปแบบ EMV)
function extractAmountFromEMV(payload: string): number | null {
  const tag = "54"
  const index = payload.indexOf(tag)

  if (index === -1) return null

  const lengthStr = payload.substr(index + 2, 2)
  const length = Number(lengthStr)

  if (isNaN(length)) return null

  const value = payload.substr(index + 4, length)

  const parsed = parseFloat(value)
  return isNaN(parsed) ? null : parsed
}

function parseQRData(data: string) {
  return {
    amount: extractAmountFromEMV(data),   // 🔥 ใช้ EMV parser
    transactionRef: extractRef(data),
    receiverAccount: extractAccount(data)
  }
}

/* =====================================================
   OCR FALLBACK
===================================================== */
async function runOCR(imagePath: string) {
  const result = await Tesseract.recognize(imagePath, "tha+eng")
  return result.data.text
}

function parseOCRText(text: string) {
  return {
    amount: extractAmountFromText(text),
    transactionRef: extractRef(text),
    receiverAccount: extractAccount(text)
  }
}

/* =====================================================
   EXTRACT HELPERS
===================================================== */
function extractAmountFromText(text: string): number | null {
  if (!text) return null

  // 🔥 หา pattern ที่อยู่ใกล้คำว่า จำนวน หรือ Amount
  const contextualMatch = text.match(
    /(จำนวน|Amount)[^\d]*(\d{1,3}(,\d{3})*(\.\d{2}))/i
  )

  if (contextualMatch && contextualMatch[2]) {
    return parseFloat(contextualMatch[2].replace(/,/g, ""))
  }

  // 🔥 หาเลขที่ตามด้วยคำว่า บาท
  const bahtMatch = text.match(/(\d{1,3}(,\d{3})*(\.\d{2}))\s*บาท/)
  if (bahtMatch && bahtMatch[1]) {
    return parseFloat(bahtMatch[1].replace(/,/g, ""))
  }

  // 🔥 fallback สุดท้าย: เอาตัวแรก ไม่ใช้ Math.max
  const genericMatch = text.match(/\b\d+\.\d{2}\b/)
  if (!genericMatch) return null

  return parseFloat(genericMatch[0])
}

function extractRef(text: string) {
  const match = text.match(/[A-Z0-9]{6,}/)
  return match ? match[0] : null
}

function extractAccount(text: string) {
  const match = text.match(/\d{10,}/)
  return match ? match[0] : null
}

/* =====================================================
   REJECT PAYMENT
===================================================== */
async function rejectPayment(paymentId: number, reason: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId }
  })

  if (payment?.slipImageUrl && fs.existsSync(payment.slipImageUrl)) {
    fs.unlinkSync(payment.slipImageUrl)
  }

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "REJECTED",
      verificationNote: reason
    }
  })
}

/* =====================================================
   OWNER CONFIRM
===================================================== */
export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const paymentId = Number(req.params.id)

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    })

    if (!payment || payment.status !== "VERIFIED") {
      return res.status(400).json({
        message: "Payment not ready for confirmation"
      })
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "CONFIRMED",
        confirmedByOwner: true,
        ownerConfirmAt: new Date()
      }
    })

    res.json({ message: "Payment confirmed successfully" })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Confirm failed" })
  }
}

/* =====================================================
   GET PAYMENTS BY CONTRACT
===================================================== */
export const getPaymentsByContract = async (req: Request, res: Response) => {
  try {
    const contractId = Number(req.params.contractId)
    const userId = (req as any).user?.id
    const role = (req as any).user?.role

    console.log("USER FROM TOKEN:", (req as any).user)

    if (!contractId || isNaN(contractId)) {
      return res.status(400).json({ message: "Invalid contract id" })
    }

    const contract = await prisma.leaseContract.findUnique({
      where: { id: contractId },
      include: {
        room: {
          include: {
            dormitory: true
          }
        }
      }
    })

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" })
    }

    /* ================= OWNER AUTH CHECK ================= */

    if (role === "OWNER") {
      const owner = await prisma.owner.findUnique({
        where: { userId }
      })

      if (!owner) {
        return res.status(403).json({ message: "Owner not found" })
      }

      if (contract.room.dormitory.ownerId !== owner.id) {
        return res.status(403).json({ message: "Not authorized for this contract" })
      }
    }

    /* ================= MEMBER AUTH CHECK ================= */

    if (role === "MEMBER") {
      if (contract.userId !== userId) {
        return res.status(403).json({ message: "Not authorized for this contract" })
      }
    }

    const payments = await prisma.payment.findMany({
      where: { contractId },
      orderBy: { billingMonth: "desc" },
      include: {
        contract: {
          include: {
            user: true,
            room: true
          }
        }
      }
    })

    return res.json(payments)

  } catch (error) {
    console.error("GET PAYMENTS ERROR:", error)
    return res.status(500).json({ message: "Fetch failed" })
  }
}

/* =====================================================
   GENERATE PAYMENT QR (HYBRID)
===================================================== */
export const generatePaymentQR = async (req: Request, res: Response) => {
  try {
    const contractId = Number(req.params.contractId)

    if (!contractId || isNaN(contractId)) {
      return res.status(400).json({
        message: "Invalid contract id"
      })
    }

    const contract = await prisma.leaseContract.findUnique({
      where: { id: contractId },
      include: {
        payments: {
          orderBy: { billingMonth: "desc" },
          take: 1
        },
        room: {
          include: {
            dormitory: {
              include: { owner: true }
            }
          }
        }
      }
    })

    if (!contract) {
      return res.status(404).json({
        message: "Contract not found"
      })
    }

    const owner = contract.room.dormitory.owner

    if (!owner || !owner.bankAccountNo) {
      return res.status(400).json({
        message: "Owner payment method not configured"
      })
    }

    // 🔐 decrypt เสมอ (เพราะ DB เก็บ encrypted)
    const accountNumber = decrypt(owner.bankAccountNo)

    // 🔥 รองรับเฉพาะ PromptPay
    if (owner.paymentType !== "PROMPTPAY") {
      return res.status(400).json({
        message: "QR supported only for PromptPay"
      })
    }

    // 🔎 validate PromptPay format
    if (!/^\d{10}$|^\d{13}$/.test(accountNumber)) {
      return res.status(400).json({
        message: "Invalid PromptPay ID format"
      })
    }

    const latestPayment = contract.payments[0]

    const amount = latestPayment
      ? Number(latestPayment.amount)
      : Number(contract.monthlyRent)

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Invalid amount"
      })
    }

    const payload = generatePromptPayQR(accountNumber, amount)

    const qrImage = await QRCode.toDataURL(payload)

    return res.json({
      amount,
      qr: qrImage
    })

  } catch (error: any) {
    console.error("GENERATE QR ERROR:", error)

    return res.status(500).json({
      message: error.message || "Failed to generate QR"
    })
  }
}
//owner create one-time payment record (without billing month, for custom charges)
export const ownerCreatePayment = async (req: Request, res: Response) => {
  try {
    const { contractId, billingMonth, amount, dueDate } = req.body

    if (!contractId || !amount || !billingMonth || !dueDate) {
      return res.status(400).json({
        message: "Missing required fields"
      })
    }

    const existing = await prisma.payment.findFirst({
      where: {
        contractId: Number(contractId),
        billingMonth: new Date(billingMonth)
      }
    })

    if (existing) {
      return res.status(400).json({
        message: "This month's bill already exists"
      })
    }

    const payment = await prisma.payment.create({
      data: {
        contractId: Number(contractId),
        billingMonth: new Date(billingMonth),
        amount: Number(amount),
        dueDate: new Date(dueDate),
        status: "PENDING"
      }
    })

    return res.status(201).json(payment)

  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: "Failed to create payment"
    })
  }
}
//owner generate custom QR (for one-time payment without creating a payment record)
export const ownerGenerateCustomQR = async (req: Request, res: Response) => {
  try {
    const { ownerId, amount } = req.body

    if (!ownerId || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        message: "Invalid input"
      })
    }

    const owner = await prisma.owner.findUnique({
      where: { userId: Number(ownerId) }
    })

    if (!owner || !owner.bankAccountNo) {
      return res.status(400).json({
        message: "Owner payment method not configured"
      })
    }

    // 🔐 decrypt เสมอ (เพราะใน DB เก็บ encrypted)
    const account = decrypt(owner.bankAccountNo)

    // 🔥 รองรับเฉพาะ PROMPTPAY เท่านั้น
    if (owner.paymentType !== "PROMPTPAY") {
      return res.status(400).json({
        message: "QR supported only for PromptPay"
      })
    }

    // 🔎 validate format
    if (!/^\d{10}$|^\d{13}$/.test(account)) {
      return res.status(400).json({
        message: "Invalid PromptPay ID format"
      })
    }

    const payload = generatePromptPayQR(account, Number(amount))

    const qrImage = await QRCode.toDataURL(payload)

    return res.json({
      amount: Number(amount),
      qr: qrImage
    })

  } catch (error) {
    console.error("CUSTOM QR ERROR:", error)
    return res.status(500).json({
      message: "QR generation failed"
    })
  }
}

export const getPaymentsByOwner = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id

    const owner = await prisma.owner.findUnique({
      where: { userId }
    })

    if (!owner) {
      return res.status(404).json({
        message: "Owner not found"
      })
    }

    const payments = await prisma.payment.findMany({
      where: {
        contract: {
          room: {
            dormitory: {
              ownerId: owner.id
            }
          }
        }
      },
      include: {
        contract: {
          include: {
            user: true,
            room: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    res.json(payments)

  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "Failed to fetch payments"
    })
  }
}

export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const paymentId = Number(req.params.id)

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        contract: {
          include: {
            user: true,
            room: true
          }
        }
      }
    })

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" })
    }

    res.json(payment)

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to fetch payment" })
  }
}