import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SEOHead, pageSEO } from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Medal, 
  Star, 
  Flame, 
  Leaf, 
  Shield, 
  Crown,
  Award,
  ArrowLeft,
  TrendingUp,
  Users,
  Target,
  Sparkles,
  Zap,
  Heart
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Footer from "@/components/Footer";

import logo from "@/assets/cleanafricanow-logo.png";

// Badge definitions
const BADGES = {
  newcomer: { name: "Newcomer", icon: Star, color: "bg-slate-500", minScore: 0, description: "Just getting started" },
  contributor: { name: "Contributor", icon: Leaf, color: "bg-green-500", minScore: 50, description: "Making a difference" },
  activist: { name: "Activist", icon: Flame, color: "bg-orange-500", minScore: 150, description: "Passionate about change" },
  champion: { name: "Champion", icon: Shield, color: "bg-blue-500", minScore: 300, description: "Community champion" },
  hero: { name: "Eco Hero", icon: Medal, color: "bg-purple-500", minScore: 500, description: "Environmental hero" },
  legend: { name: "Legend", icon: Crown, color: "bg-amber-500", minScore: 1000, description: "Legendary contributor" },
};

const REPORT_BADGES = {
  first: { name: "First Report", icon: Zap, color: "bg-cyan-500", minReports: 1 },
  active: { name: "Active Reporter", icon: Target, color: "bg-indigo-500", minReports: 5 },
  dedicated: { name: "Dedicated", icon: Heart, color: "bg-pink-500", minReports: 15 },
  prolific: { name: "Prolific", icon: Sparkles, color: "bg-violet-500", minReports: 30 },
};

const getBadgeForScore = (score: number) => {
  const badges = Object.values(BADGES).sort((a, b) => b.minScore - a.minScore);
  return badges.find(b => score >= b.minScore) || BADGES.newcomer;
};

const getReportBadges = (count: number) => {
  return Object.values(REPORT_BADGES).filter(b => count >= b.minReports);
};

const getNextBadge = (score: number) => {
  const badges = Object.values(BADGES).sort((a, b) => a.minScore - b.minScore);
  return badges.find(b => b.minScore > score);
};

interface LeaderboardUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  impact_score: number | null;
  reports_count: number | null;
  city_id: string | null;
}

