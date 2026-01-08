import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExportRequest {
  action: "reports" | "users" | "organizations" | "summary";
  format: "json" | "csv";
  filters?: {
    start_date?: string;
    end_date?: string;
    city_id?: string;
    status?: string;
    category?: string;
    priority?: string;
  };
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

    // Check admin access
    const { data: isAdmin } = await supabaseAdmin
      .rpc("has_role", { _user_id: currentUserId, _role: "admin" });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { action, format, filters }: ExportRequest = await req.json();

    const toCSV = (data: any[], headers: string[]): string => {
      const rows = [headers.join(",")];
      for (const item of data) {
        const row = headers.map(h => {
          const value = item[h];
          if (value === null || value === undefined) return "";
          const str = String(value).replace(/"/g, '""');
          return `"${str}"`;
        });
        rows.push(row.join(","));
      }
      return rows.join("\n");
    };

    switch (action) {
      case "reports": {
        let query = supabaseAdmin
          .from("reports")
          .select(`
            id, description, category, status, priority,
            latitude, longitude, created_at, updated_at,
            verified_at, resolved_at, sla_due_date,
            cities:city_id (name, country),
            profiles:user_id (full_name, email)
          `)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(10000);

        if (filters?.start_date) query = query.gte("created_at", filters.start_date);
        if (filters?.end_date) query = query.lte("created_at", filters.end_date);
        if (filters?.city_id) query = query.eq("city_id", filters.city_id);
        if (filters?.status) query = query.eq("status", filters.status);
        if (filters?.category) query = query.eq("category", filters.category);
        if (filters?.priority) query = query.eq("priority", filters.priority);

        const { data: reports, error } = await query;
        if (error) throw error;

        // Flatten for export
        const flatReports = reports?.map(r => ({
          id: r.id,
          description: r.description?.substring(0, 200),
          category: r.category,
          status: r.status,
          priority: r.priority,
          latitude: r.latitude,
          longitude: r.longitude,
          city: (r.cities as any)?.name || "",
          country: (r.cities as any)?.country || "",
          reporter_name: (r.profiles as any)?.full_name || "",
          reporter_email: (r.profiles as any)?.email || "",
          created_at: r.created_at,
          verified_at: r.verified_at,
          resolved_at: r.resolved_at,
          sla_due_date: r.sla_due_date,
        }));

        if (format === "csv") {
          const headers = ["id", "description", "category", "status", "priority", "latitude", "longitude", "city", "country", "reporter_name", "reporter_email", "created_at", "verified_at", "resolved_at", "sla_due_date"];
          const csv = toCSV(flatReports || [], headers);
          
          return new Response(csv, {
            status: 200,
            headers: {
              "Content-Type": "text/csv",
              "Content-Disposition": `attachment; filename="reports-${new Date().toISOString().split("T")[0]}.csv"`,
              ...corsHeaders,
            },
          });
        }

        return new Response(
          JSON.stringify({ reports: flatReports }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "users": {
        const { data: users, error } = await supabaseAdmin
          .from("profiles")
          .select(`
            id, full_name, email, phone, city_id,
            impact_score, reports_count, is_active,
            created_at, last_login_at, preferred_language,
            cities:city_id (name)
          `)
          .order("created_at", { ascending: false })
          .limit(10000);

        if (error) throw error;

        // Get roles
        const { data: allRoles } = await supabaseAdmin
          .from("user_roles")
          .select("user_id, role");

        const rolesByUser: Record<string, string[]> = {};
        allRoles?.forEach(r => {
          if (!rolesByUser[r.user_id]) rolesByUser[r.user_id] = [];
          rolesByUser[r.user_id].push(r.role);
        });

        const flatUsers = users?.map(u => ({
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          phone: u.phone || "",
          city: (u.cities as any)?.name || "",
          roles: rolesByUser[u.id]?.join("; ") || "",
          impact_score: u.impact_score,
          reports_count: u.reports_count,
          is_active: u.is_active,
          created_at: u.created_at,
          last_login_at: u.last_login_at,
          preferred_language: u.preferred_language,
        }));

        if (format === "csv") {
          const headers = ["id", "full_name", "email", "phone", "city", "roles", "impact_score", "reports_count", "is_active", "created_at", "last_login_at", "preferred_language"];
          const csv = toCSV(flatUsers || [], headers);
          
          return new Response(csv, {
            status: 200,
            headers: {
              "Content-Type": "text/csv",
              "Content-Disposition": `attachment; filename="users-${new Date().toISOString().split("T")[0]}.csv"`,
              ...corsHeaders,
            },
          });
        }

        return new Response(
          JSON.stringify({ users: flatUsers }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "organizations": {
        const { data: orgs, error } = await supabaseAdmin
          .from("organizations")
          .select("*")
          .order("name");

        if (error) throw error;

        // Get member counts
        const { data: memberCounts } = await supabaseAdmin
          .from("organization_members")
          .select("organization_id")
          .eq("is_active", true);

        const countByOrg: Record<string, number> = {};
        memberCounts?.forEach(m => {
          countByOrg[m.organization_id] = (countByOrg[m.organization_id] || 0) + 1;
        });

        const flatOrgs = orgs?.map(o => ({
          id: o.id,
          name: o.name,
          type: o.type,
          email: o.email || "",
          phone: o.phone || "",
          website: o.website || "",
          address: o.address || "",
          member_count: countByOrg[o.id] || 0,
          is_active: o.is_active,
          created_at: o.created_at,
        }));

        if (format === "csv") {
          const headers = ["id", "name", "type", "email", "phone", "website", "address", "member_count", "is_active", "created_at"];
          const csv = toCSV(flatOrgs || [], headers);
          
          return new Response(csv, {
            status: 200,
            headers: {
              "Content-Type": "text/csv",
              "Content-Disposition": `attachment; filename="organizations-${new Date().toISOString().split("T")[0]}.csv"`,
              ...corsHeaders,
            },
          });
        }

        return new Response(
          JSON.stringify({ organizations: flatOrgs }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "summary": {
        // Get comprehensive summary stats
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [
          { count: totalReports },
          { count: totalUsers },
          { count: totalOrgs },
          { count: reportsLast30Days },
          { count: resolvedLast30Days },
          { data: reportsByStatus },
          { data: reportsByCategory },
          { data: reportsByCity },
        ] = await Promise.all([
          supabaseAdmin.from("reports").select("*", { count: "exact", head: true }).eq("is_deleted", false),
          supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
          supabaseAdmin.from("organizations").select("*", { count: "exact", head: true }).eq("is_active", true),
          supabaseAdmin.from("reports").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
          supabaseAdmin.from("reports").select("*", { count: "exact", head: true }).eq("status", "resolved").gte("resolved_at", thirtyDaysAgo),
          supabaseAdmin.from("reports").select("status").eq("is_deleted", false),
          supabaseAdmin.from("reports").select("category").eq("is_deleted", false),
          supabaseAdmin.from("reports").select("city_id, cities:city_id(name)").eq("is_deleted", false),
        ]);

        // Aggregate stats
        const statusCounts: Record<string, number> = {};
        reportsByStatus?.forEach(r => {
          statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
        });

        const categoryCounts: Record<string, number> = {};
        reportsByCategory?.forEach(r => {
          categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
        });

        const cityCounts: Record<string, number> = {};
        reportsByCity?.forEach(r => {
          const cityName = (r.cities as any)?.name || "Unknown";
          cityCounts[cityName] = (cityCounts[cityName] || 0) + 1;
        });

        const summary = {
          generated_at: new Date().toISOString(),
          totals: {
            reports: totalReports,
            users: totalUsers,
            organizations: totalOrgs,
          },
          last_30_days: {
            new_reports: reportsLast30Days,
            resolved_reports: resolvedLast30Days,
          },
          reports_by_status: statusCounts,
          reports_by_category: categoryCounts,
          top_cities: Object.entries(cityCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([city, count]) => ({ city, count })),
        };

        return new Response(
          JSON.stringify(summary),
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
    console.error("Error in analytics-export:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
