import { Link } from "react-router-dom";
import { 
  FileText, 
  Building2, 
  Users, 
  MapPin, 
  AlertTriangle, 
  BarChart3, 
  Download,
  Settings,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const quickActions = [
  {
    title: "View All Reports",
    description: "Manage and review submitted reports",
    icon: FileText,
    href: "/admin/reports",
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    title: "SLA Dashboard",
    description: "Monitor overdue and at-risk reports",
    icon: AlertTriangle,
    href: "/admin/sla",
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    title: "Organizations",
    description: "Manage municipalities and NGOs",
    icon: Building2,
    href: "/admin/organizations",
    color: "text-purple-500 bg-purple-500/10",
  },
  {
    title: "User Management",
    description: "Manage users and roles",
    icon: Users,
    href: "/admin/users",
    color: "text-green-500 bg-green-500/10",
  },
  {
    title: "Cities & Regions",
    description: "Manage geographical areas",
    icon: MapPin,
    href: "/admin/cities",
    color: "text-rose-500 bg-rose-500/10",
  },
  {
    title: "Analytics",
    description: "View detailed analytics",
    icon: BarChart3,
    href: "/admin/analytics",
    color: "text-cyan-500 bg-cyan-500/10",
  },
  {
    title: "Export Data",
    description: "Download reports and data",
    icon: Download,
    href: "/admin/export",
    color: "text-indigo-500 bg-indigo-500/10",
  },
  {
    title: "Settings",
    description: "Configure system settings",
    icon: Settings,
    href: "/admin/settings",
    color: "text-gray-500 bg-gray-500/10",
  },
];

export const QuickActionsCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              to={action.href}
              className="group p-4 rounded-xl border hover:shadow-md transition-all hover:border-primary/50 flex flex-col"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${action.color}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <h4 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                {action.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                {action.description}
              </p>
              <ArrowRight className="h-4 w-4 mt-2 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
