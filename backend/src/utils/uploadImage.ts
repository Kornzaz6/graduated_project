import { supabase } from "./supabase"

export const uploadImage = async (file: Express.Multer.File) => {

  const fileName = `${Date.now()}-${file.originalname}`

  const { data, error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET!)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype
    })

  if (error) {
    throw new Error(error.message)
  }

  const { data: publicUrl } = supabase.storage
    .from(process.env.SUPABASE_BUCKET!)
    .getPublicUrl(fileName)

  return publicUrl.publicUrl
}