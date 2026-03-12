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

/* ================= TICKETS ================= */

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

router.get(
  "/tickets/owner",
  authMiddleware,
  getOwnerTickets
)

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

/* ================= MESSAGES ================= */

router.post(
  "/messages",
  authMiddleware,
  sendMessage
)

export default router