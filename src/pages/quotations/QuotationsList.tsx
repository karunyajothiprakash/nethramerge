import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Download, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { exportQuotationsToPDF } from "@/lib/quotation-export";
import { toast } from "sonner";

export default function QuotationsList() {
  const nav = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const { data: qData, error } = await supabase
          .from("quotations")
          .select(`
            *,
            customers (
              name
            ),
            quotation_items (count)
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        const formatted = qData?.map(q => ({
          ...q,
          customer_name: q.customers?.name || "Unknown",
          items_count: q.quotation_items?.[0]?.count || 0
        })) || [];
        
        setData(formatted);
      } catch (err) {
        console.error("Error fetching quotations:", err);
        toast.error("Failed to load quotations");
      } finally {
        setLoading(false);
      }
    };

    fetchQuotations();
  }, []);

  const handleRowDownload = async (e: React.MouseEvent, quotation: any) => {
    e.stopPropagation();
    setDownloadingId(quotation.id);
    
    try {
      const { data: fullData, error } = await supabase
        .from("quotations")
        .select(`
          *,
          customers (
            name,
            address
          ),
          quotation_items (
            *,
            products (
              name,
              unit,
              hs_code
            )
          )
        `)
        .eq("id", quotation.id)
        .single();

      if (error) throw error;

      const formatted = {
        ...fullData,
        customer_name: fullData.customers?.name || "Unknown"
      };

      exportQuotationsToPDF([formatted], true);
      toast.success(`Quotation ${quotation.quotation_number} downloaded`);
    } catch (err) {
      console.error("Error downloading quotation:", err);
      toast.error("Failed to download quotation");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleExport = () => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    try {
      exportQuotationsToPDF(data, true);
      toast.success("PDF file downloaded");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div>
      <PageHeader title="Quotations" description="Manage all customer price quotes" breadcrumbs={[{ label: "Quotations" }]}
        actions={<>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" />Export
          </Button>
          <Button size="sm" onClick={() => nav("/quotations/create")}><Plus className="h-4 w-4 mr-1.5" />New Quotation</Button>
        </>}
      />
      
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          data={data}
          searchKeys={["quotation_number", "customer_name"]}
          onRowClick={(r) => nav(`/quotations/${r.id}`)}
          columns={[
            { key: "quotation_number", header: "ID", render: (r) => <span className="font-mono text-xs text-primary">{r.quotation_number}</span> },
            { key: "customer_name", header: "Customer", render: (r) => <span className="font-medium">{r.customer_name}</span> },
            { key: "items_count", header: "Items", render: (r) => <span className="tabular-nums">{r.items_count}</span> },
            { key: "total_amount", header: "Total Amount", render: (r) => <span className="font-medium tabular-nums">{r.currency} {Number(r.total_amount).toLocaleString()}</span> },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "valid_until", header: "Valid Until", render: (r) => <span className="text-xs text-muted-foreground">{r.valid_until}</span> },
            { key: "created_at", header: "Created", render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span> },
            { 
              key: "actions", 
              header: "", 
              render: (r) => (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={(e) => handleRowDownload(e, r)}
                  disabled={downloadingId === r.id}
                >
                  {downloadingId === r.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              )
            },
          ]}
        />
      )}
    </div>
  );
}
