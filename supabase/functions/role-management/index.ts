import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RoleRequest {
  action: "list" | "assign" | "revoke" | "list_users";
  user_id?: string;
  role?: string;
  page?: number;
  limit?: number;
}

const VALID_ROLES = ["admin", "municipality", "citizen", "tourist", "ngo", "volunteer", "partner"];

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

    // Use service role for admin operations
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

    // Check if user is admin
    const { data: isAdmin } = await supabaseAdmin
      .rpc("has_role", { _user_id: currentUserId, _role: "admin" });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { action, user_id, role, page = 1, limit = 50 }: RoleRequest = await req.json();

    switch (action) {
      case "list": {
        // List all roles for a user
        if (!user_id) {
          return new Response(
            JSON.stringify({ error: "user_id required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { data: roles, error } = await supabaseAdmin
          .from("user_roles")
          .select("id, role, created_at")
          .eq("user_id", user_id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ user_id, roles }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "assign": {
        if (!user_id || !role) {
          return new Response(
            JSON.stringify({ error: "user_id and role required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        if (!VALID_ROLES.includes(role)) {
          return new Response(
            JSON.stringify({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Check if role already exists
        const { data: existing } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("user_id", user_id)
          .eq("role", role)
          .single();

        if (existing) {
          return new Response(
            JSON.stringify({ message: "Role already assigned", role_id: existing.id }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { data: newRole, error } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id, role })
          .select()
          .single();

        if (error) throw error;

        // Log the action
        await supabaseAdmin
          .from("user_activity_logs")
          .insert({
            user_id: currentUserId,
            action: "role_assigned",
            entity_type: "user",
            entity_id: user_id,
            metadata: { role, assigned_by: currentUserId },
          });

        return new Response(
          JSON.stringify({ success: true, role: newRole }),
          { status: 201, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "revoke": {
        if (!user_id || !role) {
          return new Response(
            JSON.stringify({ error: "user_id and role required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Prevent revoking own admin role
        if (user_id === currentUserId && role === "admin") {
          return new Response(
            JSON.stringify({ error: "Cannot revoke your own admin role" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { error } = await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", user_id)
          .eq("role", role);

        if (error) throw error;

        // Log the action
        await supabaseAdmin
          .from("user_activity_logs")
          .insert({
            user_id: currentUserId,
            action: "role_revoked",
            entity_type: "user",
            entity_id: user_id,
            metadata: { role, revoked_by: currentUserId },
          });

        return new Response(
          JSON.stringify({ success: true, message: `Role ${role} revoked from user` }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "list_users": {
        // List users with their roles (paginated)
        const offset = (page - 1) * limit;

        const { data: profiles, error: profilesError, count } = await supabaseAdmin
          .from("profiles")
          .select("id, full_name, email, city_id, is_active, created_at", { count: "exact" })
          .range(offset, offset + limit - 1)
          .order("created_at", { ascending: false });

        if (profilesError) throw profilesError;

        // Get roles for all users
        const userIds = profiles?.map(p => p.id) || [];
        const { data: allRoles } = await supabaseAdmin
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds);

        // Group roles by user
        const rolesByUser: Record<string, string[]> = {};
        allRoles?.forEach(r => {
          if (!rolesByUser[r.user_id]) rolesByUser[r.user_id] = [];
          rolesByUser[r.user_id].push(r.role);
        });

        const usersWithRoles = profiles?.map(p => ({
          ...p,
          roles: rolesByUser[p.id] || [],
        }));

        return new Response(
          JSON.stringify({
            users: usersWithRoles,
            pagination: {
              page,
              limit,
              total: count,
              total_pages: Math.ceil((count || 0) / limit),
            },
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
    console.error("Error in role-management:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
