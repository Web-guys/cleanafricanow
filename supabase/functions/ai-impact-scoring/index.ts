import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImpactScoringRequest {
  report_id?: string;
  category: string;
  description: string;
  latitude?: number;
  longitude?: number;
  city_name?: string;
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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { report_id, category, description, latitude, longitude, city_name, photos }: ImpactScoringRequest = await req.json();

    const prompt = `You are an environmental impact assessment system for CleanAfricaNow, operating across Africa.

Analyze this environmental report and assess its environmental impact.

Report Details:
- Category: ${category}
- Description: ${description}
- Location: ${city_name || 'Unknown city'}${latitude ? ` (${latitude}, ${longitude})` : ''}
- Has Photos: ${photos && photos.length > 0 ? `Yes (${photos.length})` : 'No'}

Environmental Impact Assessment Criteria:

1. ECOSYSTEM IMPACT (0-100):
   - Biodiversity threat
   - Habitat destruction
   - Wildlife impact
   - Vegetation damage

2. HUMAN HEALTH IMPACT (0-100):
   - Air quality effects
   - Water contamination risk
   - Disease vector creation
   - Toxic exposure risk

3. WATER RESOURCE IMPACT (0-100):
   - Surface water contamination
   - Groundwater threat
   - Drainage/flooding effects

4. CLIMATE IMPACT (0-100):
   - Greenhouse gas emissions
   - Carbon sink damage
   - Microclimate effects

5. REVERSIBILITY (0-100, higher = more reversible):
   - Can damage be undone?
   - Time to recovery
   - Resources needed

Consider African environmental context:
- Water scarcity in many regions
- Importance of biodiversity hotspots
- Urban vs rural implications
- Climate vulnerability

Use the impact_assessment function to return your analysis.`;

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
              name: "impact_assessment",
              description: "Return environmental impact assessment",
              parameters: {
                type: "object",
                properties: {
                  overall_impact_score: { 
                    type: "number", 
                    description: "Overall environmental impact 0-100" 
                  },
                  ecosystem_score: { 
                    type: "number", 
                    description: "Ecosystem impact 0-100" 
                  },
                  health_score: { 
                    type: "number", 
                    description: "Human health impact 0-100" 
                  },
                  water_score: { 
                    type: "number", 
                    description: "Water resource impact 0-100" 
                  },
                  climate_score: { 
                    type: "number", 
                    description: "Climate impact 0-100" 
                  },
                  reversibility_score: { 
                    type: "number", 
                    description: "How reversible is the damage 0-100" 
                  },
                  affected_area_estimate: {
                    type: "string",
                    enum: ["localized", "neighborhood", "district", "city", "regional"],
                    description: "Estimated affected area"
                  },
                  key_concerns: {
                    type: "array",
                    items: { type: "string" },
                    description: "Main environmental concerns"
                  },
                  recommended_actions: {
                    type: "array",
                    items: { type: "string" },
                    description: "Recommended remediation actions"
                  },
                  sdg_alignment: {
                    type: "array",
                    items: { type: "string" },
                    description: "Relevant UN Sustainable Development Goals affected"
                  },
                  summary: {
                    type: "string",
                    description: "Brief impact summary"
                  }
                },
                required: [
                  "overall_impact_score", "ecosystem_score", "health_score", 
                  "water_score", "climate_score", "reversibility_score",
                  "affected_area_estimate", "key_concerns", "recommended_actions", "summary"
                ],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "impact_assessment" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No valid response from AI");
    }

    const assessment = JSON.parse(toolCall.function.arguments);

    // If report_id provided, update the report with impact score
    if (report_id) {
      await supabaseAdmin
        .from("reports")
        .update({
          environmental_impact_score: assessment.overall_impact_score,
        })
        .eq("id", report_id);

      // Log the assessment
      await supabaseAdmin.from("report_history").insert({
        report_id,
        action: "ai_impact_assessed",
        notes: `Environmental Impact: ${assessment.overall_impact_score}/100. ${assessment.summary}`,
        new_data: assessment,
      });
    }

    return new Response(JSON.stringify({ success: true, assessment }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in ai-impact-scoring:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
