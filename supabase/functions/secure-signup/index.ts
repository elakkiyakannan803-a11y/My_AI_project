import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

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

  const { count, error } = await supabase
    .from("auth_rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("identifier", identifier)
    .eq("action", action)
    .gte("created_at", windowStart);

  if (error) {
    console.error("Rate limit check error:", error.message);
    return true;
  }

  return (count ?? 0) >= RATE_LIMIT_MAX_ATTEMPTS;
}

async function recordRateLimit(
  supabase: ReturnType<typeof createClient>,
  identifier: string,
  action: string
): Promise<void> {
  await supabase
    .from("auth_rate_limits")
    .insert({ identifier, action });

  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  await supabase
    .from("auth_rate_limits")
    .delete()
    .lt("created_at", cutoff);
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

    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({ error: "Name, email, and password are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid name (2-100 characters)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid email address." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters long." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length > 128) {
      return new Response(
        JSON.stringify({ error: "Password is too long (maximum 128 characters)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientIp = getClientIp(req);

    const ipLimited = await checkRateLimit(adminClient, clientIp, "signup");
    if (ipLimited) {
      return new Response(
        JSON.stringify({ error: "Too many signup attempts. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailLimited = await checkRateLimit(adminClient, normalizedEmail, "signup");
    if (emailLimited) {
      return new Response(
        JSON.stringify({ error: "Too many signup attempts for this email. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await recordRateLimit(adminClient, clientIp, "signup");
    await recordRateLimit(adminClient, normalizedEmail, "signup");

    const { data, error: signUpError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password,
      user_metadata: { name: name.trim() },
      email_confirm: false,
    });

    if (signUpError) {
      const errMsg = signUpError.message.toLowerCase();
      if (errMsg.includes("already") || errMsg.includes("exists") || errMsg.includes("registered")) {
        return new Response(
          JSON.stringify({ error: "This email is already registered." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (errMsg.includes("password")) {
        return new Response(
          JSON.stringify({ error: "Password does not meet security requirements." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Unable to create account. Please try again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({ error: "Unable to create account. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      normalizedEmail,
      { data: { name: name.trim() } }
    );

    if (inviteError) {
      console.error("Invite email error:", inviteError.message);
    }

    return new Response(
      JSON.stringify({
        message: "Verification email sent. Please check your inbox.",
        userId: data.user.id,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Signup error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
