import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import Card from "@/components/Card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Download,
  Filter,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportToExcel, exportToPDF, formatDate, formatNumber, ReportData } from "@/lib/report-utils";

interface DamageData {
  id: string;
  product_name: string;
  batch_number: string;
  quantity_damaged: number;
  damage_reason: string;
  report_date: string;
  status: string;
}

export default function DamageWastageReport() {
  const [exporting, setExporting] = useState(false);

  const { data: damageData = [], isLoading, error } = useQuery({
    queryKey: ["damage-wastage-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_batches")
        .select(`
          id,
          lot_number,
          quantity_kg,
          status,
          product:products(name),
          created_at
        `)
        .eq("status", "rejected")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        product_name: item.product?.name || "Unknown",
        batch_number: item.lot_number || "N/A",
        quantity_damaged: item.quantity_kg || 0,
        damage_reason: "Quality Check Failed",
        report_date: item.created_at,
        status: item.status,
      }));
    },
  });

  const calculateSummary = () => {
    const totalQuantity = damageData.reduce((sum, d) => sum + d.quantity_damaged, 0);
    const avgQuantity = damageData.length > 0 ? totalQuantity / damageData.length : 0;

    return {
      "Total Damaged Items": damageData.length.toString(),
      "Total Quantity (kg)": formatNumber(totalQuantity),
      "Average per Item (kg)": formatNumber(avgQuantity),
      "Impact": "Requires Attention",
    };
  };

  const handleExport = async (format: "pdf" | "excel") => {
    try {
      setExporting(true);

      const reportData: ReportData = {
        title: "Damage/Wastage Report",
        subtitle: "Identify and track damaged or wasted inventory items",
        columns: [
          { field: "product_name", header: "Product", width: 20 },
          { field: "batch_number", header: "Batch Number", width: 15 },
          {
            field: "quantity_damaged",
            header: "Quantity (kg)",
            format: (v) => formatNumber(v),
          },
          { field: "damage_reason", header: "Reason", width: 20 },
          {
            field: "report_date",
            header: "Report Date",
            format: formatDate,
          },
          {
            field: "status",
            header: "Status",
            format: (v) => v.replace(/_/g, " ").toUpperCase(),
          },
        ],
        rows: damageData,
        summary: calculateSummary(),
        generatedDate: new Date(),
        filters: {},
      };

      if (format === "pdf") {
        exportToPDF(reportData, "damage-wastage-report");
      } else {
        exportToExcel(reportData, "damage-wastage-report");
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
        title="Damage/Wastage Report"
        description="Identify and track damaged or wasted inventory items"
        breadcrumbs={[
          { label: "Warehouse" },
          { label: "Reports", to: "/warehouse/reports" },
          { label: "Damage/Wastage" },
        ]}
      />

      {/* Warning Banner */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-600">Quality Control Alert</p>
          <p className="text-sm text-red-600/80">
            This report tracks items that failed quality checks and were rejected from inventory.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(calculateSummary()).map(([key, value]) => (
          <Card
            key={key}
            className={`bg-gradient-to-br ${
              key === "Total Damaged Items"
                ? "from-red-500/10 to-red-600/10 border-red-500/20"
                : "from-amber-500/10 to-amber-600/10 border-amber-500/20"
            }`}
          >
            <div className="text-sm text-muted-foreground font-medium">{key}</div>
            <div className={`text-2xl font-bold mt-2 ${key === "Total Damaged Items" ? "text-red-500" : "text-amber-500"}`}>
              {value}
            </div>
          </Card>
        ))}
      </div>

      {/* Data Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold">Damage Records</h3>
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
        ) : damageData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No damage records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Product</th>
                  <th className="px-6 py-4 text-left font-semibold">Batch Number</th>
                  <th className="px-6 py-4 text-right font-semibold">Quantity (kg)</th>
                  <th className="px-6 py-4 text-left font-semibold">Reason</th>
                  <th className="px-6 py-4 text-left font-semibold">Report Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {damageData.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">{row.product_name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {row.batch_number}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-red-500 font-semibold">
                      {formatNumber(row.quantity_damaged)}
                    </td>
                    <td className="px-6 py-4 text-amber-600">{row.damage_reason}</td>
                    <td className="px-6 py-4">{formatDate(row.report_date)}</td>
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
