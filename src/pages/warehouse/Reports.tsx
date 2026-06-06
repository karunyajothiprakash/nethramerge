import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import Card from "@/components/Card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Package,
  Truck,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Download
} from "lucide-react";

interface ReportOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  path: string;
  dataPoints?: string[];
}

const AVAILABLE_REPORTS: ReportOption[] = [
  {
    id: "stock-summary",
    title: "Stock Summary Report",
    description: "Overview of current inventory levels across all warehouses and products",
    icon: <BarChart3 className="w-8 h-8" />,
    color: "from-blue-500 to-blue-600",
    path: "/warehouse/reports/stock-summary",
    dataPoints: ["Total Stock", "By Warehouse", "By Product", "By Status"]
  },
  {
    id: "batch-tracking",
    title: "Batch Tracking Report",
    description: "Track inventory movements and batch-wise stock availability",
    icon: <Package className="w-8 h-8" />,
    color: "from-purple-500 to-purple-600",
    path: "/warehouse/reports/batch-tracking",
    dataPoints: ["Batch Details", "Lot Numbers", "Receipt Dates", "Current Quantities"]
  },
  {
    id: "dispatch",
    title: "Dispatch Report",
    description: "Monitor shipments, dispatch status, and delivery tracking",
    icon: <Truck className="w-8 h-8" />,
    color: "from-cyan-500 to-cyan-600",
    path: "/warehouse/reports/dispatch",
    dataPoints: ["Shipment Status", "Delivery Dates", "Containers", "Export Status"]
  },
  {
    id: "container-loading",
    title: "Container Loading Report",
    description: "Container utilization, packing protocols, and export marks tracking",
    icon: <TrendingUp className="w-8 h-8" />,
    color: "from-emerald-500 to-emerald-600",
    path: "/warehouse/reports/container-loading",
    dataPoints: ["Container Details", "Net Weight", "Gross Weight", "Pallet Config"]
  },
  {
    id: "damage-wastage",
    title: "Damage/Wastage Report",
    description: "Identify and track damaged or wasted inventory items",
    icon: <AlertTriangle className="w-8 h-8" />,
    color: "from-red-500 to-red-600",
    path: "/warehouse/reports/damage-wastage",
    dataPoints: ["Damage Status", "Quantity Loss", "Root Cause", "Cost Impact"]
  },
  {
    id: "inventory-aging",
    title: "Inventory Aging Report",
    description: "Analyze aging inventory to identify slow-moving or obsolete stock",
    icon: <Calendar className="w-8 h-8" />,
    color: "from-amber-500 to-amber-600",
    path: "/warehouse/reports/inventory-aging",
    dataPoints: ["Days in Stock", "Receipt Date", "Last Movement", "Recommendations"]
  },
  {
    id: "export-ready",
    title: "Export Ready Stock Report",
    description: "List of inventory ready for export with quality certifications",
    icon: <CheckCircle2 className="w-8 h-8" />,
    color: "from-lime-500 to-lime-600",
    path: "/warehouse/reports/export-ready",
    dataPoints: ["QC Status", "Certifications", "Batch Ready", "Export Marks"]
  }
];

export default function WarehouseReports() {
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const handleViewReport = (path: string) => {
    navigate(path);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Reports & Analytics"
        description="Comprehensive warehouse and inventory insights"
        breadcrumbs={[{ label: "Warehouse" }, { label: "Reports" }]}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <div className="text-sm text-muted-foreground font-medium">Available Reports</div>
          <div className="text-3xl font-bold text-blue-500 mt-2">{AVAILABLE_REPORTS.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Comprehensive analytics</div>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/20">
          <div className="text-sm text-muted-foreground font-medium">Real-time Data</div>
          <div className="text-3xl font-bold text-emerald-500 mt-2">Live</div>
          <div className="text-xs text-muted-foreground mt-1">Updated instantly</div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <div className="text-sm text-muted-foreground font-medium">Export Formats</div>
          <div className="text-3xl font-bold text-purple-500 mt-2">3</div>
          <div className="text-xs text-muted-foreground mt-1">PDF, Excel, CSV</div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/20">
          <div className="text-sm text-muted-foreground font-medium">Filters</div>
          <div className="text-3xl font-bold text-amber-500 mt-2">Advanced</div>
          <div className="text-xs text-muted-foreground mt-1">Customizable options</div>
        </Card>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AVAILABLE_REPORTS.map(report => (
          <Card
            key={report.id}
            className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/50 ${
              selectedReport === report.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedReport(report.id)}
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${report.color} opacity-5 -z-10`} />

            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg bg-gradient-to-br ${report.color} text-white`}>
                {report.icon}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewReport(report.path);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-2">{report.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{report.description}</p>

            {/* Data points */}
            {report.dataPoints && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Key Data Points:</div>
                <div className="flex flex-wrap gap-2">
                  {report.dataPoints.map(point => (
                    <span
                      key={point}
                      className="text-xs bg-muted/50 text-muted-foreground px-2.5 py-1 rounded-full"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action button */}
            <Button
              onClick={() => handleViewReport(report.path)}
              className="w-full mt-4"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              View & Export
            </Button>
          </Card>
        ))}
      </div>

      {/* Help Section */}
      <Card className="bg-muted/30 border-border">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            How to Use Reports
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-sm mb-2">1. Select Report</h4>
              <p className="text-xs text-muted-foreground">
                Click on any report card to view detailed data with real-time warehouse and inventory information.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">2. Apply Filters</h4>
              <p className="text-xs text-muted-foreground">
                Use advanced filters to narrow down results by warehouse, date range, product, status, and more.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">3. Export Data</h4>
              <p className="text-xs text-muted-foreground">
                Download reports in PDF, Excel, or CSV format for further analysis and record-keeping.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