const Leaderboard = () => {
  const { t } = useTranslation();
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', timeFilter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles_public')
        .select('id, full_name, avatar_url, impact_score, reports_count, city_id')
        .order('impact_score', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as LeaderboardUser[];
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['leaderboard-stats'],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('profiles_public')
        .select('impact_score, reports_count');
      
      const { count: totalReports } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false);
      
      const totalImpact = profiles?.reduce((sum, p) => sum + (p.impact_score || 0), 0) || 0;
      const totalContributors = profiles?.filter(p => (p.reports_count || 0) > 0).length || 0;
      
      return { totalImpact, totalContributors, totalReports: totalReports || 0 };
    }
  });

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-amber-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-slate-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-700" />;
    return <span className="text-lg font-bold text-muted-foreground w-6 text-center">{rank}</span>;
  };

  const topThree = leaderboard?.slice(0, 3) || [];
  const restOfList = leaderboard?.slice(3) || [];

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <SEOHead {...pageSEO.leaderboard} />
      
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="CleanAfricaNow" className="w-10 h-10 object-contain" />
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hidden sm:block">
                CleanAfricaNow
              </h1>
            </Link>
            <div className="flex items-center gap-2 sm:hidden">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">Leaderboard</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="hidden sm:flex">
              <Link to="/map">View Map</Link>
            </Button>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-12 lg:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent" />
          <div className="container mx-auto px-4 relative">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Community Champions</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Our Environmental <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Heroes</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Celebrating the citizens making a real difference in our communities
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats?.totalImpact?.toLocaleString() || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Impact Points</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats?.totalContributors?.toLocaleString() || 0}</p>
                  <p className="text-sm text-muted-foreground">Contributors</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
                <CardContent className="p-4 text-center">
                  <Target className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats?.totalReports?.toLocaleString() || 0}</p>
                  <p className="text-sm text-muted-foreground">Reports Submitted</p>
                </CardContent>
              </Card>
            </div>

            {/* Top 3 Podium */}
            {topThree.length >= 3 && (
              <div className="flex justify-center items-end gap-4 mb-12 max-w-3xl mx-auto">
                {/* 2nd Place */}
                <div className="flex-1 max-w-[200px]">
                  <Card className="text-center p-4 bg-gradient-to-b from-slate-400/10 to-slate-400/5 border-slate-400/30">
                    <div className="relative inline-block mb-3">
                      <Avatar className="h-16 w-16 border-4 border-slate-400">
                        <AvatarImage src={topThree[1].avatar_url || undefined} />
                        <AvatarFallback className="bg-slate-500 text-white text-lg">
                          {getInitials(topThree[1].full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center text-white font-bold shadow-lg">
                        2
                      </div>
                    </div>
                    <p className="font-semibold truncate">{topThree[1].full_name || 'Anonymous'}</p>
                    <p className="text-2xl font-bold text-slate-400">{topThree[1].impact_score || 0}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </Card>
                </div>

                {/* 1st Place */}
                <div className="flex-1 max-w-[220px] -mt-8">
                  <Card className="text-center p-6 bg-gradient-to-b from-amber-500/20 to-amber-500/5 border-amber-500/40 shadow-lg shadow-amber-500/10">
                    <Crown className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                    <div className="relative inline-block mb-3">
                      <Avatar className="h-20 w-20 border-4 border-amber-500 ring-4 ring-amber-500/20">
                        <AvatarImage src={topThree[0].avatar_url || undefined} />
                        <AvatarFallback className="bg-amber-500 text-white text-xl">
                          {getInitials(topThree[0].full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold shadow-lg text-lg">
                        1
                      </div>
                    </div>
                    <p className="font-bold text-lg truncate">{topThree[0].full_name || 'Anonymous'}</p>
                    <p className="text-3xl font-bold text-amber-500">{topThree[0].impact_score || 0}</p>
                    <p className="text-sm text-muted-foreground">points</p>
                  </Card>
                </div>

                {/* 3rd Place */}
                <div className="flex-1 max-w-[200px]">
                  <Card className="text-center p-4 bg-gradient-to-b from-amber-700/10 to-amber-700/5 border-amber-700/30">
                    <div className="relative inline-block mb-3">
                      <Avatar className="h-16 w-16 border-4 border-amber-700">
                        <AvatarImage src={topThree[2].avatar_url || undefined} />
                        <AvatarFallback className="bg-amber-700 text-white text-lg">
                          {getInitials(topThree[2].full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center text-white font-bold shadow-lg">
                        3
                      </div>
                    </div>
                    <p className="font-semibold truncate">{topThree[2].full_name || 'Anonymous'}</p>
                    <p className="text-2xl font-bold text-amber-700">{topThree[2].impact_score || 0}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Leaderboard Table */}
        <section className="py-8 lg:py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Top Contributors
                    </CardTitle>
                    <CardDescription>
                      Ranked by environmental impact score
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                        ))}
                      </div>
                    ) : restOfList.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">
                        No contributors yet. Be the first!
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {restOfList.map((user, index) => {
                          const rank = index + 4;
                          const badge = getBadgeForScore(user.impact_score || 0);
                          const reportBadges = getReportBadges(user.reports_count || 0);
                          const nextBadge = getNextBadge(user.impact_score || 0);
                          const progressToNext = nextBadge 
                            ? ((user.impact_score || 0) / nextBadge.minScore) * 100
                            : 100;

                          return (
                            <div 
                              key={user.id} 
                              className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                            >
                              <div className="w-8 flex justify-center">
                                {getRankIcon(rank)}
                              </div>
                              
                              <Avatar className="h-12 w-12 border-2 border-border">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getInitials(user.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold truncate">{user.full_name || 'Anonymous'}</p>
                                  <Badge className={`${badge.color} text-white text-xs`}>
                                    <badge.icon className="h-3 w-3 mr-1" />
                                    {badge.name}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    {user.reports_count || 0} reports
                                  </span>
                                  {reportBadges.slice(0, 2).map((rb, i) => (
                                    <rb.icon key={i} className={`h-4 w-4 ${rb.color.replace('bg-', 'text-')}`} />
                                  ))}
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <p className="text-xl font-bold text-primary">{user.impact_score || 0}</p>
                                <p className="text-xs text-muted-foreground">points</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar - Badges Info */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      Achievement Badges
                    </CardTitle>
                    <CardDescription>
                      Earn badges by contributing to the community
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.values(BADGES).map((badge) => (
                      <div key={badge.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className={`w-10 h-10 rounded-full ${badge.color} flex items-center justify-center`}>
                          <badge.icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{badge.name}</p>
                          <p className="text-xs text-muted-foreground">{badge.description}</p>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">{badge.minScore}+</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      How to Earn Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                        <span className="font-bold text-green-500">+10</span>
                      </div>
                      <p className="text-sm">Submit a new report</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <span className="font-bold text-blue-500">+5</span>
                      </div>
                      <p className="text-sm">Report gets verified</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <span className="font-bold text-purple-500">+20</span>
                      </div>
                      <p className="text-sm">Report gets resolved</p>
                    </div>
                  </CardContent>
                </Card>

                <Button asChild className="w-full" size="lg">
                  <Link to="/report">
                    <Flame className="mr-2 h-4 w-4" />
                    Start Contributing
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Leaderboard;
