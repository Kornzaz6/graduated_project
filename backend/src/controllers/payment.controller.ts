import { Request, Response } from "express";
import prisma from "../prisma";
import sharp from "sharp";
import jsQR from "jsqr";
import Tesseract from "tesseract.js";
import crypto from "crypto";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import { decrypt } from "../utils/encryption";
import { generatePromptPayQR } from "../utils/promptpay";
import axios from "axios";
import { supabase } from "../utils/supabase"

/* =====================================================
   CREATE MONTHLY PAYMENT RECORD
===================================================== */
export const createMonthlyPayment = async (req: Request, res: Response) => {
  try {
    const { contractId, billingMonth, amount, dueDate } = req.body;

    if (!contractId || !billingMonth || !amount || !dueDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const payment = await prisma.payment.create({
      data: {
        contractId: Number(contractId),
        billingMonth: new Date(billingMonth),
        amount: Number(amount),
        dueDate: new Date(dueDate),
      },
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create payment" });
  }
};

/* =====================================================
   UPLOAD SLIP
===================================================== */
export const uploadSlip = async (req: Request, res: Response) => {
  try {

    const paymentId = Number(req.params.id)

    if (!req.file) {
      return res.status(400).json({
        message: "Slip file required"
      })
    }

    const buffer = req.file.buffer

    /* ================= HASH ================= */

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
      return res.status(400).json({
        message: "Duplicate slip detected"
      })
    }

    /* ================= UPLOAD TO SUPABASE ================= */

    const bucket = process.env.SUPABASE_BUCKET || "dormitories"

    const fileName = `slips/slip-${paymentId}-${Date.now()}.jpg`

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: req.file.mimetype,
        upsert: false
      })

    if (error) {

      console.error("SUPABASE UPLOAD ERROR:", error)

      return res.status(500).json({
        message: "Upload failed"
      })

    }

    /* ================= PUBLIC URL ================= */

    const publicUrl =
`${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${fileName}`

    /* ================= UPDATE PAYMENT ================= */

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        slipImageUrl: publicUrl,
        imageHash,
        status: "VERIFYING"
      }
    })

    /* ================= START AI VERIFY ================= */

    verifyPayment(paymentId).catch(console.error)

    res.json({
      message: "Slip uploaded successfully",
      url: publicUrl
    })

  } catch (error) {

    console.error("UPLOAD SLIP ERROR:", error)

    res.status(500).json({
      message: "Upload failed"
    })

  }
};
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
                  include: { owner: true },
                },
              },
            },
          },
        },
      },
    });

    if (!payment || !payment.slipImageUrl) return;

    const owner = payment.contract.room.dormitory.owner;

    /* ================= OWNER ACCOUNT ================= */

    let ownerAccount: string | null = null;

    if (owner.paymentType === "PROMPTPAY" && owner.promptPayId) {
      ownerAccount = decrypt(owner.promptPayId);
    }

    if (owner.paymentType === "BANK" && owner.bankAccountNo) {
      ownerAccount = decrypt(owner.bankAccountNo);
    }

    /* ================= QR SCAN ================= */

    let slipData = await tryDecodeQR(payment.slipImageUrl);

    /* ================= OCR FALLBACK ================= */

    if (!slipData || slipData.amount == null) {
      const text = await runOCR(payment.slipImageUrl);
      slipData = parseOCRText(text);
    }

    /* ================= CANNOT READ ================= */

    if (!slipData || slipData.amount == null) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "PENDING",
          verificationNote: "AI flagged: Cannot read slip amount",
        },
      });
      return;
    }

    /* ================= AMOUNT CHECK ================= */

    const expected = Number(payment.amount);
    const received = Number(slipData.amount);

    if (Math.abs(expected - received) > 0.01) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "PENDING",
          verificationNote: "AI flagged: Amount mismatch",
        },
      });
      return;
    }

    /* ================= DUPLICATE REF ================= */

    if (slipData.transactionRef) {
      const duplicateRef = await prisma.payment.findFirst({
        where: {
          transactionRef: slipData.transactionRef,
        },
      });

      if (duplicateRef) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: "PENDING",
            verificationNote: "AI flagged: Duplicate transaction reference",
          },
        });
        return;
      }
    }

    /* ================= RECEIVER ACCOUNT CHECK ================= */

    if (ownerAccount && slipData.receiverAccount) {
      const cleanOwner = String(ownerAccount).replace(/\D/g, "");
      const cleanReceiver = String(slipData.receiverAccount).replace(/\D/g, "");

      if (cleanOwner && cleanReceiver) {
        const ownerTail = cleanOwner.slice(-6);

        if (!cleanReceiver.includes(ownerTail)) {
          await prisma.payment.update({
            where: { id: paymentId },
            data: {
              status: "PENDING",
              verificationNote: "AI flagged: Receiver account mismatch",
            },
          });
          return;
        }
      }
    }

    /* ================= SUCCESS ================= */

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "VERIFIED",
        verifiedByAI: true,
        paidAt: new Date(),
        transactionRef: slipData.transactionRef || null,
        verificationNote: "AI verified successfully",
      },
    });

  } catch (error) {

    console.error("VERIFY ERROR:", error);

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "PENDING",
        verificationNote: "AI verification error",
      },
    });

  }
}

