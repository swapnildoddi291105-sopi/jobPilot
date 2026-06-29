import { supabaseAdmin } from "./supabase.js"

const BUCKET_NAME = "resumes"

export function getStorageUrl() {
  return `${process.env.SUPABASE_URL}/storage/v1/object/public`
}

export function getPublicUrl(path) {
  return `${getStorageUrl()}/${BUCKET_NAME}/${path}`
}

export async function ensureBucket() {
  if (!supabaseAdmin) {
    console.warn("[storage] Supabase admin not available, skipping bucket creation")
    return
  }
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  if (buckets?.find((b) => b.name === BUCKET_NAME)) return

  const { error } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
    public: true,
  })
  if (error) {
    console.warn("[storage] Failed to create bucket:", error.message)
  } else {
    console.log("[storage] Created bucket:", BUCKET_NAME)
  }
}

export async function uploadFile(path, fileBuffer, mimeType) {
  if (!supabaseAdmin) throw new Error("Storage not available")
  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(path, fileBuffer, { contentType: mimeType, upsert: true })
  if (error) throw error
}

export async function downloadFile(path) {
  if (!supabaseAdmin) throw new Error("Storage not available")
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .download(path)
  if (error) throw error
  return Buffer.from(await data.arrayBuffer())
}

export async function deleteFile(path) {
  if (!supabaseAdmin) return
  await supabaseAdmin.storage.from(BUCKET_NAME).remove([path])
}
