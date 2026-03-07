import { Request, Response } from "express"
import prisma from "../prisma"

export const getContractById = async (req: Request, res: Response) => {

  const contractId = Number(req.params.id)

  try {

    const contract = await prisma.leaseContract.findUnique({

      where: { id: contractId },

      include: {

        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true
          }
        },

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

    res.json(contract)

  } catch (error) {

    console.error("Get contract error:", error)

    res.status(500).json({
      message: "Internal server error"
    })

  }

}