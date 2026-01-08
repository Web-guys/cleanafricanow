import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DuplicateDetectionRequest {
  report_id?: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  radius_meters?: number;
  time_window_hours?: number;
}

// Haversine formula to calculate distance between two points
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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

    const { 
      report_id, 
      category, 
      description, 
      latitude, 
      longitude, 
      radius_meters = 200,
      time_window_hours = 72
    }: DuplicateDetectionRequest = await req.json();

    // Calculate time window
    const timeThreshold = new Date(Date.now() - time_window_hours * 60 * 60 * 1000).toISOString();

    // Find nearby reports in the same category within time window
    const { data: nearbyReports, error: fetchError } = await supabaseAdmin
      .from("reports")
      .select("id, category, description, latitude, longitude, created_at, status")
      .eq("category", category)
      .eq("is_deleted", false)
      .gte("created_at", timeThreshold)
      .neq("id", report_id || "00000000-0000-0000-0000-000000000000");

    if (fetchError) {
      throw fetchError;
    }

    // Filter by distance
    const candidateDuplicates = nearbyReports?.filter(report => {
      const distance = getDistanceMeters(latitude, longitude, Number(report.latitude), Number(report.longitude));
      return distance <= radius_meters;
    }) || [];

    if (candidateDuplicates.length === 0) {
      return new Response(JSON.stringify({ 
        is_duplicate: false, 
        confidence: 0,
        candidates: [],
        message: "No nearby reports found" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to analyze semantic similarity
    const candidateDescriptions = candidateDuplicates.map((r, i) => 
      `Report ${i + 1} (ID: ${r.id}): "${r.description}"`
    ).join("\n");

    const prompt = `You are a duplicate detection system for environmental reports.

New Report:
- Category: ${category}
- Description: "${description}"
- Location: Lat ${latitude}, Lng ${longitude}

Nearby Reports (within ${radius_meters}m, last ${time_window_hours} hours):
${candidateDescriptions}

Analyze if the new report is a duplicate of any existing report. Consider:
1. Semantic similarity of descriptions (same incident described differently)
2. Same category
3. Geographic proximity
4. Time proximity

A duplicate means the same environmental issue reported multiple times, not just similar issues.

Use the duplicate_analysis function to return your findings.`;

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
              name: "duplicate_analysis",
              description: "Return duplicate detection analysis",
              parameters: {
                type: "object",
                properties: {
                  is_duplicate: { 
                    type: "boolean", 
                    description: "Whether this is likely a duplicate" 
                  },
                  confidence: { 
                    type: "number", 
                    description: "Confidence score 0-100" 
                  },
                  duplicate_of_id: { 
                    type: "string", 
                    description: "ID of the original report if duplicate, null otherwise" 
                  },
                  similarity_reasons: {
                    type: "array",
                    items: { type: "string" },
                    description: "Reasons for similarity determination"
                  },
                  recommendation: {
                    type: "string",
                    enum: ["merge", "link", "keep_separate", "flag_for_review"],
                    description: "Recommended action"
                  }
                },
                required: ["is_duplicate", "confidence", "similarity_reasons", "recommendation"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "duplicate_analysis" } }
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

    const analysis = JSON.parse(toolCall.function.arguments);

    // If report_id provided and is duplicate, update the report
    if (report_id && analysis.is_duplicate && analysis.duplicate_of_id && analysis.confidence >= 70) {
      await supabaseAdmin
        .from("reports")
        .update({
          ai_duplicate_of: analysis.duplicate_of_id,
        })
        .eq("id", report_id);

      // Log the detection
      await supabaseAdmin.from("report_history").insert({
        report_id,
        action: "ai_duplicate_detected",
        notes: `Potential duplicate of ${analysis.duplicate_of_id} (${analysis.confidence}% confidence). ${analysis.similarity_reasons.join(", ")}`,
        new_data: analysis,
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      analysis,
      candidates: candidateDuplicates.map(r => ({
        id: r.id,
        description: r.description?.substring(0, 100),
        distance_meters: Math.round(getDistanceMeters(latitude, longitude, Number(r.latitude), Number(r.longitude))),
        created_at: r.created_at,
        status: r.status,
      }))
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in ai-duplicate-detection:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
