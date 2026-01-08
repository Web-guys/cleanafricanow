import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import ExportPanel from "@/components/admin/ExportPanel";
import { Download } from "lucide-react";

const Export = () => {
  return (
    <DashboardLayout 
      title="Export Data" 
      icon={<Download className="h-6 w-6 text-primary" />}
      role="admin"
    >
      <div className="p-4 lg:p-8">
        <ExportPanel />
      </div>
    </DashboardLayout>
  );
};

export default Export;
