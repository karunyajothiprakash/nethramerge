import { useNavigate } from "react-router-dom";
import { Plus, Download, Loader2, FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { exportQuotationsToPDF } from "@/lib/quotation-export";
import { toast } from "sonner";
import { useState } from "react";

export default function QuotationsList() {
  const nav = useNavigate();
  const { profile } = useAuth();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['quotations', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          id,
          quotation_number,
          amount,
          currency,
          status,
          items_count,
          valid_until,
          created_at,
          customer:customers(name, address),
          quotation_items (
            *,
            products (
              name,
              unit,
              hs_code
            )
          )
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((q: any) => ({
        ...q,
        id: q.id,
        quotation_number: q.quotation_number,
        customer_name: q.customer?.name || 'Unknown',
        items: q.items_count || 0,
        amount: q.amount,
        currency: q.currency,
        status: q.status,
        validUntil: q.valid_until ? new Date(q.valid_until).toLocaleDateString() : 'N/A',
        createdAt: new Date(q.created_at).toLocaleDateString(),
      }));
    },
    enabled: !!profile?.company_id
  });

  const handleRowDownload = async (e: React.MouseEvent, quotation: any) => {
    e.stopPropagation();
    setDownloadingId(quotation.id);
    
    try {
      // The data is already fetched by react-query, but we might want the full structure
      // for the PDF export if it's not already in the mapped object.
      // In this case, I added quotation_items to the main query above.
      
      const formatted = {
        ...quotation,
        customer_name: quotation.customer?.name || "Unknown"
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
    if (quotations.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    try {
      const formattedData = quotations.map((q: any) => ({
        ...q,
        customer_name: q.customer?.name || "Unknown"
      }));
      exportQuotationsToPDF(formattedData, true);
      toast.success("PDF file downloaded");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div>
      <PageHeader 
        title="Quotations" 
        description="Manage all customer price quotes" 
        breadcrumbs={[{ label: "Quotations" }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={isLoading}>
              <Download className="h-4 w-4 mr-1.5" />Export
            </Button>
            <Button size="sm" onClick={() => nav("/quotations/create")}>
              <Plus className="h-4 w-4 mr-1.5" />New Quotation
            </Button>
          </div>
        }
      />
      
      <DataTable
        data={quotations}
        isLoading={isLoading}
        searchKeys={["quotation_number", "customer_name"]}
        onRowClick={(r) => nav(`/quotations/${r.id}`)}
        columns={[
          { 
            key: "quotation_number", 
            header: "ID", 
            render: (r) => (
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-primary/50" />
                <span className="font-mono text-xs font-bold text-primary">{r.quotation_number}</span>
              </div>
            ) 
          },
          { key: "customer_name", header: "Customer", render: (r) => <span className="font-medium">{r.customer_name}</span> },
          { key: "items", header: "Items", render: (r) => <span className="tabular-nums">{r.items}</span> },
          { key: "amount", header: "Total Amount", render: (r) => <span className="font-medium tabular-nums">{r.currency} {Number(r.amount).toLocaleString()}</span> },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "validUntil", header: "Valid Until", render: (r) => <span className="text-xs text-muted-foreground">{r.validUntil}</span> },
          { key: "createdAt", header: "Created", render: (r) => <span className="text-xs text-muted-foreground">{r.createdAt}</span> },
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
    </div>
  );
}
