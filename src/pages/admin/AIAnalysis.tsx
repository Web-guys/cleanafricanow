import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import AIAnalysisDashboard from "@/components/admin/AIAnalysisDashboard";

const AIAnalysis = () => {
  return (
    <DashboardLayout 
      title="AI Analysis" 
      icon={<Brain className="h-6 w-6 text-primary" />}
      role="admin"
    >
      <div className="p-4 lg:p-8">
        <AIAnalysisDashboard />
      </div>
    </DashboardLayout>
  );
};

export default AIAnalysis;
