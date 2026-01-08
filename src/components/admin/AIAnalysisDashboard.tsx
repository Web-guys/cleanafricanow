import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Copy, 
  Loader2,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Clock,
  Zap
} from "lucide-react";

interface PriorityAnalysis {
  priority_score: number;
  priority_level: string;
  urgency_factors: string[];
  recommended_response_hours: number;
  reasoning: string;
}

interface DuplicateResult {
  is_duplicate: boolean;
  confidence: number;
  similar_report_id?: string;
  reasoning: string;
}

export const AIAnalysisDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [analysisInProgress, setAnalysisInProgress] = useState<Set<string>>(new Set());

  // Fetch reports needing AI analysis
  const { data: pendingReports, isLoading } = useQuery({
    queryKey: ['pending-ai-analysis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('id, description, category, priority, ai_priority_score, created_at')
        .is('ai_priority_score', null)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch analyzed reports
  const { data: analyzedReports } = useQuery({
    queryKey: ['analyzed-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('id, description, category, priority, ai_priority_score, created_at')
        .not('ai_priority_score', 'is', null)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    }
  });

  // AI Priority Scoring mutation
  const priorityMutation = useMutation({
    mutationFn: async (report: { id: string; category: string; description: string }) => {
      setAnalysisInProgress(prev => new Set(prev).add(report.id));
      
      const { data, error } = await supabase.functions.invoke('ai-priority-scoring', {
        body: {
          report_id: report.id,
          category: report.category,
          description: report.description,
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending-ai-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['analyzed-reports'] });
      
      toast({
        title: "AI Analysis Complete",
        description: `Report scored: ${data.analysis?.priority_level} priority (${data.analysis?.priority_score}/100)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze report",
        variant: "destructive",
      });
    },
    onSettled: (_, __, variables) => {
      setAnalysisInProgress(prev => {
        const next = new Set(prev);
        next.delete(variables.id);
        return next;
      });
    }
  });

  // Duplicate Detection mutation
  const duplicateMutation = useMutation({
    mutationFn: async (report: { id: string; category: string; description: string; latitude: number; longitude: number }) => {
      const { data, error } = await supabase.functions.invoke('ai-duplicate-detection', {
        body: report,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.is_duplicate) {
        toast({
          title: "Duplicate Detected",
          description: `Confidence: ${(data.confidence * 100).toFixed(0)}%`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "No Duplicates Found",
          description: "This report appears to be unique.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Detection Failed",
        description: error.message || "Failed to check duplicates",
        variant: "destructive",
      });
    }
  });

  // Bulk analyze all pending
  const bulkAnalyzeMutation = useMutation({
    mutationFn: async () => {
      if (!pendingReports?.length) return;
      
      const results = await Promise.allSettled(
        pendingReports.slice(0, 10).map(report =>
          supabase.functions.invoke('ai-priority-scoring', {
            body: {
              report_id: report.id,
              category: report.category,
              description: report.description,
            },
          })
        )
      );
      
      return results;
    },
    onSuccess: (results) => {
      const succeeded = results?.filter(r => r.status === 'fulfilled').length || 0;
      queryClient.invalidateQueries({ queryKey: ['pending-ai-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['analyzed-reports'] });
      
      toast({
        title: "Bulk Analysis Complete",
        description: `Successfully analyzed ${succeeded} reports`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Bulk Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-destructive';
    if (score >= 60) return 'text-orange-500';
    if (score >= 40) return 'text-warning';
    return 'text-success';
  };

  // Stats
  const totalAnalyzed = analyzedReports?.length || 0;
  const pendingCount = pendingReports?.length || 0;
  const criticalCount = analyzedReports?.filter(r => r.priority === 'critical').length || 0;
  const highCount = analyzedReports?.filter(r => r.priority === 'high').length || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Analyzed</p>
                <p className="text-2xl font-bold">{totalAnalyzed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Analysis</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold">{criticalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Zap className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold">{highCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="analyzed" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Analyzed ({totalAnalyzed})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Reports Awaiting AI Analysis
                  </CardTitle>
                  <CardDescription>
                    These reports haven't been analyzed by AI yet
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => bulkAnalyzeMutation.mutate()}
                  disabled={bulkAnalyzeMutation.isPending || !pendingCount}
                >
                  {bulkAnalyzeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Analyze All (up to 10)
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !pendingReports?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>All reports have been analyzed!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingReports.map((report) => (
                    <div 
                      key={report.id} 
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {report.category?.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(report.created_at || '').toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm truncate max-w-md">{report.description}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => priorityMutation.mutate({
                          id: report.id,
                          category: report.category,
                          description: report.description,
                        })}
                        disabled={analysisInProgress.has(report.id)}
                      >
                        {analysisInProgress.has(report.id) ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing
                          </>
                        ) : (
                          <>
                            <Brain className="mr-2 h-4 w-4" />
                            Analyze
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analyzed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                AI-Analyzed Reports
              </CardTitle>
              <CardDescription>
                Reports with AI priority scoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!analyzedReports?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No analyzed reports yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analyzedReports.map((report) => (
                    <div 
                      key={report.id} 
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getPriorityColor(report.priority)}>
                            {report.priority || 'unscored'}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {report.category?.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm truncate max-w-md">{report.description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">AI Score</p>
                          <p className={`text-lg font-bold ${getScoreColor(report.ai_priority_score)}`}>
                            {report.ai_priority_score || '-'}/100
                          </p>
                        </div>
                        <Progress 
                          value={report.ai_priority_score || 0} 
                          className="w-20 h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAnalysisDashboard;
