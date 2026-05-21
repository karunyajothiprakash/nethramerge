import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Download, Edit, Send, Mail, Loader2, Copy, FileText, Printer, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { exportQuotationsToPDF } from "@/lib/quotation-export";

export default function QuotationPreview() {
  const { id } = useParams();
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const { data: q, isLoading, refetch } = useQuery({
    queryKey: ['quotation', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          customer:customers(name, email, address, phone),
          items:quotation_items(
            *,
            product:products(name, sku, unit, hs_code)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("quotations")
        .update({ status: "Pending" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Quotation sent for approval");
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send quotation");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("quotations")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Quotation deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      nav("/quotations");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete quotation");
    }
  });

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete quotation ${q?.quotation_number}? This action cannot be undone.`)) {
      deleteMutation.mutate();
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/share/quote/${id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Public share link copied to clipboard!");
  };

  const handleEmail = () => {
    const shareUrl = `${window.location.origin}/share/quote/${id}`;
    const subject = encodeURIComponent(`Quotation ${q.quotation_number} from Shastika Global`);
    const body = encodeURIComponent(`Dear ${q.customer?.name || 'Customer'},\n\nPlease find our quotation ${q.quotation_number} at the link below:\n\n${shareUrl}\n\nBest regards,\nShastika Global Team`);
    window.location.href = `mailto:${q.customer?.email || ''}?subject=${subject}&body=${body}`;
  };

  const handleExport = () => {
    try {
      const formatted = {
        ...q,
        customer_name: q.customer?.name || q.customer_name || "Unknown"
      };
      exportQuotationsToPDF([formatted], false);
      toast.success("PDF file downloaded");
    } catch (err) {
      toast.error("Failed to generate PDF");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  if (!q) return <div className="p-12 text-center text-muted-foreground">Quotation not found.</div>;

  return (
    <div>
      <PageHeader 
        title={q.quotation_number} 
        description="Quotation detail & sharing" 
        breadcrumbs={[{ label: "Quotations", to: "/quotations" }, { label: q.quotation_number }]}
        actions={<>
          <Button variant="outline" size="sm" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" />Back</Button>
          <Button variant="outline" size="sm" onClick={() => nav(`/quotations/edit/${id}`)}><Edit className="h-4 w-4 mr-1.5" />Edit</Button>
          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 border-destructive/30" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1.5" />}Delete
          </Button>
          <Button variant="outline" size="sm" onClick={() => nav(`/quotations/${id}/report`)} className="bg-[#1A5276]/10 text-[#1A5276] border-[#1A5276]/20"><Printer className="h-4 w-4 mr-1.5" />Print Report</Button>
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1.5" />PDF</Button>
          <Button variant="outline" size="sm" onClick={handleShare}><Copy className="h-4 w-4 mr-1.5" />Share Link</Button>
          <Button variant="outline" size="sm" onClick={handleEmail}><Mail className="h-4 w-4 mr-1.5" />Email</Button>
          <Button 
            size="sm" 
            className="btn-gold" 
            onClick={() => sendMutation.mutate()} 
            disabled={sendMutation.isPending || q.status !== 'Draft'}
          >
            {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
            {q.status === 'Draft' ? 'Send for Approval' : 'Sent'}
          </Button>
        </>}
      />
      <div className="max-w-[210mm] mx-auto space-y-6">
        {/* Document Frame styled exactly like the official template */}
        <div className="relative bg-white shadow-2xl border-[1.5px] border-black text-black leading-tight font-sans">
          
          {/* Header Section */}
          <div className="grid grid-cols-[55%_45%] border-b-[1.5px] border-black">
            <div className="p-4 border-r-[1.5px] border-black flex flex-col items-center">
              <h1 className="text-[12px] font-extrabold text-[#1A5276] mb-4 tracking-tight uppercase">SHASTIKA GLOBAL IMPEX PRIVATE LIMITED</h1>
              <div className="flex w-full items-start gap-4">
                <div className="w-20 h-20 flex-shrink-0">
                  <img src="/logo.webp" alt="Logo" className="w-full h-auto object-contain" />
                </div>
                <div className="flex flex-col text-[9px] space-y-1 text-gray-800">
                  <div className="flex gap-2"><span>Address:</span> <span className="font-bold">41/1, ST-5, Sathy Athani Main Road,</span></div>
                  <div className="flex gap-2 ml-12"><span className="font-bold">Thuckanayakanpalayam</span></div>
                  <div className="flex gap-2 ml-12"><span className="font-bold">Erode - 638506, Tamil Nadu, India.</span></div>
                  <div className="flex gap-2 mt-2"><span>Phone  :</span> <span className="font-bold text-black">+91 7397612015</span></div>
                  <div className="flex gap-2"><span>GSTIN  :</span> <span className="font-bold text-black">33ABPCS0605LIZ8</span></div>
                  <div className="flex gap-2"><span>whatsapp number :</span> <span className="font-bold text-black">+91 9566266241</span></div>
                </div>
              </div>
            </div>
            <div className="p-4 flex flex-col items-center">
              <h2 className="text-[14px] font-extrabold text-[#1A5276] mb-4 tracking-wider uppercase">QUOTATION</h2>
              <div className="w-full space-y-2 text-[9.5px] pl-8">
                <div className="grid grid-cols-[100px_1fr]"><span>Quotation No :</span> <span className="font-bold">{q.quotation_number}</span></div>
                <div className="grid grid-cols-[100px_1fr]"><span>Date :</span> <span className="font-bold">{new Date(q.created_at).toLocaleDateString('en-GB')}</span></div>
                <div className="grid grid-cols-[100px_1fr]"><span>Valid Until :</span> <span className="font-bold">{q.valid_until ? new Date(q.valid_until).toLocaleDateString('en-GB') : 'TBD'}</span></div>
                <div className="grid grid-cols-[100px_1fr]"><span>Currency :</span> <span className="font-bold">{q.currency || 'INR'}</span></div>
                <div className="grid grid-cols-[100px_1fr]"><span>Incoterm :</span> <span className="font-bold">{q.incoterms || q.incoterm || 'CIF'}</span></div>
                <div className="grid grid-cols-[100px_1fr]"><span>Packing Method :</span> <span className="font-bold">{q.packaging_type || '---'}</span></div>
                <div className="grid grid-cols-[100px_1fr]"><span>Packing Charge :</span> <span className="font-bold">{q.currency || 'INR'} {Number(q.packaging_cost || 0).toFixed(2)}</span></div>
                <div className="grid grid-cols-[100px_1fr]"><span>Net Weight :</span> <span className="font-bold">{q.net_weight || '---'}</span></div>
              </div>
            </div>
          </div>

          {/* Grid Row 1 (2 cols) */}
          <div className="grid grid-cols-[55%_45%] border-b-[1.5px] border-black text-[9px] font-bold text-[#1A5276] bg-[#f8fafc] uppercase tracking-tighter">
            <div className="border-r-[1.5px] border-black py-1.5 text-center">BILL TO :</div>
            <div className="py-1.5 text-center">TERMS OF PAYMENT</div>
          </div>
          <div className="grid grid-cols-[55%_45%] border-b-[1.5px] border-black min-h-[100px] text-[10px]">
            <div className="p-3 border-r-[1.5px] border-black flex flex-col text-gray-800 leading-tight">
              <div className="text-[10px] uppercase font-normal mb-1">{q.customer?.name || q.customer_name || 'Customer Name'}</div>
              <div className="text-[9px] whitespace-pre-wrap font-normal mb-2">
                {q.customer?.address || q.customer_address || 'Address not provided'}
              </div>
              {(q.customer_phone || q.customer?.phone) && (
                <div className="text-[9px] font-normal">
                  Phone no : {q.customer_phone || q.customer?.phone}
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="text-[9px] leading-tight text-gray-800 whitespace-pre-wrap">
                {q.payment_terms || "Standard payment terms apply."}
              </p>
            </div>
          </div>

          {/* Grid Row 2 (2 cols) */}
          <div className="grid grid-cols-[60%_40%] border-b-[1.5px] border-black text-[10px] font-bold text-[#1A5276] bg-[#f8fafc]">
            <div className="border-r-[1.5px] border-black py-1.5 text-center">SHIPMENT &amp; TRADE TERMS</div>
            <div className="py-1.5 text-center">TRANSPORT DETAILS</div>
          </div>
          <div className="grid grid-cols-[60%_40%] border-b-[1.5px] border-black min-h-[120px] text-[10px]">
            <div className="p-4 border-r-[1.5px] border-black space-y-2">
              <div className="grid grid-cols-[130px_1fr]"><span>Country of Origin :</span> <span className="font-bold">{q.country_of_origin || '---'}</span></div>
              <div className="grid grid-cols-[130px_1fr]"><span>Mode of Transport :</span> <span className="font-bold">{q.mode_of_transport || q.shipment_type || '---'}</span></div>
              <div className="grid grid-cols-[130px_1fr]"><span>Incoterms :</span> <span className="font-bold">{q.incoterms || q.incoterm || '---'}</span></div>
              <div className="grid grid-cols-[130px_1fr]"><span>Port of Loading :</span> <span className="font-bold">{q.port_of_loading || '---'}</span></div>
              <div className="grid grid-cols-[130px_1fr]"><span>Port of Discharge :</span> <span className="font-bold">{q.port_of_discharge || '---'}</span></div>
            </div>
            <div className="p-4 space-y-2">
              <div className="grid grid-cols-[110px_1fr]"><span>Transport :</span> <span className="font-bold">{q.shipment_type || q.mode_of_transport || '---'}</span></div>
              <div className="grid grid-cols-[110px_1fr]"><span>Transport Charges :</span> <span className="font-bold">{q.currency || 'INR'} {Number(q.shipping_cost || 0).toLocaleString()}</span></div>
            </div>
          </div>

          {/* Table Section */}
          <div className="flex-1 min-h-[250px]">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="border-b-[1.5px] border-black text-[8px] font-bold text-[#1A5276] uppercase bg-[#f8fafc]">
                  <th className="border-r-[1.5px] border-black w-[5%] py-2 text-center">ID</th>
                  <th className="border-r-[1.5px] border-black w-[45%] px-4 py-2 text-left">DESCRIPTION</th>
                  <th className="border-r-[1.5px] border-black w-[12%] py-2 text-center">HSN</th>
                  <th className="border-r-[1.5px] border-black w-[13%] py-2 text-center">QUANTITY</th>
                  <th className="border-r-[1.5px] border-black w-[12%] py-2 text-center text-[7px]">UNIT PRICE ({q.currency || 'INR'})</th>
                  <th className="w-[13%] py-2 text-center text-[7px]">AMOUNT ({q.currency || 'INR'})</th>
                </tr>
              </thead>
              <tbody className="text-[10px]">
                {(q.items || []).map((item: any, i: number) => (
                  <tr key={i} className="border-b border-black min-h-[40px]">
                    <td className="border-r border-black text-center py-2">{i + 1}</td>
                    <td className="border-r border-black px-4 py-2 font-medium leading-tight text-[9px] break-words">
                      {item.description || item.product?.name || item.product_name || 'Product'}
                    </td>
                    <td className="border-r border-black text-center py-2 font-mono text-[9px]">{item.hsn_code || item.product?.hs_code || '—'}</td>
                    <td className="border-r border-black text-center py-2 font-bold">{item.quantity}</td>
                    <td className="border-r border-black text-right pr-4 py-2 font-bold">{Number(item.unit_price).toFixed(2)}</td>
                    <td className="text-right pr-4 py-2 font-bold">{Number(item.total_price || (item.quantity * item.unit_price)).toFixed(2)}</td>
                  </tr>
                ))}
                {/* Fill remaining space with empty rows to maintain grid alignment */}
                {[...Array(Math.max(0, 6 - (q.items || []).length))].map((_, i) => (
                  <tr key={`e-${i}`} className="border-b border-gray-100 h-10">
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="grid grid-cols-[55%_45%] border-t-[1.5px] border-black min-h-[140px]">
            <div className="border-r-[1.5px] border-black flex flex-col">
              <div className="p-3 border-b border-black flex-1">
                <h4 className="text-[10px] font-bold text-[#1A5276] mb-2 uppercase">NOTE</h4>
                <p className="text-[9px] leading-relaxed text-gray-800 whitespace-pre-wrap">
                  {q.notes || "Including packing, loading and Transport."}
                </p>
              </div>
              <div className="p-3">
                <p className="text-[8px] uppercase font-bold text-gray-700 mb-4">DECLARATION</p>
                <p className="text-[8.5px] italic text-gray-600 leading-tight">We hereby certify that the goods mentioned above are of Indian origin and the price and details stated in this quotation are true and correct.</p>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="border-b border-black">
                <div className="grid grid-cols-2 px-4 py-1.5 text-[10px]">
                  <span className="text-gray-700 font-bold uppercase">SUB TOTAL</span>
                  <span className="text-right font-bold">{q.currency || 'INR'} {Number(q.subtotal || 0).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 px-4 py-1.5 text-[10px]">
                  <span className="text-gray-700 font-bold uppercase">PACKING CHARGE</span>
                  <span className="text-right font-bold">{q.currency || 'INR'} {Number(q.packaging_cost || 0).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 px-4 py-1.5 text-[10px]">
                  <span className="text-gray-700 font-bold uppercase">TRANSPORT CHARGES</span>
                  <span className="text-right font-bold">{q.currency || 'INR'} {Number(q.shipping_cost || 0).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 px-4 py-1.5 text-[10px]">
                  <span className="text-gray-700 font-bold uppercase">TAX</span>
                  <span className="text-right font-bold">{q.currency || 'INR'} {Number(q.tax_amount || 0).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 px-4 py-2 text-[11px] font-black bg-[#BDD7EE] text-[#1A5276] border-t border-black">
                  <span>TOTAL AMOUNT</span>
                  <span className="text-right">{q.currency || 'INR'} {Number(q.amount || 0).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="p-4 flex flex-col flex-1 justify-between text-[10px]">
                <div className="font-extrabold text-[9px] uppercase tracking-tighter text-right">FOR SHASTIKA GLOBAL IMPEX PRIVATE LIMITED</div>
                <div className="space-y-4 mt-6">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[9.5px]">Authorized Signatory :</span>
                    <div className="flex-1 border-b border-dotted border-black h-4 px-2 italic text-gray-400 font-normal">__________________________</div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="font-bold text-[9.5px] pt-1">Seal &amp; Sign :</span>
                    <div className="h-16 w-36 border border-black rounded flex items-center justify-center text-gray-300 text-[8px]">STAMP BOX</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Watermark Logo */}
          <div className="absolute top-[35%] left-[20%] right-[20%] z-0 opacity-10 pointer-events-none select-none">
            <img src="/logo.webp" alt="Watermark" className="w-full h-auto object-contain" />
          </div>

        </div>

        {/* Bottom Actions Overlay (Awaiting approval / convert) */}
        <div className="flex items-center justify-between p-6 bg-card border rounded-2xl shadow-lg">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Document Verified · Shastika Secure</div>
          </div>
          
          <div className="flex items-center gap-3">
            {q.status === "Approved" ? (
              <Button className="btn-gold shadow-gold/20" onClick={() => nav("/quotations/convert")}>
                Convert to Order <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : q.status === "Pending" ? (
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
                <Loader2 className="h-4 w-4 animate-spin" />
                Awaiting Approval
              </div>
            ) : q.status === "Converted" ? (
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                ✓ Converted to Order
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
