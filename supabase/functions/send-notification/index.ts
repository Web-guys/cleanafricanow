import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  user_id: string;
  title: string;
  message: string;
  type?: "info" | "warning" | "success" | "error";
  category?: "report" | "sla" | "assignment" | "system" | "admin";
  action_url?: string;
  send_email?: boolean;
  metadata?: Record<string, unknown>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller is authorized (admin, municipality, or ngo)
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user has required role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const userRoles = roles?.map((r) => r.role) || [];
    if (!userRoles.some((r) => ["admin", "municipality", "ngo"].includes(r))) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: NotificationRequest = await req.json();
    const {
      user_id,
      title,
      message,
      type = "info",
      category = "system",
      action_url,
      send_email = false,
      metadata = {},
    } = body;

    // Insert in-app notification
    const { data: notification, error: insertError } = await supabase
      .from("notifications")
      .insert({
        user_id,
        title,
        message,
        type,
        category,
        action_url,
        metadata,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting notification:", insertError);
      throw insertError;
    }

    // Send email if requested
    if (send_email) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        // Get user email
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", user_id)
          .single();

        // Check user's notification preferences
        const { data: prefs } = await supabase
          .from("notification_preferences")
          .select("email_enabled")
          .eq("user_id", user_id)
          .single();

        if (profile?.email && (prefs?.email_enabled !== false)) {
          // Use Resend API directly via fetch
          try {
            const emailResponse = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "CleanAfricaNow <notifications@cleanafricanow.com>",
                to: [profile.email],
                subject: title,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #22c55e;">${title}</h2>
                    <p>${message}</p>
                    ${action_url ? `<a href="https://cleanafricanow.com${action_url}" style="display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 8px;">View Details</a>` : ""}
                    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
                    <p style="color: #6b7280; font-size: 12px;">
                      You received this email because you have notifications enabled for CleanAfricaNow.
                      <a href="https://cleanafricanow.com/profile#notifications">Manage preferences</a>
                    </p>
                  </div>
                `,
              }),
            });
            
            if (emailResponse.ok) {
              console.log("Email sent to:", profile.email);
            } else {
              console.error("Email send failed:", await emailResponse.text());
            }
          } catch (emailError) {
            console.error("Error sending email:", emailError);
            // Don't fail the whole request if email fails
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, notification }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
