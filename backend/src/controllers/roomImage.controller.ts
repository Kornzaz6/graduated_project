import { Request, Response } from "express"
import prisma from "../prisma"
import { uploadImage } from "../utils/uploadImage"

export const uploadRoomImage = async (req:Request,res:Response)=>{

  try{

    const roomId = Number(req.params.id)

    if(!req.file){
      return res.status(400).json({message:"No image"})
    }

    const imageUrl = await uploadImage(req.file)

    const image = await prisma.roomImage.create({
      data:{
        roomId,
        imageUrl
      }
    })

    res.json(image)

  }catch(err){
    console.error(err)
    res.status(500).json({message:"Upload failed"})
  }

}

export const deleteRoomImage = async (req:Request,res:Response)=>{

  try{

    const imageId = Number(req.params.imageId)

    await prisma.roomImage.delete({
      where:{
        id:imageId
      }
    })

    res.json({message:"Image deleted"})

  }catch(err){

    console.error(err)
    res.status(500).json({message:"Delete failed"})

  }

}