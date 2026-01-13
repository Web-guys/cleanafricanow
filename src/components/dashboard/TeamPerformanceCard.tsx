import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Award, Clock, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  resolved: number;
  avgTime: string;
  status: 'active' | 'away' | 'offline';
}

interface TeamPerformanceCardProps {
  cityId?: string;
}

export const TeamPerformanceCard = ({ cityId }: TeamPerformanceCardProps) => {
  const { data: workers = [], isLoading } = useQuery({
    queryKey: ['team-workers', cityId],
    queryFn: async () => {
      let query = supabase
        .from('team_workers')
        .select('*')
        .eq('status', 'active');
      
      if (cityId) {
        query = query.eq('city_id', cityId);
      }

      const { data, error } = await query.limit(5);
      if (error) throw error;
      
      return (data || []).map((worker: any) => ({
        id: worker.id,
        name: worker.full_name,
        role: worker.role,
        resolved: Math.floor(Math.random() * 50) + 10, // Mock data - would come from actual stats
        avgTime: `${Math.floor(Math.random() * 3) + 1}h ${Math.floor(Math.random() * 60)}m`,
        status: worker.status === 'active' ? 'active' : 'away',
      })) as TeamMember[];
    },
  });

  const statusColors = {
    active: 'bg-green-500',
    away: 'bg-amber-500',
    offline: 'bg-gray-400',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Team Performance
          </span>
          <Badge variant="secondary" className="text-xs">
            {workers.length} active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No team members assigned</p>
            <p className="text-xs">Add workers in Team Management</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workers.map((member, index) => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span 
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${statusColors[member.status]}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{member.name}</span>
                    {index === 0 && (
                      <Award className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {member.role.replace('_', ' ')}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    {member.resolved}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {member.avgTime}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};