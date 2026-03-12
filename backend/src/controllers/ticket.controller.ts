import { Request, Response } from "express"
import prisma from "../prisma"

/* =====================================================
   CREATE TICKET (Member)
===================================================== */

export const createTicket = async (req: Request, res: Response) => {

  try {

    const { contractId, title, message, type } = req.body

    const userId = (req as any).user?.id

    if (!contractId || !title || !message) {
      return res.status(400).json({
        message: "Missing required fields"
      })
    }

    /* ================= GET CONTRACT ================= */

    const contract = await prisma.leaseContract.findUnique({
      where: { id: Number(contractId) },
      include: {
        room: {
          include: {
            dormitory: true
          }
        }
      }
    })

    if (!contract) {
      return res.status(404).json({
        message: "Contract not found"
      })
    }

    /* ================= OWNER ================= */

    const owner = await prisma.owner.findUnique({
      where: {
        id: contract.room.dormitory.ownerId
      }
    })

    if (!owner) {
      return res.status(404).json({
        message: "Owner not found"
      })
    }

    /* ================= CREATE TICKET ================= */

    const ticket = await prisma.ticket.create({

      data: {

        contractId: contract.id,
        memberId: contract.userId,
        ownerId: owner.userId,

        title,
        type: type || "GENERAL",

        messages: {
          create: {
            senderId: userId,
            message
          }
        }

      },

      include: {
        messages: true
      }

    })

    res.status(201).json(ticket)

  }

  catch (error) {

    console.error("CREATE TICKET ERROR:", error)

    res.status(500).json({
      message: "Failed to create ticket"
    })

  }

}


/* =====================================================
   GET MEMBER TICKETS
===================================================== */

export const getMemberTickets = async (req: Request, res: Response) => {

  try {

    const userId = (req as any).user?.id

    const tickets = await prisma.ticket.findMany({

      where: {
        memberId: userId
      },

      include: {
        contract: {
          include: {
            room: true
          }
        }
      },

      orderBy: {
        createdAt: "desc"
      }

    })

    res.json(tickets)

  }

  catch (error) {

    console.error("GET MEMBER TICKETS ERROR:", error)

    res.status(500).json({
      message: "Failed to fetch tickets"
    })

  }

}


/* =====================================================
   GET OWNER TICKETS
===================================================== */

export const getOwnerTickets = async (req: Request, res: Response) => {

  try {

    const userId = (req as any).user?.id

    const tickets = await prisma.ticket.findMany({

      where: {
        ownerId: userId
      },

      include: {

        contract: {
          include: {
            room: true,
            user: true
          }
        }

      },

      orderBy: {
        createdAt: "desc"
      }

    })

    res.json(tickets)

  }

  catch (error) {

    console.error("GET OWNER TICKETS ERROR:", error)

    res.status(500).json({
      message: "Failed to fetch tickets"
    })

  }

}


/* =====================================================
   GET SINGLE TICKET
===================================================== */

export const getTicketById = async (req: Request, res: Response) => {

  try {

    const ticketId = Number(req.params.id)

    const ticket = await prisma.ticket.findUnique({

      where: { id: ticketId },

      include: {

        contract: {
          include: {
            room: true,
            user: true
          }
        },

        messages: {
          include: {
            sender: true
          },
          orderBy: {
            createdAt: "asc"
          }
        }

      }

    })

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found"
      })
    }

    res.json(ticket)

  }

  catch (error) {

    console.error("GET TICKET ERROR:", error)

    res.status(500).json({
      message: "Failed to fetch ticket"
    })

  }

}


/* =====================================================
   UPDATE TICKET STATUS (Owner)
===================================================== */

export const updateTicketStatus = async (req: Request, res: Response) => {

  try {

    const ticketId = Number(req.params.id)

    const { status } = req.body

    const ticket = await prisma.ticket.update({

      where: { id: ticketId },

      data: {
        status
      }

    })

    res.json(ticket)

  }

  catch (error) {

    console.error("UPDATE TICKET ERROR:", error)

    res.status(500).json({
      message: "Failed to update ticket"
    })

  }

}