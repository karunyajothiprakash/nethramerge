import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Download, Edit, Send, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { exportQuotationsToPDF } from "@/lib/quotation-export";
import { toast } from "sonner";

export default function QuotationPreview() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: qData, error } = await supabase
          .from("quotations")
          .select(`
            *,
            customers (name),
            quotation_items (
              *,
              products (name, unit, hs_code)
            )
          `)
          .eq("id", id)
          .single();

        if (error) throw error;
        setData(qData);
      } catch (err) {
        console.error("Error fetching quotation:", err);
        toast.error("Failed to load quotation details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-12 text-center text-muted-foreground">Quotation not found</div>;
  }

  const handleExport = () => {
    try {
      const formatted = [{
        ...data,
        customer_name: data.customers?.name || "Unknown"
      }];
      exportQuotationsToPDF(formatted);
      toast.success("PDF file downloaded");
    } catch (err) {
      toast.error("Failed to generate PDF");
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const { error } = await supabase
        .from("quotations")
        .update({ status: "Pending" })
        .eq("id", id);

      if (error) throw error;
      
      setData({ ...data, status: "Pending" });
      toast.success("Quotation sent to customer and moved to approvals");
    } catch (err: any) {
      console.error("Error sending quotation:", err);
      toast.error("Failed to send quotation");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title={data.quotation_number} description="Quotation preview" breadcrumbs={[{ label: "Quotations", to: "/quotations" }, { label: data.quotation_number }]}
        actions={<>
          <Button variant="outline" size="sm" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" />Back</Button>
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1.5" />PDF</Button>
          <Button 
            size="sm" 
            disabled={sending || data?.status !== "Draft"} 
            onClick={handleSend}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
            Send
          </Button>
        </>}
      />
      <Section>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start justify-between pb-6 border-b border-border">
            <div>
              <div className="text-2xl font-bold">QUOTATION</div>
              <div className="text-sm text-muted-foreground mt-1">{data.quotation_number}</div>
            </div>
            <StatusBadge status={data.status} />
          </div>
          <div className="grid grid-cols-2 gap-8 py-6 border-b border-border">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">From</div>
              <div className="font-semibold text-sm">Shastika Global Impex</div>
              <div className="text-sm text-muted-foreground mt-1">Acme Exports Ltd<br />GST: 27ABCDE1234F1Z5</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">To</div>
              <div className="font-semibold text-sm">{data.customers?.name}</div>
              <div className="text-sm text-muted-foreground mt-1">Valid until: {data.valid_until || "N/A"}</div>
            </div>
          </div>
          <table className="w-full mt-6 text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left py-2 text-xs uppercase font-medium text-muted-foreground">Description</th>
                <th className="text-right py-2 text-xs uppercase font-medium text-muted-foreground">Qty</th>
                <th className="text-right py-2 text-xs uppercase font-medium text-muted-foreground">Price</th>
                <th className="text-right py-2 text-xs uppercase font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.quotation_items?.map((item: any) => (
                <tr key={item.id} className="border-b border-border">
                  <td className="py-3">{item.products?.name || "Product"}</td>
                  <td className="text-right py-3 tabular-nums">{item.quantity}</td>
                  <td className="text-right py-3 tabular-nums">{data.currency} {Number(item.unit_price).toLocaleString()}</td>
                  <td className="text-right py-3 tabular-nums">{data.currency} {Number(item.total_price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-6 flex justify-end">
            <div className="w-64 space-y-1.5 text-sm">
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                <span>Total</span>
                <span className="tabular-nums">{data.currency} {Number(data.total_amount).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Generated by Shastika ERP</div>
            {data?.status === "Approved" ? (
              <Button size="sm" onClick={() => nav("/quotations/convert")}>
                Convert to Order <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            ) : data?.status === "Pending" ? (
              <div className="flex items-center gap-2 text-warning font-medium text-sm bg-warning-muted/50 px-3 py-1.5 rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                Awaiting Approval
              </div>
            ) : data?.status === "Converted" ? (
              <div className="flex items-center gap-2 text-success font-medium text-sm bg-success-muted/50 px-3 py-1.5 rounded-md">
                ✓ Converted to Order
              </div>
            ) : null}
          </div>
        </div>
      </Section>
    </div>
  );
}
