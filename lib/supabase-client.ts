import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Server-side client with service role
export const supabaseServer = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function getAuthUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function signOut() {
  return await supabase.auth.signOut();
}
