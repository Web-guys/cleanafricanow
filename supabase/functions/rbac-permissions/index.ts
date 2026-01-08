import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PermissionRequest {
  action: "check" | "list" | "matrix";
  permission?: string;
  resource_type?: string;
  resource_id?: string;
}

// Permission definitions by role
const PERMISSIONS = {
  admin: [
    "users:read", "users:create", "users:update", "users:delete",
    "reports:read", "reports:create", "reports:update", "reports:delete", "reports:assign", "reports:verify",
    "organizations:read", "organizations:create", "organizations:update", "organizations:delete",
    "cities:read", "cities:create", "cities:update", "cities:delete",
    "settings:read", "settings:update",
    "analytics:read", "analytics:export",
    "logs:read",
  ],
  municipality: [
    "users:read",
    "reports:read", "reports:update", "reports:assign", "reports:verify",
    "organizations:read",
    "cities:read",
    "analytics:read", "analytics:export",
  ],
  ngo: [
    "users:read",
    "reports:read", "reports:update", "reports:assign",
    "organizations:read",
    "cities:read",
    "analytics:read",
  ],
  partner: [
    "users:read",
    "reports:read", "reports:update",
    "organizations:read",
    "analytics:read",
  ],
  volunteer: [
    "reports:read", "reports:create", "reports:update",
    "cities:read",
  ],
  citizen: [
    "reports:read", "reports:create",
    "cities:read",
  ],
  tourist: [
    "reports:read", "reports:create",
    "cities:read",
  ],
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = claimsData.claims.sub;
    const { action, permission, resource_type, resource_id }: PermissionRequest = await req.json();

    // Get user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user roles" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const roles = userRoles?.map(r => r.role) || ["citizen"];

    // Get all permissions for user's roles
    const userPermissions = new Set<string>();
    for (const role of roles) {
      const rolePerms = PERMISSIONS[role as keyof typeof PERMISSIONS] || [];
      rolePerms.forEach(p => userPermissions.add(p));
    }

    switch (action) {
      case "check": {
        if (!permission) {
          return new Response(
            JSON.stringify({ error: "Permission required for check action" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        let hasPermission = userPermissions.has(permission);

        // If checking territory-based permission, verify access
        if (hasPermission && resource_type === "report" && resource_id) {
          const { data: report } = await supabase
            .from("reports")
            .select("city_id")
            .eq("id", resource_id)
            .single();

          if (report?.city_id && !roles.includes("admin")) {
            const { data: canAccess } = await supabase
              .rpc("can_access_territory", { _user_id: userId, _city_id: report.city_id });
            hasPermission = canAccess || false;
          }
        }

        return new Response(
          JSON.stringify({ 
            has_permission: hasPermission,
            permission,
            roles,
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "list": {
        return new Response(
          JSON.stringify({
            user_id: userId,
            roles,
            permissions: Array.from(userPermissions),
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "matrix": {
        // Return full permission matrix (admin only)
        if (!roles.includes("admin")) {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        return new Response(
          JSON.stringify({ matrix: PERMISSIONS }),
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
    console.error("Error in rbac-permissions:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
