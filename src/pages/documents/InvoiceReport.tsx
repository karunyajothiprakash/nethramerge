import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProformaInvoice } from "@/components/documents/ProformaInvoice";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvoiceReport() {
  const { id } = useParams();
  const nav = useNavigate();
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from("export_shipments")
          .select("*, export_orders(*)")
          .eq("id", id)
          .single();

        if (error) throw error;
        setShipment(data);
      } catch (err) {
        console.error("Report load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  if (!shipment) return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <p>Invoice not found</p>
      <Button onClick={() => nav("/documents/invoices")}><ArrowLeft className="h-4 w-4 mr-2" /> Back to Invoices</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <ProformaInvoice shipment={shipment} onClose={() => nav("/documents/invoices")} />
    </div>
  );
}
