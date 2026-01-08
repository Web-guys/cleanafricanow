import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrgRequest {
  action: "list" | "get" | "create" | "update" | "delete" | 
          "add_member" | "remove_member" | "update_member" | "list_members" |
          "add_territory" | "remove_territory" | "list_territories";
  organization_id?: string;
  data?: any;
  user_id?: string;
  city_id?: string;
  role?: string;
  page?: number;
  limit?: number;
}

const VALID_ORG_TYPES = ["municipality", "ngo", "government", "private", "international"];
const VALID_MEMBER_ROLES = ["admin", "manager", "member", "volunteer"];

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
    const requestData: OrgRequest = await req.json();
    const { action, organization_id, data, user_id, city_id, role, page = 1, limit = 50 } = requestData;

    // Check if user is admin
    const { data: isAdmin } = await supabaseAdmin
      .rpc("has_role", { _user_id: currentUserId, _role: "admin" });

    // Check if user is org admin (for non-admin users)
    const isOrgAdmin = organization_id ? 
      await supabaseAdmin.rpc("is_org_admin", { _user_id: currentUserId, _org_id: organization_id }).then(r => r.data) : 
      false;

    switch (action) {
      case "list": {
        const offset = (page - 1) * limit;
        const { data: orgs, error, count } = await supabaseAdmin
          .from("organizations")
          .select("*", { count: "exact" })
          .eq("is_active", true)
          .range(offset, offset + limit - 1)
          .order("name");

        if (error) throw error;

        return new Response(
          JSON.stringify({
            organizations: orgs,
            pagination: { page, limit, total: count, total_pages: Math.ceil((count || 0) / limit) },
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "get": {
        if (!organization_id) {
          return new Response(
            JSON.stringify({ error: "organization_id required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { data: org, error } = await supabaseAdmin
          .from("organizations")
          .select("*")
          .eq("id", organization_id)
          .single();

        if (error) throw error;

        // Get member count
        const { count: memberCount } = await supabaseAdmin
          .from("organization_members")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", organization_id)
          .eq("is_active", true);

        // Get territory count
        const { count: territoryCount } = await supabaseAdmin
          .from("organization_territories")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", organization_id);

        return new Response(
          JSON.stringify({ ...org, member_count: memberCount, territory_count: territoryCount }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "create": {
        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        if (!data?.name || !data?.type) {
          return new Response(
            JSON.stringify({ error: "name and type required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        if (!VALID_ORG_TYPES.includes(data.type)) {
          return new Response(
            JSON.stringify({ error: `Invalid type. Must be one of: ${VALID_ORG_TYPES.join(", ")}` }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { data: newOrg, error } = await supabaseAdmin
          .from("organizations")
          .insert({
            name: data.name,
            type: data.type,
            description: data.description,
            logo_url: data.logo_url,
            website: data.website,
            email: data.email,
            phone: data.phone,
            address: data.address,
          })
          .select()
          .single();

        if (error) throw error;

        // Log action
        await supabaseAdmin.from("user_activity_logs").insert({
          user_id: currentUserId,
          action: "organization_created",
          entity_type: "organization",
          entity_id: newOrg.id,
          metadata: { name: data.name, type: data.type },
        });

        return new Response(
          JSON.stringify({ success: true, organization: newOrg }),
          { status: 201, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "update": {
        if (!organization_id) {
          return new Response(
            JSON.stringify({ error: "organization_id required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        if (!isAdmin && !isOrgAdmin) {
          return new Response(
            JSON.stringify({ error: "Admin or org admin access required" }),
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const updateData: any = {};
        const allowedFields = ["name", "description", "logo_url", "website", "email", "phone", "address"];
        
        // Only admin can change type or is_active
        if (isAdmin) {
          allowedFields.push("type", "is_active");
        }

        for (const field of allowedFields) {
          if (data?.[field] !== undefined) updateData[field] = data[field];
        }

        const { data: updated, error } = await supabaseAdmin
          .from("organizations")
          .update(updateData)
          .eq("id", organization_id)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, organization: updated }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "delete": {
        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        if (!organization_id) {
          return new Response(
            JSON.stringify({ error: "organization_id required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Soft delete
        const { error } = await supabaseAdmin
          .from("organizations")
          .update({ is_active: false })
          .eq("id", organization_id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, message: "Organization deactivated" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "add_member": {
        if (!organization_id || !user_id) {
          return new Response(
            JSON.stringify({ error: "organization_id and user_id required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        if (!isAdmin && !isOrgAdmin) {
          return new Response(
            JSON.stringify({ error: "Admin or org admin access required" }),
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const memberRole = role && VALID_MEMBER_ROLES.includes(role) ? role : "member";

        const { data: member, error } = await supabaseAdmin
          .from("organization_members")
          .upsert({
            organization_id,
            user_id,
            role: memberRole,
            is_active: true,
          }, { onConflict: "organization_id,user_id" })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, member }),
          { status: 201, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "remove_member": {
        if (!organization_id || !user_id) {
          return new Response(
            JSON.stringify({ error: "organization_id and user_id required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        if (!isAdmin && !isOrgAdmin) {
          return new Response(
            JSON.stringify({ error: "Admin or org admin access required" }),
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { error } = await supabaseAdmin
          .from("organization_members")
          .update({ is_active: false })
          .eq("organization_id", organization_id)
          .eq("user_id", user_id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, message: "Member removed" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "list_members": {
        if (!organization_id) {
          return new Response(
            JSON.stringify({ error: "organization_id required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { data: members, error } = await supabaseAdmin
          .from("organization_members")
          .select(`
            id, role, joined_at, is_active,
            profiles:user_id (id, full_name, email, avatar_url)
          `)
          .eq("organization_id", organization_id)
          .eq("is_active", true);

        if (error) throw error;

        return new Response(
          JSON.stringify({ members }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "add_territory": {
        if (!organization_id || !city_id) {
          return new Response(
            JSON.stringify({ error: "organization_id and city_id required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { data: territory, error } = await supabaseAdmin
          .from("organization_territories")
          .upsert({
            organization_id,
            city_id,
            assigned_by: currentUserId,
          }, { onConflict: "organization_id,city_id" })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, territory }),
          { status: 201, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "remove_territory": {
        if (!organization_id || !city_id) {
          return new Response(
            JSON.stringify({ error: "organization_id and city_id required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { error } = await supabaseAdmin
          .from("organization_territories")
          .delete()
          .eq("organization_id", organization_id)
          .eq("city_id", city_id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, message: "Territory removed" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "list_territories": {
        if (!organization_id) {
          return new Response(
            JSON.stringify({ error: "organization_id required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { data: territories, error } = await supabaseAdmin
          .from("organization_territories")
          .select(`
            id, assigned_at,
            cities:city_id (id, name, country, latitude, longitude)
          `)
          .eq("organization_id", organization_id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ territories }),
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
    console.error("Error in organization-management:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
