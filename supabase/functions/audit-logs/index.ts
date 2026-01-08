import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuditRequest {
  action: "query" | "log" | "export";
  filters?: {
    user_id?: string;
    entity_type?: string;
    entity_id?: string;
    action_type?: string;
    start_date?: string;
    end_date?: string;
  };
  log_data?: {
    action: string;
    entity_type?: string;
    entity_id?: string;
    metadata?: any;
  };
  page?: number;
  limit?: number;
  format?: "json" | "csv";
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
    const requestData: AuditRequest = await req.json();
    const { action, filters, log_data, page = 1, limit = 100, format = "json" } = requestData;

    // Check if user is admin for query/export
    const { data: isAdmin } = await supabaseAdmin
      .rpc("has_role", { _user_id: currentUserId, _role: "admin" });

    switch (action) {
      case "log": {
        // Any authenticated user can log their own activity
        if (!log_data?.action) {
          return new Response(
            JSON.stringify({ error: "action required in log_data" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { error } = await supabaseAdmin
          .from("user_activity_logs")
          .insert({
            user_id: currentUserId,
            action: log_data.action,
            entity_type: log_data.entity_type,
            entity_id: log_data.entity_id,
            metadata: log_data.metadata,
            ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip"),
            user_agent: req.headers.get("user-agent"),
          });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { status: 201, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "query": {
        if (!isAdmin) {
          // Non-admins can only query their own logs
          const { data: logs, error, count } = await supabaseAdmin
            .from("user_activity_logs")
            .select("*", { count: "exact" })
            .eq("user_id", currentUserId)
            .order("created_at", { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

          if (error) throw error;

          return new Response(
            JSON.stringify({
              logs,
              pagination: { page, limit, total: count, total_pages: Math.ceil((count || 0) / limit) },
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Admin can query all logs with filters
        let query = supabaseAdmin
          .from("user_activity_logs")
          .select("*, profiles:user_id(full_name, email)", { count: "exact" });

        if (filters?.user_id) query = query.eq("user_id", filters.user_id);
        if (filters?.entity_type) query = query.eq("entity_type", filters.entity_type);
        if (filters?.entity_id) query = query.eq("entity_id", filters.entity_id);
        if (filters?.action_type) query = query.eq("action", filters.action_type);
        if (filters?.start_date) query = query.gte("created_at", filters.start_date);
        if (filters?.end_date) query = query.lte("created_at", filters.end_date);

        const { data: logs, error, count } = await query
          .order("created_at", { ascending: false })
          .range((page - 1) * limit, page * limit - 1);

        if (error) throw error;

        return new Response(
          JSON.stringify({
            logs,
            pagination: { page, limit, total: count, total_pages: Math.ceil((count || 0) / limit) },
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "export": {
        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Fetch all logs with filters (max 10000)
        let query = supabaseAdmin
          .from("user_activity_logs")
          .select("*, profiles:user_id(full_name, email)");

        if (filters?.user_id) query = query.eq("user_id", filters.user_id);
        if (filters?.entity_type) query = query.eq("entity_type", filters.entity_type);
        if (filters?.action_type) query = query.eq("action", filters.action_type);
        if (filters?.start_date) query = query.gte("created_at", filters.start_date);
        if (filters?.end_date) query = query.lte("created_at", filters.end_date);

        const { data: logs, error } = await query
          .order("created_at", { ascending: false })
          .limit(10000);

        if (error) throw error;

        if (format === "csv") {
          const headers = ["id", "user_id", "user_name", "action", "entity_type", "entity_id", "created_at"];
          const csvRows = [headers.join(",")];

          for (const log of logs || []) {
            const row = [
              log.id,
              log.user_id,
              (log.profiles as any)?.full_name || "",
              log.action,
              log.entity_type || "",
              log.entity_id || "",
              log.created_at,
            ];
            csvRows.push(row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
          }

          return new Response(csvRows.join("\n"), {
            status: 200,
            headers: {
              "Content-Type": "text/csv",
              "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.csv"`,
              ...corsHeaders,
            },
          });
        }

        return new Response(
          JSON.stringify({ logs }),
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
    console.error("Error in audit-logs:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
