import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PriorityScoringRequest {
  report_id?: string;
  category: string;
  description: string;
  latitude?: number;
  longitude?: number;
  photos?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // === AUTHORIZATION CHECK ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { report_id, category, description, latitude, longitude, photos }: PriorityScoringRequest = await req.json();

    // If report_id is provided, verify authorization
    if (report_id) {
      const { data: report } = await supabaseAdmin
        .from("reports")
        .select("user_id, city_id")
        .eq("id", report_id)
        .single();

      if (report) {
        const { data: isAdmin } = await supabaseAdmin.rpc('has_role', { _user_id: user.id, _role: 'admin' });
        const { data: isMunicipality } = await supabaseAdmin.rpc('has_role', { _user_id: user.id, _role: 'municipality' });
        const { data: isNgo } = await supabaseAdmin.rpc('has_role', { _user_id: user.id, _role: 'ngo' });
        
        const isReportOwner = report.user_id === user.id;
        
        let hasTerritory = false;
        if ((isMunicipality || isNgo) && report.city_id) {
          const { data: canAccess } = await supabaseAdmin.rpc('can_access_territory', { 
            _city_id: report.city_id, 
            _user_id: user.id 
          });
          hasTerritory = canAccess === true;
        }

        if (!isAdmin && !isReportOwner && !hasTerritory) {
          return new Response(
            JSON.stringify({ error: "Unauthorized to score this report" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Build context for AI
    const prompt = `You are an environmental report priority scoring system for CleanAfricaNow, an environmental monitoring platform in Africa.

Analyze this environmental report and assign a priority score and classification.

Report Details:
- Category: ${category}
- Description: ${description}
- Location: ${latitude ? `Lat: ${latitude}, Lng: ${longitude}` : 'Not specified'}
- Has Photos: ${photos && photos.length > 0 ? `Yes (${photos.length} photos)` : 'No'}

Scoring Criteria:
1. CRITICAL (score 90-100): Immediate health hazard, toxic materials, active pollution affecting water/air, wildlife emergency
2. HIGH (score 70-89): Significant environmental damage, large-scale illegal dumping, deforestation, water contamination
3. MEDIUM (score 40-69): Moderate issues like localized waste, noise complaints, minor pollution
4. LOW (score 10-39): Minor issues, aesthetic concerns, small amounts of litter

Consider:
- Public health impact
- Environmental damage severity
- Urgency of response needed
- Population affected
- Reversibility of damage

Return your analysis using the priority_analysis function.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "priority_analysis",
              description: "Return the priority analysis for an environmental report",
              parameters: {
                type: "object",
                properties: {
                  priority_score: { 
                    type: "number", 
                    description: "Score from 1-100 indicating urgency" 
                  },
                  priority_level: { 
                    type: "string", 
                    enum: ["critical", "high", "medium", "low"],
                    description: "Priority classification"
                  },
                  urgency_factors: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of factors contributing to urgency"
                  },
                  recommended_response_hours: {
                    type: "number",
                    description: "Recommended SLA in hours"
                  },
                  reasoning: {
                    type: "string",
                    description: "Brief explanation of the scoring"
                  }
                },
                required: ["priority_score", "priority_level", "urgency_factors", "recommended_response_hours", "reasoning"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "priority_analysis" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No valid response from AI");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    // If report_id provided, update the report with AI scores
    if (report_id) {
      const priorityMap: Record<string, string> = {
        critical: "critical",
        high: "high",
        medium: "medium",
        low: "low"
      };

      await supabaseAdmin
        .from("reports")
        .update({
          priority: priorityMap[analysis.priority_level] || "medium",
          ai_priority_score: analysis.priority_score,
          sla_due_date: new Date(Date.now() + analysis.recommended_response_hours * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", report_id);

      // Log the AI analysis
      await supabaseAdmin.from("report_history").insert({
        report_id,
        action: "ai_priority_scored",
        changed_by: user.id,
        notes: `AI Priority: ${analysis.priority_level} (${analysis.priority_score}/100). ${analysis.reasoning}`,
        new_data: analysis,
      });
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in ai-priority-scoring:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});