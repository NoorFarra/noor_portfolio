import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const invalidUrl =
  !SUPABASE_URL ||
  SUPABASE_URL.includes("PASTE_YOUR") ||
  SUPABASE_URL.startsWith("postgresql://") ||
  !/^https:\/\/[\w.-]+\.supabase\.co$/i.test(SUPABASE_URL.trim());

const invalidKey =
  !SUPABASE_ANON_KEY ||
  SUPABASE_ANON_KEY.includes("PASTE_YOUR") ||
  SUPABASE_ANON_KEY.length < 50;

const hasMissingConfig = invalidUrl || invalidKey;

export const supabase = hasMissingConfig
  ? null
  : createClient(SUPABASE_URL.trim(), SUPABASE_ANON_KEY.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

export function ensureSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase config is missing or invalid. Open js/config.js and add your project URL and anon key."
    );
  }
}
