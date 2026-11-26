import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function getSupabaseConfig() {
  const url =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  return { url: url.trim(), key: key.trim() };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key && url.startsWith("http"));
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseConfig();
  if (!url || !key || !url.startsWith("http")) {
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
