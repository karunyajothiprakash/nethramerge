import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QuotationDocument } from "@/components/quotations/QuotationDocument";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuotationReport() {
  const { id } = useParams();
  const nav = useNavigate();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from("quotations")
          .select(`
            *,
            customer:customers(*),
            quotation_items (
              *,
              product:products(*)
            )
          `)
          .eq("id", id)
          .single();

        if (error) throw error;
        setQuotation(data);
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

  if (!quotation) return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <p>Quotation not found</p>
      <Button onClick={() => nav("/quotations")}><ArrowLeft className="h-4 w-4 mr-2" /> Back to Quotations</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <QuotationDocument quotation={quotation} onClose={() => nav("/quotations")} />
    </div>
  );
}