/* =====================================================
   QR DECODE
===================================================== */
async function tryDecodeQR(imageUrl: string) {
  try {
    const buffer = await loadImageBuffer(imageUrl);

    const image = await sharp(buffer)
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    const qr = jsQR(
      new Uint8ClampedArray(image.data),
      image.info.width,
      image.info.height,
    );

    if (!qr) return null;

    return parseQRData(qr.data);
  } catch {
    return null;
  }
}

//emv parser (สำหรับ PromptPay QR จะอยู่ในรูปแบบ EMV)
function extractAmountFromEMV(payload: string): number | null {
  const tag = "54";
  const index = payload.indexOf(tag);

  if (index === -1) return null;

  const lengthStr = payload.substr(index + 2, 2);
  const length = Number(lengthStr);

  if (isNaN(length)) return null;

  const value = payload.substr(index + 4, length);

  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

function parseQRData(data: string) {
  return {
    amount: extractAmountFromEMV(data), // 🔥 ใช้ EMV parser
    transactionRef: extractRef(data),
    receiverAccount: extractAccount(data),
  };
}

/* =====================================================
   OCR FALLBACK
===================================================== */
async function runOCR(imageUrl: string) {
  const buffer = await loadImageBuffer(imageUrl);

  const result = await Tesseract.recognize(buffer, "tha+eng");

  return result.data.text;
}

function parseOCRText(text: string) {
  return {
    amount: extractAmountFromText(text),
    transactionRef: extractRef(text),
    receiverAccount: extractAccount(text),
  };
}

/* =====================================================
   EXTRACT HELPERS
===================================================== */
function extractAmountFromText(text: string): number | null {
  if (!text) return null;

  // 🔥 หา pattern ที่อยู่ใกล้คำว่า จำนวน หรือ Amount
  const contextualMatch = text.match(
    /(จำนวน|Amount)[^\d]*(\d{1,3}(,\d{3})*(\.\d{2}))/i,
  );

  if (contextualMatch && contextualMatch[2]) {
    return parseFloat(contextualMatch[2].replace(/,/g, ""));
  }

  // 🔥 หาเลขที่ตามด้วยคำว่า บาท
  const bahtMatch = text.match(/(\d{1,3}(,\d{3})*(\.\d{2}))\s*บาท/);
  if (bahtMatch && bahtMatch[1]) {
    return parseFloat(bahtMatch[1].replace(/,/g, ""));
  }

  // 🔥 fallback สุดท้าย: เอาตัวแรก ไม่ใช้ Math.max
  const genericMatch = text.match(/\b\d+\.\d{2}\b/);
  if (!genericMatch) return null;

  return parseFloat(genericMatch[0]);
}

function extractRef(text: string) {
  const match = text.match(/[A-Z0-9]{6,}/);
  return match ? match[0] : null;
}

function extractAccount(text: string) {
  const match = text.match(/\d{10,}/);
  return match ? match[0] : null;
}

/* =====================================================
   REJECT PAYMENT
===================================================== */
export const rejectPayment = async (req: Request, res: Response) => {
  try {

    const paymentId = Number(req.params.id)
    const { reason } = req.body

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    })

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found"
      })
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "REJECTED",
        verificationNote: reason || "Rejected by owner"
      }
    })

    res.json({
      message: "Payment rejected"
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      message: "Reject failed"
    })

  }
}

