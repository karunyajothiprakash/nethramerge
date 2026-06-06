import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import Card from "@/components/Card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Filter,
  Loader2,
  Container,
  AlertCircle,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportToExcel, exportToPDF, formatNumber, ReportData } from "@/lib/report-utils";

interface ContainerData {
  id: string;
  container_number: string;
  product_name: string;
  carton_count: number;
  net_weight: number;
  gross_weight: number;
  container_type: string;
  export_marks: string;
}

export default function ContainerLoadingReport() {
  const [filters, setFilters] = useState({
    container_type: "",
  });
  const [exporting, setExporting] = useState(false);

  const { data: containerData = [], isLoading, error } = useQuery({
    queryKey: ["container-loading-report", filters],
    queryFn: async () => {
      let query = supabase
        .from("packing_protocols")
        .select(`
          id,
          container_number,
          carton_count,
          net_weight,
          gross_weight,
          container_type,
          export_marks,
          quotation:quotations(items:quotation_items(product:products(name)))
        `)
        .order("created_at", { ascending: false });

      if (filters.container_type) {
        query = query.eq("container_type", filters.container_type);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        container_number: item.container_number || "N/A",
        product_name: item.quotation?.items?.[0]?.product?.name || "Unknown",
        carton_count: item.carton_count || 0,
        net_weight: item.net_weight || 0,
        gross_weight: item.gross_weight || 0,
        container_type: item.container_type || "Not specified",
        export_marks: item.export_marks || "N/A",
      }));
    },
  });

  const calculateSummary = () => {
    const totalContainers = containerData.length;
    const totalCartons = containerData.reduce((sum, c) => sum + c.carton_count, 0);
    const totalNetWeight = containerData.reduce((sum, c) => sum + c.net_weight, 0);
    const totalGrossWeight = containerData.reduce((sum, c) => sum + c.gross_weight, 0);

    return {
      "Total Containers": totalContainers.toString(),
      "Total Cartons": totalCartons.toString(),
      "Net Weight (kg)": formatNumber(totalNetWeight),
      "Gross Weight (kg)": formatNumber(totalGrossWeight),
    };
  };

  const handleExport = async (format: "pdf" | "excel") => {
    try {
      setExporting(true);

      const reportData: ReportData = {
        title: "Container Loading Report",
        subtitle: "Container utilization and export marks tracking",
        columns: [
          { field: "container_number", header: "Container #", width: 15 },
          { field: "product_name", header: "Product", width: 20 },
          { field: "carton_count", header: "Cartons", width: 12 },
          {
            field: "net_weight",
            header: "Net Weight (kg)",
            format: (v) => formatNumber(v),
          },
          {
            field: "gross_weight",
            header: "Gross Weight (kg)",
            format: (v) => formatNumber(v),
          },
          { field: "container_type", header: "Type", width: 15 },
          { field: "export_marks", header: "Export Marks", width: 20 },
        ],
        rows: containerData,
        summary: calculateSummary(),
        generatedDate: new Date(),
        filters,
      };

      if (format === "pdf") {
        exportToPDF(reportData, "container-loading-report");
      } else {
        exportToExcel(reportData, "container-loading-report");
      }

      toast.success(`Exported to ${format.toUpperCase()} successfully!`);
    } catch (err) {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Container Loading Report"
        description="Container utilization, packing protocols, and export marks tracking"
        breadcrumbs={[
          { label: "Warehouse" },
          { label: "Reports", to: "/warehouse/reports" },
          { label: "Container Loading" },
        ]}
      />

      {/* Filters */}
      <Card className="bg-muted/30">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Container Type</Label>
              <Select
                value={filters.container_type}
                onValueChange={(v) =>
                  setFilters({ ...filters, container_type: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="20ft">20ft Container</SelectItem>
                  <SelectItem value="40ft">40ft Container</SelectItem>
                  <SelectItem value="pallet">Pallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(calculateSummary()).map(([key, value]) => (
          <Card key={key} className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/20">
            <div className="text-sm text-muted-foreground font-medium">{key}</div>
            <div className="text-2xl font-bold text-emerald-500 mt-2">{value}</div>
          </Card>
        ))}
      </div>

      {/* Data Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Container className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Container Details</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("excel")}
              disabled={isLoading || exporting}
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
              disabled={isLoading || exporting}
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              PDF
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-600">Error loading report</p>
              <p className="text-sm text-red-600/80">Please try again</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : containerData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No container data found with current filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Container #</th>
                  <th className="px-6 py-4 text-left font-semibold">Product</th>
                  <th className="px-6 py-4 text-center font-semibold">Cartons</th>
                  <th className="px-6 py-4 text-right font-semibold">Net (kg)</th>
                  <th className="px-6 py-4 text-right font-semibold">Gross (kg)</th>
                  <th className="px-6 py-4 text-left font-semibold">Type</th>
                  <th className="px-6 py-4 text-left font-semibold">Export Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {containerData.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold">
                      {row.container_number}
                    </td>
                    <td className="px-6 py-4">{row.product_name}</td>
                    <td className="px-6 py-4 text-center font-semibold">
                      {row.carton_count}
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      {formatNumber(row.net_weight)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      {formatNumber(row.gross_weight)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                        {row.container_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {row.export_marks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
