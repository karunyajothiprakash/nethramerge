import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ConvertQuotation() {
  const nav = useNavigate();
  const [ready, setReady] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const fetchApproved = async () => {
    try {
      const { data, error } = await supabase
        .from("quotations")
        .select(`
          *,
          customers (name, country),
          quotation_items (
            quantity,
            unit_price,
            products (name, unit)
          )
        `)
        .eq("status", "Approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReady(data || []);
    } catch (err: any) {
      console.error("Error fetching approved quotations:", err);
      toast.error("Failed to load quotations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApproved();
  }, []);

  const handleConvert = async (quotation: any) => {
    setConvertingId(quotation.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("Auth required");

      // 1. Create the Order
      // We pick the first item to represent the "main product" since export_orders table is flat
      const firstItem = quotation.quotation_items?.[0];
      const productName = firstItem?.products?.name || "Multiple Products";
      const productUnit = firstItem?.products?.unit || "kg";
      
      const year = new Date().getFullYear();
      const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const orderNumber = `EXP-${year}-${rand}`;

      const { error: orderError } = await supabase.from("export_orders").insert({
        order_number: orderNumber,
        customer_name: quotation.customers?.name || "Unknown",
        customer_country: quotation.customers?.country || "",
        product: productName,
        quantity: Number(firstItem?.quantity || 0),
        unit: productUnit,
        unit_price: Number(firstItem?.unit_price || 0),
        total_amount: quotation.total_amount,
        currency: quotation.currency,
        status: 'pending',
        payment_status: 'unpaid',
        created_by: userId,
        notes: `Converted from Quotation ${quotation.quotation_number}`
      });

      if (orderError) throw orderError;

      // 2. Update Quotation Status
      const { error: updateError } = await supabase
        .from("quotations")
        .update({ status: "Converted" })
        .eq("id", quotation.id);

      if (updateError) throw updateError;

      toast.success(`${quotation.quotation_number} converted to sales order ${orderNumber}`);
      nav("/orders");
    } catch (err: any) {
      console.error("Error converting quotation:", err);
      toast.error(err.message || "Failed to convert quotation");
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div>
      <PageHeader 
        title="Convert to Sales Order" 
        description="Approved quotations ready to convert" 
        breadcrumbs={[{ label: "Quotations", to: "/quotations" }, { label: "Convert" }]} 
      />
      
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Section title={`${ready.length} ready for conversion`}>
          {ready.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border rounded-lg text-muted-foreground">
              <AlertCircle className="h-10 w-10 mb-2 opacity-20" />
              <p>No approved quotations ready to convert</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ready.map((q) => (
                <div key={q.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-success-muted text-success flex items-center justify-center text-xs font-bold">
                      ✓
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{q.customers?.name || "Unknown Customer"}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        {q.quotation_number} · {q.currency} {Number(q.total_amount || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={q.status} />
                    <Button 
                      size="sm" 
                      disabled={convertingId === q.id}
                      onClick={() => handleConvert(q)}
                    >
                      {convertingId === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <ArrowRight className="h-3.5 w-3.5 mr-1" />}
                      Convert
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  );
}
