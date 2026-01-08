import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  registrationId: string;
  status: "approved" | "rejected";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { registrationId, status }: NotificationRequest = await req.json();

    // Get registration details with event info
    const { data: registration, error: regError } = await supabase
      .from("event_registrations")
      .select(`
        *,
        collection_events (
          title,
          event_date,
          location_name
        )
      `)
      .eq("id", registrationId)
      .single();

    if (regError || !registration) {
      throw new Error("Registration not found");
    }

    const event = registration.collection_events;
    const eventDate = new Date(event.event_date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const isApproved = status === "approved";
    const subject = isApproved
      ? `✅ Your registration for "${event.title}" has been approved!`
      : `Registration Update for "${event.title}"`;

    const htmlContent = isApproved
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a;">🎉 Registration Approved!</h1>
          <p>Dear ${registration.participant_name},</p>
          <p>Great news! Your registration for the following event has been <strong style="color: #16a34a;">approved</strong>:</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0; color: #166534;">${event.title}</h2>
            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${eventDate}</p>
            <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${event.location_name || "TBA"}</p>
            <p style="margin: 5px 0;"><strong>👥 Participant Type:</strong> ${registration.participant_type}</p>
            ${registration.team_size ? `<p style="margin: 5px 0;"><strong>👤 Team Size:</strong> ${registration.team_size}</p>` : ""}
          </div>
          <p>We look forward to seeing you at the event! Please arrive on time and bring any necessary equipment.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The EcoTrack Team</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">Registration Update</h1>
          <p>Dear ${registration.participant_name},</p>
          <p>We regret to inform you that your registration for the following event could not be approved at this time:</p>
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0; color: #991b1b;">${event.title}</h2>
            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${eventDate}</p>
            <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${event.location_name || "TBA"}</p>
          </div>
          <p>This could be due to capacity limits or other scheduling constraints. We encourage you to:</p>
          <ul>
            <li>Check for other upcoming events in your area</li>
            <li>Register for future collection events</li>
            <li>Contact us if you have any questions</li>
          </ul>
          <p>Thank you for your interest in environmental conservation!</p>
          <p>Best regards,<br>The EcoTrack Team</p>
        </div>
      `;

    const emailResponse = await resend.emails.send({
      from: "EcoTrack <onboarding@resend.dev>",
      to: [registration.contact_email],
      subject,
      html: htmlContent,
    });

    console.log("Registration notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending registration notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
