import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SLABreachRequest {
  report_id: string;
  sla_due_date: string;
  priority: string;
  category: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { report_id, sla_due_date, priority, category }: SLABreachRequest = await req.json();

    console.log(`Processing SLA breach notification for report ${report_id}`);

    // Get assigned users for this report
    const { data: assignments, error: assignmentError } = await supabase
      .from("report_assignments")
      .select(`
        assigned_to,
        organization_id,
        profiles:assigned_to (email, full_name)
      `)
      .eq("report_id", report_id)
      .eq("status", "assigned");

    if (assignmentError) {
      console.error("Error fetching assignments:", assignmentError);
    }

    // Get admins for notification
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminIds = adminRoles?.map(r => r.user_id) || [];

    const { data: adminProfiles } = await supabase
      .from("profiles")
      .select("email, full_name")
      .in("id", adminIds);

    // Combine recipients
    const recipients: { email: string; name: string }[] = [];
    
    assignments?.forEach(a => {
      if ((a.profiles as any)?.email) {
        recipients.push({
          email: (a.profiles as any).email,
          name: (a.profiles as any).full_name || "Team Member"
        });
      }
    });

    adminProfiles?.forEach(p => {
      if (p.email && !recipients.find(r => r.email === p.email)) {
        recipients.push({
          email: p.email,
          name: p.full_name || "Admin"
        });
      }
    });

    if (!recipients.length) {
      console.log("No recipients found for SLA breach notification");
      return new Response(
        JSON.stringify({ message: "No recipients found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const priorityColors: Record<string, string> = {
      critical: "#ef4444",
      high: "#f97316",
      medium: "#eab308",
      low: "#22c55e",
    };

    const dueDate = new Date(sla_due_date);
    const isOverdue = dueDate < new Date();
    const hoursOverdue = isOverdue 
      ? Math.round((Date.now() - dueDate.getTime()) / (1000 * 60 * 60)) 
      : 0;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #fef2f2;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-left: 4px solid ${priorityColors[priority] || '#ef4444'};">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                <span style="font-size: 24px;">⚠️</span>
                <h1 style="color: #dc2626; margin: 0; font-size: 24px;">SLA Breach Alert</h1>
              </div>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                A report has ${isOverdue ? 'breached' : 'is about to breach'} its SLA deadline and requires immediate attention.
              </p>
              
              <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin: 0 0 24px 0; border: 1px solid #fecaca;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                  <div>
                    <p style="margin: 0 0 4px 0; color: #71717a; font-size: 12px; text-transform: uppercase;">Priority</p>
                    <span style="display: inline-block; background-color: ${priorityColors[priority]}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                      ${priority}
                    </span>
                  </div>
                  <div style="text-align: right;">
                    <p style="margin: 0 0 4px 0; color: #71717a; font-size: 12px; text-transform: uppercase;">Category</p>
                    <p style="margin: 0; color: #18181b; font-size: 14px; font-weight: 500; text-transform: capitalize;">${category.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                
                <div style="border-top: 1px solid #fecaca; padding-top: 16px;">
                  <p style="margin: 0 0 4px 0; color: #71717a; font-size: 12px; text-transform: uppercase;">SLA Deadline</p>
                  <p style="margin: 0; color: #dc2626; font-size: 18px; font-weight: 600;">
                    ${dueDate.toLocaleString()}
                    ${isOverdue ? ` (${hoursOverdue}h overdue)` : ''}
                  </p>
                </div>
              </div>

              <p style="color: #52525b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                Please take action immediately to address this report and update its status.
              </p>
              
              <p style="color: #71717a; font-size: 12px; margin: 24px 0 0 0;">
                — CleanAfricaNow SLA Monitoring System
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send to all recipients
    const emailPromises = recipients.map(recipient =>
      resend.emails.send({
        from: "CleanAfricaNow <onboarding@resend.dev>",
        to: [recipient.email],
        subject: `⚠️ SLA Breach Alert: ${priority.toUpperCase()} priority ${category.replace(/_/g, ' ')} report`,
        html: emailHtml,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;

    console.log(`Sent ${successful}/${recipients.length} SLA breach notifications`);

    return new Response(
      JSON.stringify({ success: true, sent: successful, total: recipients.length }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-sla-breach-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
