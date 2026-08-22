import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "resumes";

function getClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

export async function uploadResumeFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string | null> {
  const client = getClient();
  if (!client) {
    console.warn("[Storage] Supabase not configured — skipping file upload");
    return null;
  }

  const key = `${Date.now()}-${fileName}`;
  const { error } = await client.storage
    .from(BUCKET)
    .upload(key, buffer, { contentType: mimeType, upsert: false });

  if (error) {
    console.error("[Storage] Upload failed:", error.message);
    return null;
  }

  const { data } = client.storage.from(BUCKET).getPublicUrl(key);
  return data.publicUrl;
}

export async function deleteResumeFile(fileUrl: string): Promise<void> {
  const client = getClient();
  if (!client || !fileUrl) return;

  const key = fileUrl.split("/").pop();
  if (!key) return;
  await client.storage.from(BUCKET).remove([key]);
}