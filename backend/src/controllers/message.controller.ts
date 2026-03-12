import { Request, Response } from "express"
import prisma from "../prisma"

/* =====================================================
   SEND MESSAGE
===================================================== */

export const sendMessage = async (req: Request, res: Response) => {

  try {

    const { ticketId, message } = req.body

    const senderId = (req as any).user?.id

    if (!ticketId || !message) {

      return res.status(400).json({
        message: "Missing required fields"
      })

    }

    const newMessage = await prisma.message.create({

      data: {

        ticketId: Number(ticketId),
        senderId,
        message

      }

    })

    res.status(201).json(newMessage)

  }

  catch (error) {

    console.error("SEND MESSAGE ERROR:", error)

    res.status(500).json({
      message: "Failed to send message"
    })

  }

}