/* =====================================================
   OWNER CONFIRM
===================================================== */
export const confirmPayment = async (req: Request, res: Response) => {
  try {

    const paymentId = Number(req.params.id)

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      })
    }

    if (payment.status === "CONFIRMED") {
      return res.status(400).json({
        message: "Payment already confirmed",
      })
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "CONFIRMED",
        confirmedByOwner: true,
        ownerConfirmAt: new Date(),
      },
    })

    res.json({
      message: "Payment confirmed successfully",
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      message: "Confirm failed",
    })

  }
}

/* =====================================================
   GET PAYMENTS BY CONTRACT
===================================================== */
export const getPaymentsByContract = async (req: Request, res: Response) => {
  try {
    const contractId = Number(req.params.contractId);
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    console.log("USER FROM TOKEN:", (req as any).user);

    if (!contractId || isNaN(contractId)) {
      return res.status(400).json({ message: "Invalid contract id" });
    }

    const contract = await prisma.leaseContract.findUnique({
      where: { id: contractId },
      include: {
        room: {
          include: {
            dormitory: true,
          },
        },
      },
    });

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    /* ================= OWNER AUTH CHECK ================= */

    if (role === "OWNER") {
      const owner = await prisma.owner.findUnique({
        where: { userId },
      });

      if (!owner) {
        return res.status(403).json({ message: "Owner not found" });
      }

      if (contract.room.dormitory.ownerId !== owner.id) {
        return res
          .status(403)
          .json({ message: "Not authorized for this contract" });
      }
    }

    /* ================= MEMBER AUTH CHECK ================= */

    if (role === "MEMBER") {
      if (contract.userId !== userId) {
        return res
          .status(403)
          .json({ message: "Not authorized for this contract" });
      }
    }

    const payments = await prisma.payment.findMany({
      where: { contractId },
      orderBy: { billingMonth: "desc" },
      include: {
        contract: {
          include: {
            user: true,
            room: true,
          },
        },
      },
    });

    return res.json(payments);
  } catch (error) {
    console.error("GET PAYMENTS ERROR:", error);
    return res.status(500).json({ message: "Fetch failed" });
  }
};

/* =====================================================
   GENERATE PAYMENT QR (HYBRID)
===================================================== */
export const generatePaymentQR = async (req: Request, res: Response) => {
  try {
    const contractId = Number(req.params.contractId);

    if (!contractId || isNaN(contractId)) {
      return res.status(400).json({
        message: "Invalid contract id",
      });
    }

    const contract = await prisma.leaseContract.findUnique({
      where: { id: contractId },
      include: {
        payments: {
          orderBy: { billingMonth: "desc" },
          take: 1,
        },
        room: {
          include: {
            dormitory: {
              include: { owner: true },
            },
          },
        },
      },
    });

    if (!contract) {
      return res.status(404).json({
        message: "Contract not found",
      });
    }

    const owner = contract.room.dormitory.owner;

    if (!owner) {
      return res.status(400).json({
        message: "Owner not found",
      });
    }

    const latestPayment = contract.payments[0];

    const amount = latestPayment
      ? Number(latestPayment.amount)
      : Number(contract.monthlyRent);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Invalid amount",
      });
    }

    /* ================= PROMPTPAY ================= */

    if (owner.paymentType === "PROMPTPAY") {
      if (!owner.promptPayId) {
        return res.status(400).json({
          message: "PromptPay not configured",
        });
      }

      const promptPayId = decrypt(owner.promptPayId);

      if (!/^\d{10}$|^\d{13}$/.test(promptPayId)) {
        return res.status(400).json({
          message: "Invalid PromptPay format",
        });
      }

      const payload = generatePromptPayQR(promptPayId, amount);

      const qrImage = await QRCode.toDataURL(payload);

      return res.json({
        type: "PROMPTPAY",
        amount,
        qr: qrImage,
      });
    }

    /* ================= BANK ================= */

    if (owner.paymentType === "BANK") {
      if (!owner.bankAccountNo) {
        return res.status(400).json({
          message: "Bank account not configured",
        });
      }

      const accountNo = decrypt(owner.bankAccountNo);

      return res.json({
        type: "BANK",
        bankName: owner.bankName,
        accountName: owner.bankAccountName,
        accountNo,
        amount,
      });
    }

    return res.status(400).json({
      message: "Unsupported payment type",
    });
  } catch (error: any) {
    console.error("GENERATE QR ERROR:", error);

    return res.status(500).json({
      message: error.message || "Failed to generate payment info",
    });
  }
};

