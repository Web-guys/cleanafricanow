import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { action, ...payload } = await req.json();

    // Special action for bootstrapping test users (no auth required, uses service key)
    if (action === "bootstrap_test_users") {
      const testUsers = [
        { email: "admin@cleanafricanow.com", password: "Admin123!", full_name: "Admin User", role: "admin" },
        { email: "municipality@cleanafricanow.com", password: "Municipality123!", full_name: "Municipality User", role: "municipality" },
        { email: "ngo@cleanafricanow.com", password: "Ngo123456!", full_name: "NGO User", role: "ngo" },
        { email: "volunteer@cleanafricanow.com", password: "Volunteer123!", full_name: "Volunteer User", role: "volunteer" },
        { email: "partner@cleanafricanow.com", password: "Partner123!", full_name: "Partner Company", role: "partner" },
        { email: "citizen@cleanafricanow.com", password: "Citizen123!", full_name: "Citizen User", role: "citizen" },
      ];

      const results = [];

      for (const testUser of testUsers) {
        try {
          // Check if user already exists
          const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
          const userExists = existingUsers?.users?.some(u => u.email === testUser.email);

          if (userExists) {
            results.push({ email: testUser.email, status: "already_exists" });
            continue;
          }

          // Create user
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: testUser.email,
            password: testUser.password,
            email_confirm: true,
            user_metadata: { full_name: testUser.full_name }
          });

          if (createError) {
            results.push({ email: testUser.email, status: "error", error: createError.message });
            continue;
          }

          // Profile is created by trigger, but let's ensure it exists
          const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .upsert({
              id: newUser.user.id,
              email: testUser.email,
              full_name: testUser.full_name,
            }, { onConflict: 'id' });

          if (profileError) {
            console.error("Profile upsert error:", profileError);
          }

          // Assign role (trigger assigns citizen, we need to add additional roles)
          if (testUser.role !== "citizen") {
            const { error: roleError } = await supabaseAdmin
              .from("user_roles")
              .insert({
                user_id: newUser.user.id,
                role: testUser.role
              });

            if (roleError && !roleError.message.includes("duplicate")) {
              console.error("Role assignment error:", roleError);
            }
          }

          results.push({ email: testUser.email, status: "created", role: testUser.role });
        } catch (err) {
          results.push({ email: testUser.email, status: "error", error: String(err) });
        }
      }

      return new Response(
        JSON.stringify({ success: true, users: results }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For other actions, require admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if the user is an admin
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (rolesError || !roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      case "create_user": {
        const { email, password, full_name, role } = payload;

        if (!email || !password || !full_name) {
          return new Response(
            JSON.stringify({ error: "Email, password, and full name are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create the user using admin API
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Auto-confirm email
          user_metadata: { full_name }
        });

        if (createError) {
          return new Response(
            JSON.stringify({ error: createError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create profile for the new user
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .insert({
            id: newUser.user.id,
            email: email,
            full_name: full_name,
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }

        // Assign role if provided
        if (role && role !== "citizen") {
          const { error: roleError } = await supabaseAdmin
            .from("user_roles")
            .insert({
              user_id: newUser.user.id,
              role: role
            });

          if (roleError) {
            console.error("Role assignment error:", roleError);
          }
        }

        return new Response(
          JSON.stringify({ success: true, user: { id: newUser.user.id, email } }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete_user": {
        const { user_id } = payload;

        if (!user_id) {
          return new Response(
            JSON.stringify({ error: "User ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Prevent self-deletion
        if (user_id === user.id) {
          return new Response(
            JSON.stringify({ error: "Cannot delete your own account" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Delete user using admin API (this cascades to profiles due to FK)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
