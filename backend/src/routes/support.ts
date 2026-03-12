import { Router } from "express"

import {
  createTicket,
  getMemberTickets,
  getOwnerTickets,
  getTicketById,
  updateTicketStatus
} from "../controllers/ticket.controller"

import {
  sendMessage
} from "../controllers/message.controller"

import { authMiddleware } from "../middleware/auth"

const router = Router()

/* =====================================================
   MEMBER TICKETS
===================================================== */

router.post(
  "/tickets",
  authMiddleware,
  createTicket
)

router.get(
  "/tickets/member",
  authMiddleware,
  getMemberTickets
)

/* =====================================================
   OWNER TICKETS
===================================================== */

router.get(
  "/tickets/owner",
  authMiddleware,
  getOwnerTickets
)

/* =====================================================
   SINGLE TICKET
===================================================== */

router.get(
  "/tickets/:id",
  authMiddleware,
  getTicketById
)

router.patch(
  "/tickets/:id/status",
  authMiddleware,
  updateTicketStatus
)

/* =====================================================
   MESSAGES
===================================================== */

router.post(
  "/tickets/:id/messages",
  authMiddleware,
  sendMessage
)

export default router