import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AssignmentRequest {
  action: "list" | "create" | "accept" | "decline" | "complete" | "update" | "my_assignments" | "team_assignments";
  assignment_id?: string;
  report_id?: string;
  assigned_to?: string;
  organization_id?: string;
  notes?: string;
  due_date?: string;
  status?: string;
  page?: number;
  limit?: number;
}

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
    const requestData: AssignmentRequest = await req.json();
    const { action, assignment_id, report_id, assigned_to, organization_id, notes, due_date, status, page = 1, limit = 50 } = requestData;

    // Get user roles
    const { data: userRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUserId);
    
    const roles = userRoles?.map(r => r.role) || [];
    const isAdmin = roles.includes("admin");
    const canAssign = isAdmin || roles.includes("municipality") || roles.includes("ngo");

    switch (action) {
      case "list": {
        // List assignments for a report
        if (!report_id) {
          return new Response(
            JSON.stringify({ error: "report_id required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { data: assignments, error } = await supabaseAdmin
          .from("report_assignments")
          .select(`
            *,
            assigned_user:assigned_to (id, full_name, email, avatar_url),
            assigner:assigned_by (id, full_name),
            organizations:organization_id (id, name, type)
          `)
          .eq("report_id", report_id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        return new Response(
          JSON.stringify({ assignments }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "create": {
        if (!report_id || !assigned_to) {
          return new Response(
            JSON.stringify({ error: "report_id and assigned_to required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        if (!canAssign) {
          return new Response(
            JSON.stringify({ error: "Permission denied" }),
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Verify report exists and get city_id
        const { data: report } = await supabaseAdmin
          .from("reports")
          .select("id, city_id, status")
          .eq("id", report_id)
          .single();

        if (!report) {
          return new Response(
            JSON.stringify({ error: "Report not found" }),
            { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Check territory access
        if (!isAdmin && report.city_id) {
          const { data: canAccess } = await supabaseAdmin
            .rpc("can_access_territory", { _user_id: currentUserId, _city_id: report.city_id });
          
          if (!canAccess) {
            return new Response(
              JSON.stringify({ error: "No access to this territory" }),
              { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }
        }

        // Create assignment
        const { data: assignment, error } = await supabaseAdmin
          .from("report_assignments")
          .insert({
            report_id,
            assigned_to,
            assigned_by: currentUserId,
            organization_id: organization_id || null,
            notes,
            due_date: due_date || null,
            status: "pending",
          })
          .select(`
            *,
            assigned_user:assigned_to (id, full_name, email)
          `)
          .single();

        if (error) throw error;

        // Update report status to assigned if pending
        if (report.status === "pending" || report.status === "verified") {
          await supabaseAdmin
            .from("reports")
            .update({ status: "assigned" })
            .eq("id", report_id);
        }

        // Log history
        await supabaseAdmin.from("report_history").insert({
          report_id,
          changed_by: currentUserId,
          action: "assigned",
          notes: `Assigned to ${(assignment.assigned_user as any)?.full_name || assigned_to}`,
        });

        // Log activity
        await supabaseAdmin.from("user_activity_logs").insert({
          user_id: currentUserId,
          action: "report_assigned",
          entity_type: "assignment",
          entity_id: assignment.id,
          metadata: { report_id, assigned_to },
        });

        return new Response(
          JSON.stringify({ success: true, assignment }),
          { status: 201, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "accept": {
        if (!assignment_id) {
          return new Response(
            JSON.stringify({ error: "assignment_id required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Verify ownership
        const { data: assignment } = await supabaseAdmin
          .from("report_assignments")
          .select("assigned_to, report_id")
          .eq("id", assignment_id)
          .single();

        if (!assignment || assignment.assigned_to !== currentUserId) {
          return new Response(
            JSON.stringify({ error: "Assignment not found or not yours" }),
            { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { data: updated, error } = await supabaseAdmin
          .from("report_assignments")
          .update({ status: "accepted" })
          .eq("id", assignment_id)
          .select()
          .single();

        if (error) throw error;

        // Update report to in_progress
        await supabaseAdmin
          .from("reports")
          .update({ status: "in_progress" })
          .eq("id", assignment.report_id);

        return new Response(
          JSON.stringify({ success: true, assignment: updated }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "decline": {
        if (!assignment_id) {
          return new Response(
            JSON.stringify({ error: "assignment_id required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { data: assignment } = await supabaseAdmin
          .from("report_assignments")
          .select("assigned_to")
          .eq("id", assignment_id)
          .single();

        if (!assignment || assignment.assigned_to !== currentUserId) {
          return new Response(
            JSON.stringify({ error: "Assignment not found or not yours" }),
            { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { data: updated, error } = await supabaseAdmin
          .from("report_assignments")
          .update({ status: "declined", notes })
          .eq("id", assignment_id)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, assignment: updated }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "complete": {
        if (!assignment_id) {
          return new Response(
            JSON.stringify({ error: "assignment_id required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { data: assignment } = await supabaseAdmin
          .from("report_assignments")
          .select("assigned_to, report_id")
          .eq("id", assignment_id)
          .single();

        if (!assignment || assignment.assigned_to !== currentUserId) {
          return new Response(
            JSON.stringify({ error: "Assignment not found or not yours" }),
            { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { data: updated, error } = await supabaseAdmin
          .from("report_assignments")
          .update({ 
            status: "completed",
            completed_at: new Date().toISOString(),
            notes,
          })
          .eq("id", assignment_id)
          .select()
          .single();

        if (error) throw error;

        // Check if all assignments are complete
        const { data: pendingAssignments } = await supabaseAdmin
          .from("report_assignments")
          .select("id")
          .eq("report_id", assignment.report_id)
          .in("status", ["pending", "accepted", "in_progress"]);

        // If no pending assignments, mark report as resolved
        if (!pendingAssignments?.length) {
          await supabaseAdmin
            .from("reports")
            .update({ 
              status: "resolved",
              resolved_at: new Date().toISOString(),
              resolved_by: currentUserId,
            })
            .eq("id", assignment.report_id);
        }

        // Update user impact score
        await supabaseAdmin.rpc("increment_user_impact", { user_id: currentUserId });

        return new Response(
          JSON.stringify({ success: true, assignment: updated }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "my_assignments": {
        const offset = (page - 1) * limit;
        
        let query = supabaseAdmin
          .from("report_assignments")
          .select(`
            *,
            reports:report_id (id, description, category, status, priority, city_id, sla_due_date, photos,
              cities:city_id (name)
            )
          `, { count: "exact" })
          .eq("assigned_to", currentUserId);

        if (status) {
          query = query.eq("status", status);
        }

        const { data: assignments, error, count } = await query
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        return new Response(
          JSON.stringify({
            assignments,
            pagination: { page, limit, total: count, total_pages: Math.ceil((count || 0) / limit) },
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "team_assignments": {
        if (!organization_id) {
          return new Response(
            JSON.stringify({ error: "organization_id required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Verify user is org member
        const { data: isMember } = await supabaseAdmin
          .rpc("is_org_member", { _user_id: currentUserId, _org_id: organization_id });

        if (!isMember && !isAdmin) {
          return new Response(
            JSON.stringify({ error: "Not a member of this organization" }),
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const offset = (page - 1) * limit;

        const { data: assignments, error, count } = await supabaseAdmin
          .from("report_assignments")
          .select(`
            *,
            assigned_user:assigned_to (id, full_name, email),
            reports:report_id (id, description, category, status, priority, sla_due_date)
          `, { count: "exact" })
          .eq("organization_id", organization_id)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        return new Response(
          JSON.stringify({
            assignments,
            pagination: { page, limit, total: count, total_pages: Math.ceil((count || 0) / limit) },
          }),
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
    console.error("Error in report-assignments:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
