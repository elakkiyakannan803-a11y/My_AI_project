import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ApplicationSubmission {
  applicationId: string;
  consentGiven: boolean;
  consentText: string;
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await adminClient.auth.getUser(token);

    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userData.user.email_confirmed_at) {
      return new Response(
        JSON.stringify({ error: "Email not verified. Please verify your email before submitting." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ApplicationSubmission = await req.json();
    const { applicationId, consentGiven, consentText } = body;

    if (!applicationId) {
      return new Response(
        JSON.stringify({ error: "Application ID is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!consentGiven) {
      return new Response(
        JSON.stringify({ error: "Consent must be given to submit the application." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: application, error: appError } = await adminClient
      .from("loan_applications")
      .select("*")
      .eq("id", applicationId)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (appError || !application) {
      return new Response(
        JSON.stringify({ error: "Application not found." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (application.status !== "Draft" && application.status !== "Additional Documents Required") {
      return new Response(
        JSON.stringify({ error: "This application has already been submitted." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: documents } = await adminClient
      .from("application_documents")
      .select("*")
      .eq("application_id", applicationId)
      .eq("user_id", userData.user.id);

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one document must be uploaded before submission." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: scheme } = await adminClient
      .from("loan_schemes")
      .select("required_documents")
      .eq("id", application.scheme_id)
      .maybeSingle();

    if (scheme && scheme.required_documents) {
      const uploadedTypes = new Set(documents.map((d) => d.document_type));
      const missing = scheme.required_documents.filter((doc: string) => !uploadedTypes.has(doc));
      if (missing.length > 0) {
        return new Response(
          JSON.stringify({ error: `Missing required documents: ${missing.join(", ")}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Update application with consent and status
    await adminClient
      .from("loan_applications")
      .update({
        status: "Submitted",
        consent_given: true,
        consent_text: consentText,
      })
      .eq("id", applicationId);

    // Add status history entry
    await adminClient
      .from("application_status_history")
      .insert({
        application_id: applicationId,
        user_id: userData.user.id,
        status: "Submitted",
        note: "Application submitted by user with consent.",
      });

    // Check if lender has a configured API endpoint
    let lenderApiConfigured = false;
    let lenderReference: string | null = null;

    if (application.lender_id) {
      const { data: lender } = await adminClient
        .from("lenders")
        .select("api_endpoint, name")
        .eq("id", application.lender_id)
        .maybeSingle();

      if (lender && lender.api_endpoint) {
        lenderApiConfigured = true;

        try {
          const lenderResponse = await fetch(lender.api_endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              applicationId,
              loanType: application.loan_type,
              requestedAmount: application.requested_amount,
              tenureMonths: application.tenure_months,
              purpose: application.purpose,
              employmentType: application.employment_type,
              monthlyIncome: application.monthly_income,
              creditScore: application.credit_score,
              documentCount: documents.length,
            }),
          });

          if (lenderResponse.ok) {
            const lenderData = await lenderResponse.json();
            lenderReference = lenderData.referenceNumber || lenderData.reference || null;

            if (lenderReference) {
              await adminClient
                .from("loan_applications")
                .update({
                  status: "Received by Lender",
                  lender_reference: lenderReference,
                })
                .eq("id", applicationId);

              await adminClient
                .from("application_status_history")
                .insert({
                  application_id: applicationId,
                  user_id: userData.user.id,
                  status: "Received by Lender",
                  note: `Application received by ${lender.name}. Reference: ${lenderReference}`,
                });
            }
          }
        } catch (lenderErr) {
          console.error("Lender API call failed:", lenderErr);
        }
      }
    }

    if (!lenderApiConfigured) {
      return new Response(
        JSON.stringify({
          success: true,
          applicationId,
          status: "Submitted",
          lenderApiConnected: false,
          message: "Application ready for lender submission. A verified lender integration is required to submit this application electronically.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        applicationId,
        status: lenderReference ? "Received by Lender" : "Submitted",
        lenderReference,
        lenderApiConnected: true,
        message: lenderReference
          ? `Application submitted to lender. Reference number: ${lenderReference}`
          : "Application submitted. Waiting for lender confirmation.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Application submission error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred during submission." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
