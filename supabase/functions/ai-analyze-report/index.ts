import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyzeReportRequest {
  report_id: string;
  run_priority?: boolean;
  run_duplicate?: boolean;
  run_impact?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { 
      report_id, 
      run_priority = true, 
      run_duplicate = true, 
      run_impact = true 
    }: AnalyzeReportRequest = await req.json();

    // Fetch the report
    const { data: report, error: fetchError } = await supabaseAdmin
      .from("reports")
      .select("*, cities:city_id(name)")
      .eq("id", report_id)
      .single();

    if (fetchError || !report) {
      return new Response(JSON.stringify({ error: "Report not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    const results: Record<string, any> = {};

    // Run analyses in parallel
    const analyses = [];

    if (run_priority) {
      analyses.push(
        fetch(`${baseUrl}/functions/v1/ai-priority-scoring`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            report_id,
            category: report.category,
            description: report.description,
            latitude: report.latitude,
            longitude: report.longitude,
            photos: report.photos,
          }),
        }).then(r => r.json()).then(data => {
          results.priority = data;
        }).catch(e => {
          results.priority = { error: e.message };
        })
      );
    }

    if (run_duplicate) {
      analyses.push(
        fetch(`${baseUrl}/functions/v1/ai-duplicate-detection`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            report_id,
            category: report.category,
            description: report.description,
            latitude: report.latitude,
            longitude: report.longitude,
          }),
        }).then(r => r.json()).then(data => {
          results.duplicate = data;
        }).catch(e => {
          results.duplicate = { error: e.message };
        })
      );
    }

    if (run_impact) {
      analyses.push(
        fetch(`${baseUrl}/functions/v1/ai-impact-scoring`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            report_id,
            category: report.category,
            description: report.description,
            latitude: report.latitude,
            longitude: report.longitude,
            city_name: (report.cities as any)?.name,
            photos: report.photos,
          }),
        }).then(r => r.json()).then(data => {
          results.impact = data;
        }).catch(e => {
          results.impact = { error: e.message };
        })
      );
    }

    await Promise.all(analyses);

    // Log the comprehensive analysis
    await supabaseAdmin.from("user_activity_logs").insert({
      user_id: null,
      action: "ai_report_analyzed",
      entity_type: "report",
      entity_id: report_id,
      metadata: {
        analyses_run: { run_priority, run_duplicate, run_impact },
        results_summary: {
          priority: results.priority?.analysis?.priority_level,
          priority_score: results.priority?.analysis?.priority_score,
          is_duplicate: results.duplicate?.analysis?.is_duplicate,
          duplicate_confidence: results.duplicate?.analysis?.confidence,
          impact_score: results.impact?.assessment?.overall_impact_score,
        }
      },
    });

    return new Response(JSON.stringify({ 
      success: true, 
      report_id,
      results 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in ai-analyze-report:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
