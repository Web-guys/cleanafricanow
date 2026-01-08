import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface SLATrendChartProps {
  data: any;
  statsData: any;
}

const COLORS = {
  primary: "hsl(145, 63%, 42%)",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  muted: "#9ca3af",
};

const PRIORITY_COLORS = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

export const SLAComplianceGauge = ({ complianceRate }: { complianceRate: number }) => {
  const data = [
    { name: "Compliant", value: complianceRate },
    { name: "Non-Compliant", value: 100 - complianceRate },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Overall Compliance</CardTitle>
        <CardDescription>30-day SLA compliance rate</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                startAngle={180}
                endAngle={0}
                paddingAngle={2}
                dataKey="value"
              >
                <Cell fill={COLORS.success} />
                <Cell fill={COLORS.muted} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center -mt-12">
          <p className="text-4xl font-bold text-primary">{complianceRate}%</p>
          <p className="text-sm text-muted-foreground">Compliance Rate</p>
        </div>
      </CardContent>
    </Card>
  );
};

export const SLAPriorityChart = ({ byPriority }: { byPriority: any[] }) => {
  const data = byPriority?.map((p) => ({
    name: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
    total: p.total,
    onTime: p.on_time,
    compliance: p.compliance_rate,
  })) || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Compliance by Priority</CardTitle>
        <CardDescription>Resolution performance per priority level</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis dataKey="name" type="category" width={70} />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "compliance") return [`${value}%`, "Compliance Rate"];
                  return [value, name === "total" ? "Total" : "On Time"];
                }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="compliance" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export const SLAStatusDistribution = ({ stats }: { stats: any }) => {
  const data = [
    { name: "Overdue", value: stats?.overdue || 0, color: COLORS.danger },
    { name: "Due Today", value: stats?.due_today || 0, color: COLORS.warning },
    { name: "Due This Week", value: stats?.due_this_week || 0, color: COLORS.info },
    { name: "On Track", value: stats?.on_track || 0, color: COLORS.success },
  ].filter(d => d.value > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">SLA Status Distribution</CardTitle>
        <CardDescription>Current report status breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export const SLAResolutionMetrics = ({ statsData }: { statsData: any }) => {
  const metrics = [
    {
      label: "Avg Resolution",
      value: `${statsData?.avg_resolution_hours || 0}h`,
      description: "Average time to resolve",
    },
    {
      label: "Total Resolved",
      value: statsData?.total_resolved || 0,
      description: "In the last 30 days",
    },
    {
      label: "On-Time Rate",
      value: `${statsData?.sla_compliance_rate || 0}%`,
      description: "Resolved within SLA",
    },
    {
      label: "Resolved On Time",
      value: statsData?.resolved_on_time || 0,
      description: "Met SLA deadline",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Resolution Metrics</CardTitle>
        <CardDescription>30-day performance summary</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-2xl font-bold text-foreground">{metric.value}</p>
              <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const SLAPriorityBreakdown = ({ byPriority }: { byPriority: any[] }) => {
  const data = byPriority?.map((p) => ({
    name: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
    value: p.total,
    onTime: p.on_time,
    late: p.total - p.on_time,
    fill: PRIORITY_COLORS[p.priority as keyof typeof PRIORITY_COLORS] || COLORS.muted,
  })) || [];

  const totalReports = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Priority Breakdown</CardTitle>
        <CardDescription>Reports resolved by priority</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="onTime" stackId="a" fill={COLORS.success} name="On Time" radius={[0, 0, 0, 0]} />
              <Bar dataKey="late" stackId="a" fill={COLORS.danger} name="Late" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          {totalReports} total reports in the last 30 days
        </p>
      </CardContent>
    </Card>
  );
};

export const SLATerritoryHeatmap = ({ territories }: { territories: any[] }) => {
  const sortedTerritories = [...(territories || [])]
    .sort((a, b) => b.overdue - a.overdue)
    .slice(0, 8);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Territory Performance</CardTitle>
        <CardDescription>SLA status by city</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedTerritories} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis 
                dataKey="city_name" 
                type="category" 
                width={100} 
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="overdue" stackId="a" fill={COLORS.danger} name="Overdue" />
              <Bar dataKey="due_soon" stackId="a" fill={COLORS.warning} name="Due Soon" />
              <Bar dataKey="on_track" stackId="a" fill={COLORS.success} name="On Track" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
