import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_RESENDS = 3;

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(email)) return false;
  const [local, domain] = email.split("@");
  if (!local || local.length > 64) return false;
  if (!domain || domain.length > 253) return false;
  if (domain.startsWith(".") || domain.endsWith(".")) return false;
  if (domain.includes("..")) return false;
  return true;
}

async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  identifier: string,
  action: string
): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("auth_rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("identifier", identifier)
    .eq("action", action)
    .gte("created_at", windowStart);
  return (count ?? 0) >= RATE_LIMIT_MAX_RESENDS;
}

async function recordRateLimit(
  supabase: ReturnType<typeof createClient>,
  identifier: string,
  action: string
): Promise<void> {
  await supabase.from("auth_rate_limits").insert({ identifier, action });
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  await supabase.from("auth_rate_limits").delete().lt("created_at", cutoff);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { email } = await req.json();

    if (!email || !isValidEmail(String(email).toLowerCase().trim())) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid email address." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const clientIp = getClientIp(req);

    const ipLimited = await checkRateLimit(adminClient, clientIp, "resend");
    if (ipLimited) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailLimited = await checkRateLimit(adminClient, normalizedEmail, "resend");
    if (emailLimited) {
      return new Response(
        JSON.stringify({ error: "Too many resend attempts for this email. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await recordRateLimit(adminClient, clientIp, "resend");
    await recordRateLimit(adminClient, normalizedEmail, "resend");

    const { data: userList, error: listError } = await adminClient.auth.admin.listUsers();

    if (listError) {
      return new Response(
        JSON.stringify({ error: "Unable to process request. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const existingUser = userList.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (!existingUser) {
      return new Response(
        JSON.stringify({ message: "If an account exists, a verification email has been sent." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (existingUser.email_confirmed_at) {
      return new Response(
        JSON.stringify({ error: "This email is already verified. Please sign in." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      normalizedEmail,
      { data: existingUser.user_metadata }
    );

    if (inviteError) {
      console.error("Resend invite error:", inviteError.message);
      return new Response(
        JSON.stringify({ error: "Unable to send verification email. Please try again later." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Verification email sent. Please check your inbox." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Resend verification error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
