import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function InvoicePreview() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const autoDownload = searchParams.get("download") === "true";
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [hasAutoDownloaded, setHasAutoDownloaded] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try fetching as a Shipment first
        let { data, error: fetchErr } = await supabase
          .from("export_shipments")
          .select("*, export_orders(*)")
          .eq("id", id)
          .single();

        if (fetchErr) {
          // If not found, try fetching as an Order directly
          const { data: orderOnly, error: orderErr } = await supabase
            .from("export_orders")
            .select("*, export_shipments(*)")
            .eq("id", id)
            .single();

          if (orderErr) throw orderErr;
          
          const shipmentData = orderOnly.export_shipments?.[0] || {
            origin_port: 'TBD',
            destination_port: 'TBD',
            departure_date: null
          };
          
          setShipment({
            ...shipmentData,
            customer_name: orderOnly.customer_name,
            export_orders: orderOnly
          });
          data = { export_orders: orderOnly };
        } else {
          setShipment(data);
        }

        const orderData = Array.isArray(data.export_orders) ? data.export_orders[0] : data.export_orders;
        
        if (orderData?.company_id) {
          const { data: compData } = await supabase
            .from("companies")
            .select("signature_url")
            .eq("id", orderData.company_id)
            .single();
          setCompany(compData);
        }
        
        if (orderData?.created_by) {
          const { data: userData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", orderData.created_by)
            .single();
          if (userData) orderData.creator_name = userData.full_name;
        }
      } catch (err: any) {
        console.error("Report load error:", err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  useEffect(() => {
    if (autoDownload && !hasAutoDownloaded && !loading && shipment && invoiceRef.current) {
      setHasAutoDownloaded(true);
      setTimeout(() => {
        handleDownloadPDF();
      }, 1000);
    }
  }, [autoDownload, hasAutoDownloaded, loading, shipment]);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setDownloading(true);
    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice-${shipment?.shipment_number || 'download'}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Loader2 className="h-10 w-10 animate-spin text-[#1A5276]" />
    </div>
  );

  if (error || !shipment) return (
    <div className="p-10 bg-white min-h-screen font-sans text-red-600">
      <h2 className="text-2xl font-bold">Failed to load invoice.</h2>
      <pre className="mt-4 p-4 bg-gray-50 border">{error}</pre>
    </div>
  );

  const order = Array.isArray(shipment.export_orders) 
    ? (shipment.export_orders[0] || {}) 
    : (shipment.export_orders || {});
    
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const validityDate = order.valid_pi_date 
    ? new Date(order.valid_pi_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const totalAmount = Number(order.total_amount || 0);
  const currencySym = order.currency === 'USD' ? 'USD' : (order.currency || 'INR');

  return (
    <div className="bg-[#f0f2f5] min-h-screen py-10 flex flex-col items-center print:bg-white print:py-0">
      
      {/* Controls */}
      <div className="mb-6 w-full max-w-[210mm] flex justify-end gap-3 print:hidden px-4">
        <Button 
          variant="outline"
          onClick={() => window.print()}
          className="rounded-full border-[#1A5276] text-[#1A5276] hover:bg-[#1A5276]/5"
        >
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
        <Button 
          onClick={handleDownloadPDF} 
          disabled={downloading}
          className="bg-[#1A5276] text-white hover:bg-[#154360] shadow-lg rounded-full px-6"
        >
          {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          {downloading ? "Generating PDF..." : "Save as PDF"}
        </Button>
      </div>

      <div ref={invoiceRef} className="bg-white w-full max-w-[210mm] shadow-2xl print:shadow-none border-[1.5px] border-black text-black font-sans leading-tight">
        
        {/* Document Header Section */}
        <div className="grid grid-cols-[55%_45%] border-b-[1.5px] border-black">
          {/* Left Side: Logo & Company Address */}
          <div className="p-5 border-r-[1.5px] border-black flex flex-col items-center">
            <h1 className="text-[13px] font-extrabold text-[#1A5276] mb-5 tracking-tight">SHASTIKA GLOBAL IMPEX PRIVATE LIMITED</h1>
            <div className="flex w-full items-start gap-4">
              <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center">
                <img src="/logo.webp" alt="SGI Logo" className="w-full h-auto object-contain" />
              </div>
              <div className="flex flex-col text-[9.5px] space-y-1 text-gray-800 pt-1">
                <div className="flex gap-2"><span>Address:</span> <span className="font-medium">41/1, ST-5, Sathy Athani Main Road,</span></div>
                <div className="flex gap-2 ml-11"><span></span> <span className="font-medium">Thuckanayakanpalayam</span></div>
                <div className="flex gap-2 ml-11"><span></span> <span className="font-medium">Erode - 638506, Tamil Nadu, India.</span></div>
                <div className="flex gap-2 mt-2"><span>Phone no:</span> <span className="font-bold text-black">7397612015</span></div>
                <div className="flex gap-2"><span>GSTIN:</span> <span className="font-bold text-black">33ABPCS0605LIZ8</span></div>
              </div>
            </div>
          </div>

          {/* Right Side: Document Title & Details */}
          <div className="p-5 flex flex-col">
            <h2 className="text-[15px] font-extrabold text-[#1A5276] text-center mb-6 tracking-wider">PROFORMA INVOICE</h2>
            <div className="w-full space-y-4 text-[10px] pl-10">
              <div className="grid grid-cols-[100px_1fr] items-center">
                <span className="text-gray-700">PI NO :</span>
                <span className="font-bold">{String(order.order_number || '').replace('EXP', '034/26-27')}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center">
                <span className="text-gray-700">DATE :</span>
                <span className="font-bold">{today}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center">
                <span className="text-gray-700">VALID PI DATE :</span>
                <span className="font-bold">{validityDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Headers */}
        <div className="grid grid-cols-[30%_35%_35%] border-b-[1.5px] border-black text-[10px] font-bold text-[#1A5276] bg-[#f8fafc]">
          <div className="border-r-[1.5px] border-black py-2 px-4 text-center">BILL TO :</div>
          <div className="border-r-[1.5px] border-black py-2 px-4 text-center">SHIPMENT & TRADE TERMS</div>
          <div className="py-2 px-4 text-center">PACKING DETAILS</div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-[30%_35%_35%] border-b-[1.5px] border-black min-h-[160px] text-[10px]">
          {/* Bill To */}
          <div className="p-4 border-r-[1.5px] border-black flex flex-col justify-between">
            <div className="space-y-1">
              <div className="font-bold text-[11px] mb-2 uppercase">{shipment.customer_name || 'Customer Name'}</div>
              <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {order.shipping_address || 'Address Line 1\nAddress Line 2\nCity, State, Zip'}
              </div>
            </div>
            <div className="mt-4 space-y-1 font-semibold">
              <div>GST- {order.customer_gst || '—'}</div>
              <div>Phone no : {order.customer_phone || '—'}</div>
            </div>
          </div>

          {/* Shipment Terms */}
          <div className="p-4 border-r-[1.5px] border-black space-y-3">
            <div className="grid grid-cols-[130px_1fr]"><span>Country of Origin :</span> <span className="font-bold">India</span></div>
            <div className="grid grid-cols-[130px_1fr]"><span>Mode of Transport :</span> <span className="font-bold">{order.mode_of_transport || 'Nil'}</span></div>
            <div className="grid grid-cols-[130px_1fr]"><span>Incoterms :</span> <span className="font-bold">{order.incoterms || '—'}</span></div>
            <div className="grid grid-cols-[130px_1fr]"><span>Port of Loading :</span> <span className="font-bold">{shipment.origin_port || 'Erode'}</span></div>
            <div className="grid grid-cols-[130px_1fr]"><span>Port of Discharge :</span> <span className="font-bold">{shipment.destination_port || 'Nil'}</span></div>
            <div className="grid grid-cols-[130px_1fr]"><span>Estimated shipment date :</span> <span className="font-bold">{shipment.departure_date ? new Date(shipment.departure_date).toLocaleDateString('en-GB') : today}</span></div>
          </div>

          {/* Packing Details */}
          <div className="p-4 flex flex-col justify-center space-y-4">
            <div className="grid grid-cols-[90px_1fr]"><span>Packing Type:</span> <span className="font-bold">{order.packing_details || 'Plastic Bag'}</span></div>
            <div className="grid grid-cols-[90px_1fr]"><span>Net weight :</span> <span className="font-bold">{order.net_weight || '13.200 g'}</span></div>
            <div className="grid grid-cols-[90px_1fr]"><span>Gross Weight :</span> <span className="font-bold">{order.gross_weight || '56760 kg'}</span></div>
          </div>
        </div>

        {/* Table Section */}
        <div className="flex-1">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-[1.5px] border-black text-[9px] font-bold text-[#1A5276] uppercase">
                <th className="border-r-[1.5px] border-black w-10 py-2">ID</th>
                <th className="border-r-[1.5px] border-black px-4 py-2 text-left">DESCRIPTION</th>
                <th className="border-r-[1.5px] border-black w-24 py-2">HSN</th>
                <th className="border-r-[1.5px] border-black w-32 py-2">QUANTITY</th>
                <th className="border-r-[1.5px] border-black w-24 py-2">UNIT</th>
                <th className="border-r-[1.5px] border-black w-28 py-2">PRICE</th>
                <th className="w-32 py-2">AMOUNT</th>
              </tr>
            </thead>
            <tbody className="text-[10px]">
              <tr className="border-b border-black h-14">
                <td className="border-r border-black text-center">1</td>
                <td className="border-r border-black px-4 font-medium leading-relaxed">
                  {order.product || 'Semi Husked Biscuit Colour Coconut'}
                </td>
                <td className="border-r border-black text-center font-mono">{order.hsn_code || '8011910'}</td>
                <td className="border-r border-black text-center font-bold">{order.quantity || '4300'} Bag</td>
                <td className="border-r border-black text-center font-bold">56760</td>
                <td className="border-r border-black text-center font-bold">43 Kg</td>
                <td className="text-center font-bold">{currencySym} {totalAmount ? totalAmount.toLocaleString() : '24406...'}</td>
              </tr>
              {/* Empty Rows for spacing like the image */}
              {[...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-gray-200 h-10">
                  <td className="border-r border-black"></td>
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

        {/* Totals Section */}
        <div className="grid grid-cols-[55%_45%] border-t-[1.5px] border-black min-h-[140px]">
          <div className="border-r-[1.5px] border-black flex flex-col">
            <div className="p-4 border-b border-black flex-1">
              <h4 className="text-[10px] font-bold text-[#1A5276] mb-1">Terms of Payment</h4>
              <p className="text-[9px] leading-relaxed text-gray-800">
                {order.payment_terms || "90 % of the invoice value to be paid in advance, and the remaining 10 % of the invoice value to be paid after the loading of goods.\n\nNote : Including packing, loading and Transport."}
              </p>
            </div>
            <div className="p-4 bg-gray-50/50">
              <p className="text-[9px] italic text-gray-600">Declaration: We hereby certify that the goods mentioned above are of Indian origin and the price and details stated are true and correct.</p>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="border-b border-black">
              {[
                { label: 'SUB TOTAL', value: totalAmount },
                { label: 'Tax Rate', value: '0%' },
                { label: 'Tax', value: '0.00' }
              ].map((item, i) => (
                <div key={i} className="grid grid-cols-2 px-4 py-2 text-[10px] border-b border-gray-100 last:border-0">
                  <span className="text-gray-700 font-medium">{item.label}</span>
                  <span className="text-right font-bold">{typeof item.value === 'number' ? `${currencySym} ${item.value.toLocaleString()}` : item.value}</span>
                </div>
              ))}
              <div className="grid grid-cols-2 px-4 py-2.5 text-[11px] font-extrabold bg-[#BDD7EE] text-[#1A5276]">
                <span>TOTAL</span>
                <span className="text-right">{currencySym} {totalAmount.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="p-4 flex flex-col flex-1 justify-between text-[10px]">
              <div className="font-extrabold text-[9px] uppercase tracking-tighter">FOR SHASTIKA GLOBAL IMPEX PRIVATE LIMITED</div>
              <div className="space-y-4 mt-4">
                <div className="flex items-end gap-2">
                  <span className="font-bold text-[9px] mb-1">Authorized Signatory:</span>
                  <div className="flex-1 border-b border-dotted border-black h-4 px-2 italic text-gray-600">
                    {order.creator_name || 'Karunakaran'}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-[9px]">Seal & Sign:</span>
                  <div className="h-14 w-32 flex items-center justify-center border border-gray-100 rounded">
                    {company?.signature_url ? (
                      <img src={company.signature_url} alt="Seal" className="h-full w-auto object-contain mix-blend-multiply" />
                    ) : (
                      <div className="text-[8px] text-gray-300">Place Seal Here</div>
                    )}
                  </div>
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
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 0; }
          body { background: white !important; margin: 0 !important; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print\\:hidden { display: none !important; }
          .max-w-\\[210mm\\] { max-width: 100% !important; margin: 0 !important; width: 100% !important; border: none !important; box-shadow: none !important; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
        .font-sans { font-family: 'Inter', sans-serif !important; }
      `}} />
    </div>
  );
}
