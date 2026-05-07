import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function InvoicePreview() {
  const { id } = useParams();
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error: fetchErr } = await supabase
          .from("export_shipments")
          .select("*, export_orders(*)")
          .eq("id", id)
          .single();

        if (fetchErr) throw fetchErr;
        setShipment(data);

        // Fetch company and creator details
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
          if (userData) {
            orderData.creator_name = userData.full_name;
          }
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

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setDownloading(true);
    
    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice-${shipment.shipment_number || 'download'}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <div style={{ background: 'white', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
    </div>
  );

  if (error || !shipment) return (
    <div style={{ color: 'red', padding: '40px', background: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Failed to load invoice.</h2>
      <p>ID: {id}</p>
      <pre style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', color: '#d32f2f' }}>{error}</pre>
    </div>
  );

  const order = Array.isArray(shipment.export_orders) 
    ? (shipment.export_orders[0] || {}) 
    : (shipment.export_orders || {});
    
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const validityDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const totalAmount = Number(order.total_amount || 0);
  const currencySym = order.currency === 'USD' ? '$' : (order.currency || 'INR');

  return (
    <div style={{ background: '#f5f5f5', color: 'black', minHeight: '100vh', padding: '40px 20px', fontFamily: 'sans-serif' }} className="flex flex-col items-center">
      
      {/* Download Button Container */}
      <div className="mb-6 w-full max-w-[210mm] flex justify-end px-2">
        <Button 
          onClick={handleDownloadPDF} 
          disabled={downloading}
          className="bg-[#1A5276] text-white hover:bg-[#154360] shadow-lg rounded-full px-6 min-w-[160px]"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {downloading ? "Saving PDF..." : "Save as PDF"}
        </Button>
      </div>

      <div ref={invoiceRef} className="relative w-full max-w-[210mm] shadow-xl">
        {/* The Invoice Document */}
        <div className="bg-white text-black min-h-[297mm] flex flex-col relative border-[2px] border-black box-border">
          
          {/* Watermark Logo */}
          <div className="absolute top-[30%] left-[20%] right-[20%] bottom-[30%] z-0 flex items-center justify-center opacity-15 pointer-events-none">
            <img src="/logo.webp" alt="Watermark" className="w-full h-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>

          {/* Content Container (z-10) */}
          <div className="relative z-10 flex flex-col flex-1">
            
            {/* Header Row */}
            <div className="grid grid-cols-2 border-b-[2px] border-black min-h-[160px] bg-transparent">
              <div className="p-6 border-r-[2px] border-black flex flex-col justify-start">
                <h1 className="font-bold text-[14px] text-[#1A5276] mb-6 whitespace-nowrap overflow-visible leading-tight">SHASTIKA GLOBAL IMPEX PRIVATE LIMITED</h1>
                <div className="flex items-start gap-4">
                  <img src="/logo.webp" alt="Logo" className="w-20 h-20 object-contain mt-1" onError={(e) => e.currentTarget.style.display = 'none'} />
                  <div className="flex flex-col space-y-1.5 text-[10px]">
                    <div className="grid grid-cols-[60px_1fr]"><span>Address:</span> <span>41/1, ST-5, Sathy Athani Main Road,</span></div>
                    <div className="grid grid-cols-[60px_1fr]"><span></span> <span>Thuckanayakanpalayam</span></div>
                    <div className="grid grid-cols-[60px_1fr]"><span></span> <span>Erode - 638506, Tamil Nadu, India.</span></div>
                    <div className="grid grid-cols-[60px_1fr] mt-2"><span>Phone no:</span> <span className="font-bold">7397612015</span></div>
                    <div className="grid grid-cols-[60px_1fr]"><span>GSTIN:</span> <span className="font-bold">33ABPCS0605LIZ8</span></div>
                  </div>
                </div>
              </div>
              <div className="p-6 flex flex-col justify-start items-center">
                <h2 className="font-bold text-[16px] text-[#1A5276] tracking-wide mb-8 mt-2">PROFORMA INVOICE</h2>
                <div className="w-full max-w-[200px] text-[10px] space-y-4">
                  <div className="grid grid-cols-[90px_1fr]"><span>PI NO :</span> <span className="font-bold">{String(order.order_number || '').replace('EXP', 'PI') || 'TBD'}</span></div>
                  <div className="grid grid-cols-[90px_1fr]"><span>DATE :</span> <span className="font-bold">{today}</span></div>
                  <div className="grid grid-cols-[90px_1fr]"><span>VALID PI DATE :</span> <span className="font-bold">{validityDate}</span></div>
                </div>
              </div>
            </div>

            {/* Sub Header Titles */}
            <div className="grid grid-cols-[30%_35%_35%] border-b-[1px] border-black text-[10px] font-bold text-[#1A5276] uppercase text-center h-8 items-center bg-transparent">
              <div className="border-r-[1px] border-black h-full flex items-center justify-center">BILL TO :</div>
              <div className="border-r-[1px] border-black h-full flex items-center justify-center">SHIPMENT & TRADE TERMS</div>
              <div className="h-full flex items-center justify-center">PACKING DETAILS</div>
            </div>

            <div className="grid grid-cols-[30%_35%_35%] border-b-[2px] border-black min-h-[160px] text-[10px] bg-transparent">
              <div className="p-4 border-r-[1px] border-black">
                <div className="font-bold text-[12px]">{shipment.customer_name}</div>
                <div className="text-gray-800 mt-2 whitespace-pre-wrap leading-relaxed">{order.shipping_address || order.customer_country || ''}</div>
              </div>
              <div className="p-4 border-r-[1px] border-black relative">
                <div className="space-y-3 relative z-10">
                  <div className="grid grid-cols-[130px_1fr]"><span>Country of Origin :</span> <span className="font-bold">India</span></div>
                  <div className="grid grid-cols-[130px_1fr]"><span>Mode of Transport :</span> <span className="font-bold">Sea</span></div>
                  <div className="grid grid-cols-[130px_1fr]"><span>Incoterms :</span> <span className="font-bold">{order.incoterms || 'CIF'}</span></div>
                  <div className="grid grid-cols-[130px_1fr]"><span>Port of Loading :</span> <span className="font-bold">{shipment.origin_port}</span></div>
                  <div className="grid grid-cols-[130px_1fr]"><span>Port of Discharge :</span> <span className="font-bold">{shipment.destination_port}</span></div>
                  <div className="grid grid-cols-[130px_1fr]"><span>Estimated shipment date :</span> <span className="font-bold">{shipment.departure_date ? new Date(shipment.departure_date).toLocaleDateString('en-GB') : 'TBD'}</span></div>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-[90px_1fr]"><span>Packing Type:</span> <span className="font-bold">{order.packing_details || '13 Kg Box'}</span></div>
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-transparent">
              <table className="w-full border-collapse h-full bg-transparent">
                <thead>
                  <tr className="border-b-[1px] border-black text-[10px] font-bold text-[#1A5276] uppercase h-8 bg-transparent">
                    <th className="border-r-[1px] border-black w-10 text-center">ID</th>
                    <th className="border-r-[1px] border-black px-2 text-center">DESCRIPTION</th>
                    <th className="border-r-[1px] border-black w-20 text-center">HSN</th>
                    <th className="border-r-[1px] border-black w-20 text-center">QUANTITY</th>
                    <th className="border-r-[1px] border-black w-16 text-center">UNIT</th>
                    <th className="border-r-[1px] border-black w-24 text-center">PRICE</th>
                    <th className="w-28 text-center">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="text-[10px] bg-transparent">
                  <tr className="border-b-[1px] border-black h-10 align-top">
                    <td className="border-r-[1px] border-black text-center pt-2">1</td>
                    <td className="border-r-[1px] border-black px-2 pt-2">{order.product || ''}</td>
                    <td className="border-r-[1px] border-black text-center pt-2">{order.hsn_code || ''}</td>
                    <td className="border-r-[1px] border-black text-center pt-2">{order.quantity || ''}</td>
                    <td className="border-r-[1px] border-black text-center pt-2">{order.unit || ''}</td>
                    <td className="border-r-[1px] border-black text-center pt-2">
                      {order.unit_price ? `${currencySym} ${Number(order.unit_price).toLocaleString()}` : ''}
                    </td>
                    <td className="text-center pt-2">
                      {totalAmount ? `${currencySym} ${totalAmount.toLocaleString()}` : ''}
                    </td>
                  </tr>
                  {[...Array(4)].map((_, i) => (
                    <tr key={i} className="h-8 border-b-[1px] border-black">
                      <td className="border-r-[1px] border-black"></td>
                      <td className="border-r-[1px] border-black"></td>
                      <td className="border-r-[1px] border-black"></td>
                      <td className="border-r-[1px] border-black"></td>
                      <td className="border-r-[1px] border-black"></td>
                      <td className="border-r-[1px] border-black"></td>
                      <td></td>
                    </tr>
                  ))}
                  <tr className="h-full">
                    <td className="border-r-[1px] border-black"></td>
                    <td className="border-r-[1px] border-black"></td>
                    <td className="border-r-[1px] border-black"></td>
                    <td className="border-r-[1px] border-black"></td>
                    <td className="border-r-[1px] border-black"></td>
                    <td className="border-r-[1px] border-black"></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-[50%_50%] border-t-[2px] border-black min-h-[140px] bg-transparent">
              <div className="border-r-[2px] border-black text-[10px] flex flex-col justify-between bg-transparent">
                <div className="border-b-[1px] border-black p-3 flex-1">
                  <h4 className="font-bold text-[#1A5276] mb-1">Terms of Payment</h4>
                  <div className="whitespace-pre-wrap leading-tight">
                    {order.payment_terms || "90 % of the invoice value to be paid in advance, and the remaining 10 % of the invoice value to be paid after the loading of goods.\n\nNote : Including packing, loading and Transport."}
                  </div>
                </div>
                <div className="p-3">
                  <p className="leading-tight">Declaration : We hereby certify that the goods mentioned above are of Indian origin and the price and details stated in this proforma invoice are true and correct.</p>
                </div>
              </div>

              <div className="flex flex-col bg-transparent">
                <div className="flex flex-col border-b-[2px] border-black text-[10px]">
                  <div className="grid grid-cols-2 border-b-[1px] border-black px-3 py-1 bg-transparent">
                    <span>SUB TOTAL</span>
                    <span className="text-right">{currencySym} {totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 border-b-[1px] border-black px-3 py-1">
                    <span>Tax Rate</span>
                    <span className="text-right">0%</span>
                  </div>
                  <div className="grid grid-cols-2 border-b-[1px] border-black px-3 py-1">
                    <span>Tax</span>
                    <span className="text-right">0.00</span>
                  </div>
                  <div className="grid grid-cols-2 bg-[#BDD7EE] px-3 py-1 text-[11px] font-bold">
                    <span>Total</span>
                    <span className="text-right">{currencySym} {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="p-3 flex flex-col justify-between flex-1 text-[10px] min-h-[100px]">
                  <div className="mb-2 font-bold">FOR SHASTIKA GLOBAL IMPEX PRIVATE LIMITED</div>
                  <div className="mt-auto space-y-3 relative">
                    <div className="flex items-center gap-1">
                      <span className="font-bold">Authorized Signatory :</span>
                      <span className="border-b border-dotted border-black min-w-[100px] px-1">{order.creator_name || "............................"}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="font-bold">Seal & Sign :</div>
                      <div className="h-16 flex items-center justify-start">
                        {company?.signature_url ? (
                          <img 
                            src={company.signature_url} 
                            alt="Seal" 
                            className="h-full w-auto object-contain mix-blend-multiply" 
                            onError={(e) => e.currentTarget.style.display = 'none'}
                          />
                        ) : (
                          <div className="border-b border-dotted border-black w-full mt-4"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
