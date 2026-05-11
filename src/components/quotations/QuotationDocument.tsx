import React, { useRef, useState } from "react";
import { Download, X, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Loader2 } from "lucide-react";

interface QuotationDocumentProps {
  quotation: any;
  onClose: () => void;
  autoDownload?: boolean;
}

export function QuotationDocument({ quotation, onClose, autoDownload = false }: QuotationDocumentProps) {
  if (!quotation) return null;
  const docRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [hasAutoDownloaded, setHasAutoDownloaded] = useState(false);

  React.useEffect(() => {
    if (autoDownload && !hasAutoDownloaded && !downloading && docRef.current) {
      setHasAutoDownloaded(true);
      // Small delay to ensure styles are applied
      setTimeout(() => {
        handleDownloadPDF();
      }, 1000);
    }
  }, [autoDownload, hasAutoDownloaded, downloading]);

  const handleDownloadPDF = async () => {
    if (!docRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(docRef.current, {
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
      pdf.save(`Quotation-${quotation.quotation_number || 'download'}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setDownloading(false);
    }
  };

  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const validityDate = quotation.valid_until
    ? new Date(quotation.valid_until).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'TBD';

  const totalAmount = Number(quotation.amount || 0);
  const currencySym = quotation.currency === 'USD' ? 'USD' : quotation.currency === 'EUR' ? 'EUR' : (quotation.currency || 'INR');
  const items = quotation.quotation_items || quotation.items || [];

  return (
    <div style={{ background: '#f0f2f5', color: 'black', minHeight: '100vh', padding: '40px 20px', fontFamily: 'sans-serif' }} className="flex flex-col items-center print:bg-white print:p-0">

      {/* Top Controls */}
      <div className="mb-6 w-full max-w-[210mm] flex justify-between items-center px-4 print:hidden">
        <Button
          variant="outline"
          onClick={onClose}
          className="rounded-full border-[#1A5276] text-[#1A5276] hover:bg-[#1A5276]/5"
        >
          <X className="h-4 w-4 mr-2" /> Close
        </Button>
        <div className="flex gap-3">
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
            className="bg-[#1A5276] text-white hover:bg-[#154360] shadow-lg rounded-full px-6 min-w-[160px]"
          >
            {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {downloading ? "Generating PDF..." : "Save as PDF"}
          </Button>
        </div>
      </div>

      {/* Document */}
      <div ref={docRef} className="bg-white w-full max-w-[210mm] shadow-2xl print:shadow-none border-[1.5px] border-black text-black leading-tight">
        
        {/* Header Section */}
        <div className="grid grid-cols-[55%_45%] border-b-[1.5px] border-black">
          <div className="p-5 border-r-[1.5px] border-black flex flex-col items-center">
            <h1 className="text-[13px] font-extrabold text-[#1A5276] mb-5 tracking-tight uppercase">SHASTIKA GLOBAL IMPEX PRIVATE LIMITED</h1>
            <div className="flex w-full items-start gap-4">
              <div className="w-24 h-24 flex-shrink-0">
                <img src="/logo.webp" alt="Logo" className="w-full h-auto object-contain" />
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
          <div className="p-5 flex flex-col">
            <h2 className="text-[15px] font-extrabold text-[#1A5276] text-center mb-6 tracking-wider uppercase">OFFICIAL QUOTATION</h2>
            <div className="w-full space-y-4 text-[10px] pl-10">
              <div className="grid grid-cols-[100px_1fr] items-center">
                <span className="text-gray-700">QUOTE NO :</span>
                <span className="font-bold">{quotation.quotation_number}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center">
                <span className="text-gray-700">DATE :</span>
                <span className="font-bold">{today}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center">
                <span className="text-gray-700">VALID UNTIL :</span>
                <span className="font-bold">{validityDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Headers */}
        <div className="grid grid-cols-[30%_35%_35%] border-b-[1.5px] border-black text-[10px] font-bold text-[#1A5276] bg-[#f8fafc]">
          <div className="border-r-[1.5px] border-black py-2 px-4 text-center">QUOTED TO :</div>
          <div className="border-r-[1.5px] border-black py-2 px-4 text-center">SHIPMENT &amp; TRADE TERMS</div>
          <div className="py-2 px-4 text-center">PACKING DETAILS</div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-[30%_35%_35%] border-b-[1.5px] border-black min-h-[160px] text-[10px]">
          <div className="p-4 border-r-[1.5px] border-black flex flex-col justify-between">
            <div className="space-y-1">
              <div className="font-bold text-[11px] mb-2 uppercase">{quotation.customer?.name || quotation.customer_name || 'Customer Name'}</div>
              <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {quotation.customer?.address || 'Address Line 1\nAddress Line 2\nCity, State, Zip'}
              </div>
            </div>
            <div className="mt-4 space-y-1 font-semibold">
              <div>GST- {quotation.customer_gst || quotation.customer?.gst_number || '—'}</div>
              <div>Phone no : {quotation.customer_phone || quotation.customer?.phone || '—'}</div>
            </div>
          </div>

          <div className="p-4 border-r-[1.5px] border-black space-y-3">
            <div className="grid grid-cols-[130px_1fr]"><span>Country of Origin :</span> <span className="font-bold">India</span></div>
            <div className="grid grid-cols-[130px_1fr]"><span>Mode of Transport :</span> <span className="font-bold">{quotation.mode_of_transport || 'Sea'}</span></div>
            <div className="grid grid-cols-[130px_1fr]"><span>Incoterms :</span> <span className="font-bold">{quotation.incoterms || 'CIF'}</span></div>
            <div className="grid grid-cols-[130px_1fr]"><span>Shipment Type :</span> <span className="font-bold">{quotation.shipment_type || 'FCL'}</span></div>
            <div className="grid grid-cols-[130px_1fr]"><span>Port of Loading :</span> <span className="font-bold">{quotation.port_of_loading || 'CHENNAI PORT'}</span></div>
            <div className="grid grid-cols-[130px_1fr]"><span>Port of Discharge :</span> <span className="font-bold">{quotation.port_of_discharge || 'TBD'}</span></div>
          </div>

          <div className="p-4 flex flex-col justify-center space-y-4">
            <div className="grid grid-cols-[90px_1fr]"><span>Packing Type:</span> <span className="font-bold">{quotation.packaging_type || 'Standard Export Packing'}</span></div>
            <div className="grid grid-cols-[90px_1fr]"><span>Net weight :</span> <span className="font-bold">{quotation.net_weight || '—'}</span></div>
            <div className="grid grid-cols-[90px_1fr]"><span>Gross Weight :</span> <span className="font-bold">{quotation.gross_weight || '—'}</span></div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-[1.5px] border-black text-[9px] font-bold text-[#1A5276] uppercase">
                <th className="border-r-[1.5px] border-black w-10 py-2 text-center">ID</th>
                <th className="border-r-[1.5px] border-black px-4 py-2 text-left">DESCRIPTION</th>
                <th className="border-r-[1.5px] border-black w-24 py-2 text-center">HSN</th>
                <th className="border-r-[1.5px] border-black w-32 py-2 text-center">QUANTITY</th>
                <th className="border-r-[1.5px] border-black w-24 py-2 text-center">UNIT</th>
                <th className="border-r-[1.5px] border-black w-28 py-2 text-center">PRICE</th>
                <th className="w-32 py-2 text-center">AMOUNT</th>
              </tr>
            </thead>
            <tbody className="text-[10px]">
              {items.map((item: any, i: number) => (
                <tr key={i} className="border-b border-black h-12">
                  <td className="border-r border-black text-center">{i + 1}</td>
                  <td className="border-r border-black px-4 font-medium leading-relaxed">
                    {item.product?.name || item.products?.name || item.description || 'Product Name'}
                  </td>
                  <td className="border-r border-black text-center font-mono">{item.product?.hs_code || item.products?.hs_code || '—'}</td>
                  <td className="border-r border-black text-center font-bold">{item.quantity}</td>
                  <td className="border-r border-black text-center font-bold">{item.product?.unit || item.products?.unit || 'KG'}</td>
                  <td className="border-r border-black text-center font-bold">{currencySym} {Number(item.unit_price).toLocaleString()}</td>
                  <td className="text-center font-bold">{currencySym} {Number(item.total_price || (item.quantity * item.unit_price)).toLocaleString()}</td>
                </tr>
              ))}
              {[...Array(Math.max(0, 6 - items.length))].map((_, i) => (
                <tr key={`e-${i}`} className="border-b border-gray-200 h-10">
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

        {/* Footer */}
        <div className="grid grid-cols-[55%_45%] border-t-[1.5px] border-black min-h-[140px]">
          <div className="border-r-[1.5px] border-black flex flex-col">
            <div className="p-4 border-b border-black flex-1">
              <h4 className="text-[10px] font-bold text-[#1A5276] mb-1">Terms of Payment</h4>
              <p className="text-[9px] leading-relaxed text-gray-800 whitespace-pre-wrap">
                {quotation.payment_terms || "Standard payment terms apply."}
              </p>
            </div>
            <div className="p-4 bg-gray-50/50">
              <p className="text-[9px] italic text-gray-600">Declaration: We hereby certify that the price and details stated in this quotation are true and correct.</p>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="border-b border-black">
              <div className="grid grid-cols-2 px-4 py-2 text-[10px] border-b border-gray-100">
                <span className="text-gray-700 font-medium">SUB TOTAL</span>
                <span className="text-right font-bold">{currencySym} {Number(quotation.subtotal || totalAmount).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 px-4 py-2 text-[10px] border-b border-gray-100">
                <span className="text-gray-700 font-medium">Tax Rate</span>
                <span className="text-right font-bold">{quotation.tax_rate || 0}%</span>
              </div>
              <div className="grid grid-cols-2 px-4 py-2 text-[10px] border-b border-gray-100">
                <span className="text-gray-700 font-medium">Packaging Cost</span>
                <span className="text-right font-bold">{currencySym} {Number(quotation.packaging_cost || 0).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 px-4 py-2 text-[10px] border-b border-gray-100">
                <span className="text-gray-700 font-medium">Shipping Cost</span>
                <span className="text-right font-bold">{currencySym} {Number(quotation.shipping_cost || 0).toLocaleString()}</span>
              </div>
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
                  <div className="flex-1 border-b border-dotted border-black h-4 px-2 italic text-gray-600">..............................</div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-[9px]">Seal &amp; Sign:</span>
                  <div className="h-14 w-32 border border-gray-100 rounded"></div>
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
    </div>
  );
}
