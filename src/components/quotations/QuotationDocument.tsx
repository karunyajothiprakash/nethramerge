import React, { useEffect } from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuotationDocumentProps {
  quotation: any;
  onClose: () => void;
}

export function QuotationDocument({ quotation, onClose }: QuotationDocumentProps) {
  if (!quotation) return null;

  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const validityDate = quotation.valid_until 
    ? new Date(quotation.valid_until).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'TBD';

  const totalAmount = Number(quotation.amount || 0);
  const currencySym = quotation.currency === 'USD' ? '$' : (quotation.currency || '');
  const items = quotation.items || quotation.quotation_items || [];

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md overflow-auto p-4 flex justify-center items-start py-12">
      <div className="relative w-full max-w-[210mm] print:m-0 animate-in fade-in zoom-in duration-300">
        
        {/* Floating Controls */}
        <div className="absolute -top-14 left-0 right-0 flex justify-between items-center print:hidden px-2">
          <div className="flex gap-3">
            <Button onClick={handlePrint} className="bg-[#1A5276] text-white hover:bg-[#154360] shadow-lg rounded-full px-6">
              <Printer className="h-4 w-4 mr-2" /> Print / Save PDF
            </Button>
          </div>
          <Button variant="outline" onClick={onClose} className="bg-white/10 text-white hover:bg-white/20 border-white/20 rounded-full h-10 w-10 p-0">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* The Document */}
        <div className="bg-white text-black shadow-2xl min-h-[297mm] flex flex-col font-sans relative border-[2px] border-black box-border">
          
          {/* Watermark Logo */}
          <div className="absolute top-[30%] left-[20%] right-[20%] bottom-[30%] z-0 flex items-center justify-center opacity-15 pointer-events-none">
            <img src="/logo.webp" alt="Watermark" className="w-full h-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>

          <div className="relative z-10 flex flex-col flex-1">
            
            {/* Header Row */}
            <div className="grid grid-cols-2 border-b-[2px] border-black min-h-[160px]">
              <div className="p-4 border-r-[2px] border-black flex flex-col justify-center">
                <h1 className="font-bold text-[14px] text-[#1A5276] text-center mb-6">SHASTIKA GLOBAL IMPEX PRIVATE LIMITED</h1>
                <div className="flex items-center gap-6 px-4">
                  <img src="/logo.webp" alt="Logo" className="w-20 h-20 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                  <div className="flex flex-col space-y-2 text-[10px]">
                    <div className="grid grid-cols-[60px_1fr]"><span>Address:</span> <span>41/1, ST-5, Sathy Athani Main Road,</span></div>
                    <div className="grid grid-cols-[60px_1fr]"><span></span> <span>Thuckanayakanpalayam</span></div>
                    <div className="grid grid-cols-[60px_1fr]"><span></span> <span>Erode - 638506, Tamil Nadu, India.</span></div>
                    <div className="grid grid-cols-[60px_1fr] mt-2"><span>Phone no:</span> <span className="font-bold">7397612015</span></div>
                    <div className="grid grid-cols-[60px_1fr]"><span>GSTIN:</span> <span className="font-bold">33ABPCS0605LIZ8</span></div>
                  </div>
                </div>
              </div>
              <div className="p-6 flex flex-col justify-center items-center">
                <h2 className="font-bold text-[16px] text-[#1A5276] tracking-wide mb-8">OFFICIAL QUOTATION</h2>
                <div className="w-full max-w-[200px] text-[10px] space-y-4">
                  <div className="grid grid-cols-[90px_1fr]"><span>QUOTE NO :</span> <span className="font-bold">{quotation.quotation_number}</span></div>
                  <div className="grid grid-cols-[90px_1fr]"><span>DATE :</span> <span className="font-bold">{today}</span></div>
                  <div className="grid grid-cols-[90px_1fr]"><span>VALID UNTIL :</span> <span className="font-bold">{validityDate}</span></div>
                </div>
              </div>
            </div>

            {/* Sub Header Titles */}
            <div className="grid grid-cols-[30%_35%_35%] border-b-[1px] border-black text-[10px] font-bold text-[#1A5276] uppercase text-center h-8 items-center">
              <div className="border-r-[1px] border-black h-full flex items-center justify-center">QUOTED TO :</div>
              <div className="border-r-[1px] border-black h-full flex items-center justify-center">SHIPMENT & TRADE TERMS</div>
              <div className="h-full flex items-center justify-center">PACKING DETAILS</div>
            </div>

            {/* Grid Section Content */}
            <div className="grid grid-cols-[30%_35%_35%] border-b-[2px] border-black min-h-[160px] text-[10px]">
              <div className="p-4 border-r-[1px] border-black">
                <div className="font-bold text-[12px]">{quotation.customer?.name || quotation.customer_name}</div>
                <div className="text-gray-800 mt-2 whitespace-pre-wrap leading-relaxed">{quotation.customer?.address || ''}</div>
              </div>
              
              <div className="p-4 border-r-[1px] border-black">
                <div className="space-y-3">
                  <div className="grid grid-cols-[130px_1fr]"><span>Country of Origin :</span> <span className="font-bold">India</span></div>
                  <div className="grid grid-cols-[130px_1fr]"><span>Mode of Transport :</span> <span className="font-bold">{quotation.mode_of_transport || 'Sea'}</span></div>
                  <div className="grid grid-cols-[130px_1fr]"><span>Incoterms :</span> <span className="font-bold">{quotation.incoterms || 'CIF'}</span></div>
                  <div className="grid grid-cols-[130px_1fr]"><span>Port of Loading :</span> <span className="font-bold">{quotation.port_of_loading || 'CHENNAI PORT'}</span></div>
                  <div className="grid grid-cols-[130px_1fr]"><span>Port of Discharge :</span> <span className="font-bold">{quotation.port_of_discharge || 'TBD'}</span></div>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-[90px_1fr]"><span>Packing Type:</span> <span className="font-bold">{quotation.packaging_type || 'Standard Export Packing'}</span></div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 flex flex-col">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-[1px] border-black text-[10px] font-bold text-[#1A5276] uppercase h-10">
                    <th className="border-r-[1px] border-black w-10 text-center">ID</th>
                    <th className="border-r-[1px] border-black px-2 text-center">DESCRIPTION</th>
                    <th className="border-r-[1px] border-black w-20 text-center">HSN</th>
                    <th className="border-r-[1px] border-black w-20 text-center">QUANTITY</th>
                    <th className="border-r-[1px] border-black w-16 text-center">UNIT</th>
                    <th className="border-r-[1px] border-black w-24 text-center">PRICE</th>
                    <th className="w-28 text-center">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="text-[10px]">
                  {items.map((item: any, i: number) => (
                    <tr key={i} className="border-b-[1px] border-black h-12 align-top">
                      <td className="border-r-[1px] border-black text-center pt-2">{i + 1}</td>
                      <td className="border-r-[1px] border-black px-2 pt-2">{item.product?.name || item.products?.name || 'Product'}</td>
                      <td className="border-r-[1px] border-black text-center pt-2">{item.product?.hs_code || item.products?.hs_code || '---'}</td>
                      <td className="border-r-[1px] border-black text-center pt-2">{item.quantity}</td>
                      <td className="border-r-[1px] border-black text-center pt-2">{item.product?.unit || item.products?.unit || 'PCS'}</td>
                      <td className="border-r-[1px] border-black text-center pt-2">
                        {currencySym} {Number(item.unit_price).toLocaleString()}
                      </td>
                      <td className="text-center pt-2">
                        {currencySym} {Number(item.total_price || (item.quantity * item.unit_price)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {/* Empty Rows to maintain height */}
                  {[...Array(Math.max(0, 5 - items.length))].map((_, i) => (
                    <tr key={`empty-${i}`} className="h-10 border-b-[1px] border-black">
                      <td className="border-r-[1px] border-black"></td>
                      <td className="border-r-[1px] border-black"></td>
                      <td className="border-r-[1px] border-black"></td>
                      <td className="border-r-[1px] border-black"></td>
                      <td className="border-r-[1px] border-black"></td>
                      <td className="border-r-[1px] border-black"></td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Row */}
            <div className="grid grid-cols-[50%_50%] border-t-[2px] border-black min-h-[160px]">
              <div className="border-r-[2px] border-black text-[10px] flex flex-col justify-between">
                <div className="border-b-[1px] border-black p-3 flex-1">
                  <h4 className="font-bold text-[#1A5276] mb-2">Terms of Payment</h4>
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {quotation.payment_terms || 'Standard terms apply.'}
                  </p>
                </div>
                <div className="p-3 h-20">
                  <p className="leading-relaxed">
                    Declaration : We hereby certify that the price and details stated in this quotation are true and correct to the best of our knowledge.
                  </p>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex flex-col border-b-[2px] border-black text-[10px]">
                  <div className="grid grid-cols-2 border-b-[1px] border-black px-3 py-2">
                    <span>SUB TOTAL</span>
                    <span className="text-right">{currencySym} {Number(quotation.subtotal || totalAmount).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 border-b-[1px] border-black px-3 py-2">
                    <span>Tax Rate</span>
                    <span className="text-right">{quotation.tax_rate || 0}%</span>
                  </div>
                  <div className="grid grid-cols-2 border-b-[1px] border-black px-3 py-2">
                    <span>Tax Amount</span>
                    <span className="text-right">{currencySym} {Number(quotation.tax_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 bg-[#BDD7EE] px-3 py-2 text-[11px]">
                    <span>Total Amount</span>
                    <span className="text-right font-bold">{currencySym} {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="p-3 flex flex-col justify-between flex-1 text-[10px] min-h-[100px]">
                  <div className="mb-4 font-bold">FOR SHASTIKA GLOBAL IMPEX PRIVATE LIMITED</div>
                  <div className="mt-auto space-y-4">
                    <div>Authorized Signatory :</div>
                    <div className="border-b border-black w-32 border-dotted"></div>
                    <div>Seal & Sign :</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 0; size: auto; }
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .fixed { position: absolute !important; inset: 0 !important; padding: 0 !important; background: white !important; backdrop-filter: none !important; }
          .print\\:hidden { display: none !important; }
          .shadow-2xl { box-shadow: none !important; }
        }
      `}} />
    </div>
  );
}
