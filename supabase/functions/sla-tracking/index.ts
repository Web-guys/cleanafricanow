import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SLARequest {
  action: "dashboard" | "overdue" | "due_soon" | "update_sla" | "stats" | "by_territory";
  report_id?: string;
  city_id?: string;
  organization_id?: string;
  sla_due_date?: string;
  priority?: string;
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
    const requestData: SLARequest = await req.json();
    const { action, report_id, city_id, organization_id, sla_due_date, priority, page = 1, limit = 50 } = requestData;

    // Get user roles
    const { data: userRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUserId);
    
    const roles = userRoles?.map(r => r.role) || [];
    const isAdmin = roles.includes("admin");
    const canViewSLA = isAdmin || roles.includes("municipality") || roles.includes("ngo");

    if (!canViewSLA) {
      return new Response(
        JSON.stringify({ error: "Permission denied" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const now = new Date().toISOString();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    switch (action) {
      case "dashboard": {
        // Get SLA overview
        const { data: allReports } = await supabaseAdmin
          .from("reports")
          .select("id, status, sla_due_date, priority, city_id")
          .not("status", "in", "(resolved,rejected)")
          .eq("is_deleted", false);

        const stats = {
          total_active: allReports?.length || 0,
          overdue: 0,
          due_today: 0,
          due_this_week: 0,
          on_track: 0,
          by_priority: { critical: 0, high: 0, medium: 0, low: 0 },
          by_status: { pending: 0, verified: 0, assigned: 0, in_progress: 0 },
        };

        const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        for (const report of allReports || []) {
          // Count by priority
          if (report.priority) {
            stats.by_priority[report.priority as keyof typeof stats.by_priority]++;
          }

          // Count by status
          if (report.status) {
            stats.by_status[report.status as keyof typeof stats.by_status] = 
              (stats.by_status[report.status as keyof typeof stats.by_status] || 0) + 1;
          }

          // SLA tracking
          if (report.sla_due_date) {
            const dueDate = new Date(report.sla_due_date);
            if (dueDate < new Date()) {
              stats.overdue++;
            } else if (dueDate <= today) {
              stats.due_today++;
            } else if (dueDate <= weekFromNow) {
              stats.due_this_week++;
            } else {
              stats.on_track++;
            }
          }
        }

        return new Response(
          JSON.stringify({ stats }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "overdue": {
        const offset = (page - 1) * limit;

        let query = supabaseAdmin
          .from("reports")
          .select(`
            *,
            cities:city_id (id, name)
          `, { count: "exact" })
          .lt("sla_due_date", now)
          .not("status", "in", "(resolved,rejected)")
          .eq("is_deleted", false);

        if (city_id) query = query.eq("city_id", city_id);

        const { data: reports, error, count } = await query
          .order("sla_due_date", { ascending: true })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        // Calculate overdue duration
        const reportsWithOverdue = reports?.map(r => ({
          ...r,
          overdue_hours: Math.round((Date.now() - new Date(r.sla_due_date).getTime()) / (1000 * 60 * 60)),
        }));

        return new Response(
          JSON.stringify({
            reports: reportsWithOverdue,
            pagination: { page, limit, total: count, total_pages: Math.ceil((count || 0) / limit) },
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "due_soon": {
        const offset = (page - 1) * limit;

        let query = supabaseAdmin
          .from("reports")
          .select(`
            *,
            cities:city_id (id, name)
          `, { count: "exact" })
          .gte("sla_due_date", now)
          .lte("sla_due_date", tomorrow)
          .not("status", "in", "(resolved,rejected)")
          .eq("is_deleted", false);

        if (city_id) query = query.eq("city_id", city_id);

        const { data: reports, error, count } = await query
          .order("sla_due_date", { ascending: true })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        // Calculate hours remaining
        const reportsWithRemaining = reports?.map(r => ({
          ...r,
          hours_remaining: Math.round((new Date(r.sla_due_date).getTime() - Date.now()) / (1000 * 60 * 60)),
        }));

        return new Response(
          JSON.stringify({
            reports: reportsWithRemaining,
            pagination: { page, limit, total: count, total_pages: Math.ceil((count || 0) / limit) },
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "update_sla": {
        if (!report_id) {
          return new Response(
            JSON.stringify({ error: "report_id required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const updateData: any = {};
        
        if (sla_due_date) {
          updateData.sla_due_date = sla_due_date;
        }
        
        if (priority) {
          updateData.priority = priority;
          // Recalculate SLA based on priority if no explicit date
          if (!sla_due_date) {
            const hours = priority === "critical" ? 24 : priority === "high" ? 72 : priority === "medium" ? 168 : 336;
            updateData.sla_due_date = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
          }
        }

        const { data: updated, error } = await supabaseAdmin
          .from("reports")
          .update(updateData)
          .eq("id", report_id)
          .select()
          .single();

        if (error) throw error;

        // Log history
        await supabaseAdmin.from("report_history").insert({
          report_id,
          changed_by: currentUserId,
          action: "sla_updated",
          notes: `SLA updated: priority=${priority || 'unchanged'}, due=${updateData.sla_due_date}`,
        });

        return new Response(
          JSON.stringify({ success: true, report: updated }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "stats": {
        // Get historical SLA performance
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const { data: resolvedReports } = await supabaseAdmin
          .from("reports")
          .select("id, created_at, resolved_at, sla_due_date, priority, city_id")
          .eq("status", "resolved")
          .gte("resolved_at", thirtyDaysAgo);

        let totalResolved = 0;
        let resolvedOnTime = 0;
        let totalResolutionTime = 0;
        const byPriority: Record<string, { total: number; on_time: number }> = {
          critical: { total: 0, on_time: 0 },
          high: { total: 0, on_time: 0 },
          medium: { total: 0, on_time: 0 },
          low: { total: 0, on_time: 0 },
        };

        for (const report of resolvedReports || []) {
          totalResolved++;
          const resolvedAt = new Date(report.resolved_at);
          const createdAt = new Date(report.created_at);
          const slaDue = report.sla_due_date ? new Date(report.sla_due_date) : null;

          totalResolutionTime += resolvedAt.getTime() - createdAt.getTime();

          if (slaDue && resolvedAt <= slaDue) {
            resolvedOnTime++;
          }

          if (report.priority) {
            byPriority[report.priority].total++;
            if (slaDue && resolvedAt <= slaDue) {
              byPriority[report.priority].on_time++;
            }
          }
        }

        const avgResolutionHours = totalResolved > 0 
          ? Math.round(totalResolutionTime / totalResolved / (1000 * 60 * 60))
          : 0;

        const slaComplianceRate = totalResolved > 0 
          ? Math.round((resolvedOnTime / totalResolved) * 100)
          : 0;

        return new Response(
          JSON.stringify({
            period: "30_days",
            total_resolved: totalResolved,
            resolved_on_time: resolvedOnTime,
            sla_compliance_rate: slaComplianceRate,
            avg_resolution_hours: avgResolutionHours,
            by_priority: Object.entries(byPriority).map(([priority, data]) => ({
              priority,
              total: data.total,
              on_time: data.on_time,
              compliance_rate: data.total > 0 ? Math.round((data.on_time / data.total) * 100) : 0,
            })),
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "by_territory": {
        // Get SLA stats grouped by city
        const { data: reports } = await supabaseAdmin
          .from("reports")
          .select("id, status, sla_due_date, city_id, cities:city_id(name)")
          .not("status", "in", "(resolved,rejected)")
          .eq("is_deleted", false);

        const byCity: Record<string, { 
          city_id: string;
          city_name: string;
          total: number;
          overdue: number;
          due_soon: number;
          on_track: number;
        }> = {};

        for (const report of reports || []) {
          if (!report.city_id) continue;
          
          if (!byCity[report.city_id]) {
            byCity[report.city_id] = {
              city_id: report.city_id,
              city_name: (report.cities as any)?.name || "Unknown",
              total: 0,
              overdue: 0,
              due_soon: 0,
              on_track: 0,
            };
          }

          byCity[report.city_id].total++;

          if (report.sla_due_date) {
            const dueDate = new Date(report.sla_due_date);
            if (dueDate < new Date()) {
              byCity[report.city_id].overdue++;
            } else if (dueDate < new Date(Date.now() + 24 * 60 * 60 * 1000)) {
              byCity[report.city_id].due_soon++;
            } else {
              byCity[report.city_id].on_track++;
            }
          }
        }

        return new Response(
          JSON.stringify({ territories: Object.values(byCity) }),
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
    console.error("Error in sla-tracking:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
