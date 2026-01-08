import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WorkflowRequest {
  action: "get" | "update_status" | "verify" | "reject" | "resolve" | "reopen" | "bulk_update" | "get_history";
  report_id?: string;
  report_ids?: string[];
  new_status?: string;
  notes?: string;
  priority?: string;
}

// Valid status transitions
const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["verified", "in_progress", "assigned", "rejected"],
  verified: ["in_progress", "assigned", "rejected"],
  assigned: ["in_progress", "resolved", "rejected"],
  in_progress: ["resolved", "rejected", "pending"],
  resolved: ["pending", "in_progress"], // Can reopen
  rejected: ["pending"], // Can reopen
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const currentUserId = claimsData.claims.sub;
    const requestData: WorkflowRequest = await req.json();
    const { action, report_id, report_ids, new_status, notes, priority } = requestData;

    // Get user roles
    const { data: userRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUserId);
    
    const roles = userRoles?.map(r => r.role) || [];
    const isAdmin = roles.includes("admin");
    const canManageReports = isAdmin || roles.includes("municipality") || roles.includes("ngo");

    switch (action) {
      case "get": {
        if (!report_id) {
          return new Response(
            JSON.stringify({ error: "report_id required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { data: report, error } = await supabaseAdmin
          .from("reports")
          .select(`
            *,
            cities:city_id (id, name, country),
            profiles:user_id (id, full_name, email)
          `)
          .eq("id", report_id)
          .single();

        if (error) throw error;

        // Get assignments
        const { data: assignments } = await supabaseAdmin
          .from("report_assignments")
          .select(`
            *,
            assigned_user:assigned_to (id, full_name, email),
            assigner:assigned_by (id, full_name)
          `)
          .eq("report_id", report_id)
          .order("created_at", { ascending: false });

        // Calculate SLA status
        const slaStatus = report.sla_due_date ? 
          new Date(report.sla_due_date) < new Date() ? "overdue" :
          new Date(report.sla_due_date) < new Date(Date.now() + 24 * 60 * 60 * 1000) ? "due_soon" : "on_track"
          : null;

        // Get allowed transitions
        const allowedTransitions = canManageReports ? 
          STATUS_TRANSITIONS[report.status] || [] : [];

        return new Response(
          JSON.stringify({
            ...report,
            assignments,
            sla_status: slaStatus,
            allowed_transitions: allowedTransitions,
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "update_status": {
        if (!report_id || !new_status) {
          return new Response(
            JSON.stringify({ error: "report_id and new_status required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Get current report
        const { data: report, error: fetchError } = await supabaseAdmin
          .from("reports")
          .select("status, city_id, user_id")
          .eq("id", report_id)
          .single();

        if (fetchError || !report) {
          return new Response(
            JSON.stringify({ error: "Report not found" }),
            { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Check permissions
        const isOwner = report.user_id === currentUserId;
        if (!canManageReports && !isOwner) {
          return new Response(
            JSON.stringify({ error: "Permission denied" }),
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Check territory access for municipality/ngo
        if (!isAdmin && canManageReports && report.city_id) {
          const { data: canAccess } = await supabaseAdmin
            .rpc("can_access_territory", { _user_id: currentUserId, _city_id: report.city_id });
          
          if (!canAccess) {
            return new Response(
              JSON.stringify({ error: "No access to this territory" }),
              { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }
        }

        // Validate transition
        const allowedTransitions = STATUS_TRANSITIONS[report.status] || [];
        if (!allowedTransitions.includes(new_status)) {
          return new Response(
            JSON.stringify({ 
              error: `Invalid transition from ${report.status} to ${new_status}`,
              allowed: allowedTransitions 
            }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Prepare update
        const updateData: any = { status: new_status };
        
        if (new_status === "verified") {
          updateData.verified_at = new Date().toISOString();
          updateData.verified_by = currentUserId;
        } else if (new_status === "resolved") {
          updateData.resolved_at = new Date().toISOString();
          updateData.resolved_by = currentUserId;
        }

        if (priority) {
          updateData.priority = priority;
        }

        // Update report
        const { data: updated, error: updateError } = await supabaseAdmin
          .from("reports")
          .update(updateData)
          .eq("id", report_id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Log history (trigger handles this automatically, but add notes)
        if (notes) {
          await supabaseAdmin.from("report_history").insert({
            report_id,
            changed_by: currentUserId,
            action: "note_added",
            notes,
          });
        }

        // Log activity
        await supabaseAdmin.from("user_activity_logs").insert({
          user_id: currentUserId,
          action: "report_status_updated",
          entity_type: "report",
          entity_id: report_id,
          metadata: { old_status: report.status, new_status, notes },
        });

        return new Response(
          JSON.stringify({ success: true, report: updated }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "verify": {
        if (!report_id) {
          return new Response(
            JSON.stringify({ error: "report_id required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        if (!canManageReports) {
          return new Response(
            JSON.stringify({ error: "Permission denied" }),
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { data: updated, error } = await supabaseAdmin
          .from("reports")
          .update({
            status: "verified",
            verified_at: new Date().toISOString(),
            verified_by: currentUserId,
          })
          .eq("id", report_id)
          .eq("status", "pending")
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, report: updated }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "reject": {
        if (!report_id) {
          return new Response(
            JSON.stringify({ error: "report_id required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        if (!canManageReports) {
          return new Response(
            JSON.stringify({ error: "Permission denied" }),
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { data: updated, error } = await supabaseAdmin
          .from("reports")
          .update({ status: "rejected" })
          .eq("id", report_id)
          .select()
          .single();

        if (error) throw error;

        // Add rejection note
        if (notes) {
          await supabaseAdmin.from("report_history").insert({
            report_id,
            changed_by: currentUserId,
            action: "rejected",
            notes,
          });
        }

        return new Response(
          JSON.stringify({ success: true, report: updated }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "resolve": {
        if (!report_id) {
          return new Response(
            JSON.stringify({ error: "report_id required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { data: updated, error } = await supabaseAdmin
          .from("reports")
          .update({
            status: "resolved",
            resolved_at: new Date().toISOString(),
            resolved_by: currentUserId,
          })
          .eq("id", report_id)
          .select()
          .single();

        if (error) throw error;

        // Complete any active assignments
        await supabaseAdmin
          .from("report_assignments")
          .update({ 
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("report_id", report_id)
          .in("status", ["pending", "accepted", "in_progress"]);

        return new Response(
          JSON.stringify({ success: true, report: updated }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "reopen": {
        if (!report_id) {
          return new Response(
            JSON.stringify({ error: "report_id required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        if (!canManageReports) {
          return new Response(
            JSON.stringify({ error: "Permission denied" }),
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { data: updated, error } = await supabaseAdmin
          .from("reports")
          .update({
            status: "pending",
            resolved_at: null,
            resolved_by: null,
          })
          .eq("id", report_id)
          .in("status", ["resolved", "rejected"])
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, report: updated }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "bulk_update": {
        if (!report_ids?.length || !new_status) {
          return new Response(
            JSON.stringify({ error: "report_ids array and new_status required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        if (!canManageReports) {
          return new Response(
            JSON.stringify({ error: "Permission denied" }),
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const updateData: any = { status: new_status };
        
        if (new_status === "verified") {
          updateData.verified_at = new Date().toISOString();
          updateData.verified_by = currentUserId;
        } else if (new_status === "resolved") {
          updateData.resolved_at = new Date().toISOString();
          updateData.resolved_by = currentUserId;
        }

        const { data: updated, error } = await supabaseAdmin
          .from("reports")
          .update(updateData)
          .in("id", report_ids)
          .select();

        if (error) throw error;

        // Log activity
        await supabaseAdmin.from("user_activity_logs").insert({
          user_id: currentUserId,
          action: "bulk_status_update",
          entity_type: "report",
          metadata: { report_ids, new_status, count: updated?.length },
        });

        return new Response(
          JSON.stringify({ success: true, updated_count: updated?.length }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "get_history": {
        if (!report_id) {
          return new Response(
            JSON.stringify({ error: "report_id required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { data: history, error } = await supabaseAdmin
          .from("report_history")
          .select(`
            *,
            profiles:changed_by (id, full_name)
          `)
          .eq("report_id", report_id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        return new Response(
          JSON.stringify({ history }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
    }
  } catch (error: any) {
    console.error("Error in report-workflow:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
