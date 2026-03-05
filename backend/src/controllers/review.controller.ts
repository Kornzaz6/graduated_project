import { Request, Response } from "express"
import prisma from "../prisma"

export const createReview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const { dormitoryId, rating, comment } = req.body

    if (!rating || !dormitoryId) {
      return res.status(400).json({
        message: "rating and dormitoryId are required"
      })
    }

    /* check user เคยเช่าหอหรือยัง */

    const lease = await prisma.leaseContract.findFirst({
      where: {
        userId,
        room: {
          dormitoryId
        }
      }
    })

    if (!lease) {
      return res.status(403).json({
        message: "You can only review dormitories you have stayed"
      })
    }

    /* check รีวิวซ้ำ */

    const existingReview = await prisma.review.findFirst({
  where: {
    userId,
    dormitoryId
  }
})

    if (existingReview) {
      return res.status(400).json({
        message: "You have already reviewed this dormitory"
      })
    }

    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        userId,
        dormitoryId
      }
    })

    res.status(201).json(review)

  } catch (error) {
    console.error("CREATE REVIEW ERROR", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const getDormitoryReviews = async (req: Request, res: Response) => {
  try {

    const dormitoryId = Number(req.params.dormitoryId)

    const reviews = await prisma.review.findMany({
      where: {
        dormitoryId
      },
      include: {
        user: {
          select: {
            username: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        reviewDate: "desc"
      }
    })

    res.json(reviews)

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
}

export const deleteReview = async (req: Request, res: Response) => {
  try {

    const userId = (req as any).user.id
    const reviewId = Number(req.params.id)

    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    })

    if (!review) {
      return res.status(404).json({ message: "Review not found" })
    }

    if (review.userId !== userId) {
      return res.status(403).json({
        message: "You cannot delete this review"
      })
    }

    await prisma.review.delete({
      where: { id: reviewId }
    })

    res.json({ message: "Review deleted" })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
}