//owner create one-time payment record (without billing month, for custom charges)
export const ownerCreatePayment = async (req: Request, res: Response) => {
  try {
    const { contractId, billingMonth, amount, dueDate } = req.body;

    if (!contractId || !amount || !billingMonth || !dueDate) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const existing = await prisma.payment.findFirst({
      where: {
        contractId: Number(contractId),
        billingMonth: new Date(billingMonth),
      },
    });

    if (existing) {
      return res.status(400).json({
        message: "This month's bill already exists",
      });
    }

    const payment = await prisma.payment.create({
      data: {
        contractId: Number(contractId),
        billingMonth: new Date(billingMonth),
        amount: Number(amount),
        dueDate: new Date(dueDate),
        status: "PENDING",
      },
    });

    return res.status(201).json(payment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to create payment",
    });
  }
};

//owner generate custom QR (for one-time payment without creating a payment record)
export const ownerGenerateCustomQR = async (req: Request, res: Response) => {
  try {
    const { ownerId, amount } = req.body;

    if (!ownerId || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        message: "Invalid input",
      });
    }

    const owner = await prisma.owner.findUnique({
      where: { userId: Number(ownerId) },
    });

    if (!owner) {
      return res.status(404).json({
        message: "Owner not found",
      });
    }

    const paymentAmount = Number(amount);

    /* ================= PROMPTPAY ================= */

    if (owner.paymentType === "PROMPTPAY") {
      if (!owner.promptPayId) {
        return res.status(400).json({
          message: "PromptPay not configured",
        });
      }

      const promptPayId = decrypt(owner.promptPayId);

      const payload = generatePromptPayQR(promptPayId, paymentAmount);

      const qrImage = await QRCode.toDataURL(payload);

      return res.json({
        type: "PROMPTPAY",
        amount: paymentAmount,
        qr: qrImage,
      });
    }

    /* ================= BANK ================= */

    if (owner.paymentType === "BANK") {
      if (!owner.bankAccountNo) {
        return res.status(400).json({
          message: "Bank account not configured",
        });
      }

      const accountNo = decrypt(owner.bankAccountNo);

      return res.json({
        type: "BANK",
        bankName: owner.bankName,
        accountName: owner.bankAccountName,
        accountNo,
        amount: paymentAmount,
      });
    }

    return res.status(400).json({
      message: "Unsupported payment type",
    });
  } catch (error) {
    console.error("CUSTOM QR ERROR:", error);

    return res.status(500).json({
      message: "QR generation failed",
    });
  }
};

export const getPaymentsByOwner = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const owner = await prisma.owner.findUnique({
      where: { userId },
    });

    if (!owner) {
      return res.status(404).json({
        message: "Owner not found",
      });
    }

    const payments = await prisma.payment.findMany({
      where: {
        contract: {
          room: {
            dormitory: {
              ownerId: owner.id,
            },
          },
        },
      },
      include: {
        contract: {
          include: {
            user: true,
            room: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch payments",
    });
  }
};

export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const paymentId = Number(req.params.id);

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        contract: {
          include: {
            user: true,
            room: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch payment" });
  }
};

async function loadImageBuffer(url: string): Promise<Buffer> {

  const response = await axios.get(url, {
    responseType: "arraybuffer"
  })

  return Buffer.from(response.data)

}
