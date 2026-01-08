import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusChangeRequest {
  report_id: string;
  old_status: string;
  new_status: string;
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: "Pending Review",
    in_progress: "In Progress",
    resolved: "Resolved",
    rejected: "Rejected",
  };
  return labels[status] || status;
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: "#f59e0b",
    in_progress: "#3b82f6",
    resolved: "#22c55e",
    rejected: "#ef4444",
  };
  return colors[status] || "#6b7280";
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { report_id, old_status, new_status }: StatusChangeRequest = await req.json();

    console.log(`Processing status change for report ${report_id}: ${old_status} -> ${new_status}`);

    // Fetch report details with user info
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("id, description, category, user_id")
      .eq("id", report_id)
      .single();

    if (reportError || !report) {
      console.error("Error fetching report:", reportError);
      return new Response(
        JSON.stringify({ error: "Report not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!report.user_id) {
      console.log("Report has no associated user, skipping email");
      return new Response(
        JSON.stringify({ message: "No user associated with report" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch user email from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", report.user_id)
      .single();

    if (profileError || !profile?.email) {
      console.error("Error fetching profile:", profileError);
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const newStatusLabel = getStatusLabel(new_status);
    const statusColor = getStatusColor(new_status);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #18181b; margin: 0 0 24px 0; font-size: 24px;">Report Status Update</h1>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Hello ${profile.full_name || "Citizen"},
              </p>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Your report has been updated to a new status:
              </p>
              
              <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
                <p style="margin: 0 0 12px 0; color: #71717a; font-size: 14px;">Report Category</p>
                <p style="margin: 0 0 20px 0; color: #18181b; font-size: 16px; font-weight: 500; text-transform: capitalize;">${report.category.replace(/_/g, " ")}</p>
                
                <p style="margin: 0 0 12px 0; color: #71717a; font-size: 14px;">Description</p>
                <p style="margin: 0 0 20px 0; color: #18181b; font-size: 16px;">${report.description.substring(0, 100)}${report.description.length > 100 ? "..." : ""}</p>
                
                <p style="margin: 0 0 12px 0; color: #71717a; font-size: 14px;">New Status</p>
                <span style="display: inline-block; background-color: ${statusColor}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 500;">
                  ${newStatusLabel}
                </span>
              </div>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0;">
                Thank you for helping improve our community!
              </p>
              
              <p style="color: #71717a; font-size: 14px; margin: 32px 0 0 0;">
                — The CleanAfricaNow Team
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "CleanAfricaNow <onboarding@resend.dev>",
      to: [profile.email],
      subject: `Report Status Updated: ${newStatusLabel}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, email_id: emailResponse.data?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-status-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
