import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ArrowLeft, Printer } from "lucide-react";
import { toast } from "sonner";

export default function PackingListPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: order, error } = await supabase
          .from("export_orders")
          .select("*, export_shipments(*)")
          .eq("id", id)
          .single();

        if (error) throw error;
        setData(order);
      } catch (err: any) {
        toast.error("Failed to load packing list");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDownload = async () => {
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      if (!printRef.current) return;

      toast.info("Generating PDF...");

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`PackingList_${data?.order_number?.replace("EXP", "PL") || id}.pdf`);
      toast.success("PDF downloaded!");
    } catch (err) {
      toast.error("Failed to generate PDF");
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <Loader2 className="h-10 w-10 animate-spin text-yellow-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-gray-500">Packing list not found.</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const plNumber = data.order_number?.replace("EXP", "PL") || `PL-${id?.slice(0, 8)}`;
  const shipment = data.export_shipments?.[0] || {};
  const today = new Date().toLocaleDateString("en-GB").replace(/\//g, " / ");

  // ── colours (matching docx)
  const NAVY = "#1B3A6B";
  const MID_BLUE = "#2E5FA3";
  const LIGHT_BLUE = "#D6E4F7";
  const LIGHT_GRAY = "#F5F7FA";

  const sectionHeader = (label: string) => (
    <div style={{
      background: MID_BLUE,
      color: "#fff",
      fontWeight: 700,
      fontSize: "10px",
      padding: "5px 10px",
      letterSpacing: "0.5px",
    }}>
      ▌ {label}
    </div>
  );

  const labelVal = (label: string, value: string | undefined) => (
    <tr>
      <td style={{ color: "#555", paddingRight: "8px", whiteSpace: "nowrap", fontSize: "10px", lineHeight: "1.9" }}>{label}</td>
      <td style={{ fontSize: "10px", lineHeight: "1.9" }}>: <strong>{value || "—"}</strong></td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-gray-200 print:bg-white">

      {/* ── Top Action Bar */}
      <div className="print:hidden sticky top-0 z-10 bg-gray-900 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-300 hover:text-white gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <span className="text-white font-mono font-bold text-sm">{plNumber}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 border-gray-600 text-gray-300 hover:text-white">
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button size="sm" onClick={handleDownload} className="gap-2 bg-yellow-600 hover:bg-yellow-700 text-black font-bold">
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      {/* ── A4 Preview */}
      <div className="flex justify-center py-8 print:py-0">
        <div
          ref={printRef}
          className="bg-white shadow-2xl print:shadow-none"
          style={{ width: "794px", minHeight: "1123px", padding: "36px", fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#222" }}
        >

          {/* ── HEADER BANNER ── */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px" }}>
            <tbody>
              <tr>
                {/* Company block */}
                <td style={{ width: "58%", background: NAVY, padding: "16px 18px", verticalAlign: "top" }}>
                  <div style={{ fontWeight: 900, fontSize: "15px", color: "#fff", marginBottom: "8px" }}>
                    SHASTIKA GLOBAL IMPEX PRIVATE LIMITED
                  </div>
                  <div style={{ fontSize: "10px", color: "#C8DAEF", lineHeight: "1.7" }}>
                    41/1, ST-5, Sathy Athani Main Road,<br />
                    Thuckanayakanpalayam, Erode – 638506,<br />
                    Tamil Nadu, India
                  </div>
                  <div style={{ fontSize: "10px", color: "#A0C0E8", marginTop: "8px" }}>
                    <strong style={{ color: "#A0C0E8" }}>Phone:</strong>&nbsp;
                    <span style={{ color: "#fff" }}>+91 7397612015</span>
                    &emsp;
                    <strong style={{ color: "#A0C0E8" }}>GSTIN:</strong>&nbsp;
                    <span style={{ color: "#fff" }}>33ABPCS0605LIZ8</span>
                  </div>
                </td>
                {/* Invoice meta block */}
                <td style={{ width: "42%", background: "#EBF2FD", padding: "16px 18px", verticalAlign: "top" }}>
                  <div style={{ fontWeight: 900, fontSize: "20px", color: NAVY, letterSpacing: "1px", marginBottom: "4px" }}>
                    PACKING LIST
                  </div>
                  <div style={{ fontSize: "9px", color: "#555", fontStyle: "italic", marginBottom: "10px" }}>
                    For Customs Clearance
                  </div>
                  <table style={{ background: "#fff", borderRadius: "4px", padding: "6px 10px", fontSize: "10px", lineHeight: "2" }}>
                    <tbody>
                      <tr>
                        <td style={{ color: NAVY, fontWeight: 700, paddingRight: "10px" }}>PL No:</td>
                        <td><strong>{plNumber}</strong></td>
                      </tr>
                      <tr>
                        <td style={{ color: NAVY, fontWeight: 700, paddingRight: "10px" }}>Date:</td>
                        <td>{today}</td>
                      </tr>
                      <tr>
                        <td style={{ color: NAVY, fontWeight: 700, paddingRight: "10px" }}>Currency:</td>
                        <td><strong>{data.currency || "USD"}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── EXPORTER / CONSIGNEE ── */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "8px" }}>
            <tbody>
              <tr>
                <td style={{ width: "50%", verticalAlign: "top", border: "1px solid #BBCCE4" }}>
                  {sectionHeader("EXPORTER / SELLER")}
                  <div style={{ padding: "10px", background: LIGHT_GRAY }}>
                    <div style={{ fontWeight: 700, color: NAVY, marginBottom: "4px" }}>Shastika Global Impex Private Limited</div>
                    <div style={{ fontSize: "10px", color: "#444", lineHeight: "1.7" }}>
                      41/1, ST-5, Sathy Athani Main Road,<br />
                      Thuckanayakanpalayam, Erode – 638506,<br />
                      Tamil Nadu, India<br />
                      <strong>Phone:</strong> +91 7397612015<br />
                      <strong>GSTIN:</strong> 33ABPCS0605LIZ8
                    </div>
                  </div>
                </td>
                <td style={{ width: "50%", verticalAlign: "top", border: "1px solid #BBCCE4", borderLeft: "none" }}>
                  {sectionHeader("IMPORTER / CONSIGNEE")}
                  <div style={{ padding: "10px" }}>
                    <div style={{ fontWeight: 700, color: NAVY, marginBottom: "4px" }}>{data.customer_name || "—"}</div>
                    <div style={{ fontSize: "10px", color: "#444", lineHeight: "1.7" }}>
                      {data.consignee_address || shipment.consignee_address || "—"}<br />
                      <strong>Country:</strong> {data.destination_country || "—"}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── SHIPMENT & PAYMENT ── */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "8px" }}>
            <tbody>
              <tr>
                <td style={{ width: "50%", verticalAlign: "top", border: "1px solid #BBCCE4" }}>
                  {sectionHeader("SHIPMENT & TRADE DETAILS")}
                  <div style={{ padding: "10px", background: LIGHT_GRAY }}>
                    <table><tbody>
                      {labelVal("Country of Origin", "India")}
                      {labelVal("Mode of Transport", shipment.transport_mode || data.transport_mode || "Sea Freight")}
                      {labelVal("Incoterms", data.incoterms || "FOB")}
                      {labelVal("Port of Loading", shipment.port_of_loading || data.port_of_loading)}
                      {labelVal("Port of Discharge", shipment.port_of_discharge || data.port_of_discharge)}
                      {labelVal("Container Type", shipment.container_type || data.container_type || "20/40 Feet FCL")}
                      {labelVal("Loading Type", data.loading_type || "1 cubic meter")}
                    </tbody></table>
                  </div>
                </td>
                <td style={{ width: "50%", verticalAlign: "top", border: "1px solid #BBCCE4", borderLeft: "none" }}>
                  {sectionHeader("PAYMENT & BANKING DETAILS")}
                  <div style={{ padding: "10px" }}>
                    <table><tbody>
                      {labelVal("Payment Terms", data.payment_terms || "90% Advance + 10% on Loading")}
                      {labelVal("Invoice Currency", data.currency || "USD")}
                      {labelVal("Bank Name", "State Bank of India")}
                      {labelVal("Branch", "Erode, Tamil Nadu")}
                      {labelVal("Account No.", "43841179923")}
                      {labelVal("IFSC Code", "SBIN02278")}
                      {labelVal("Swift Code", "SBININBB")}
                    </tbody></table>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── GOODS TABLE ── */}
          <div style={{ border: "1px solid #BBCCE4", marginBottom: "8px" }}>
            {sectionHeader("GOODS DESCRIPTION")}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
              <thead>
                <tr style={{ background: NAVY }}>
                  {["S.No", "Description", "HS Code", "No. of Pkgs", "Qty (Nos)", "Unit", "Unit Price", "Total Value"].map(h => (
                    <th key={h} style={{ border: "1px solid #3A5A8A", padding: "6px 8px", textAlign: "left", fontWeight: 700, color: "#fff" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: LIGHT_GRAY }}>
                  <td style={{ border: "1px solid #BBCCE4", padding: "8px" }}>1</td>
                  <td style={{ border: "1px solid #BBCCE4", padding: "8px" }}>
                    <strong>{data.product}</strong>
                    <div style={{ color: "#666", fontSize: "9px", fontStyle: "italic" }}>Naturally grown, India origin</div>
                  </td>
                  <td style={{ border: "1px solid #BBCCE4", padding: "8px" }}>{data.hs_code || "—"}</td>
                  <td style={{ border: "1px solid #BBCCE4", padding: "8px" }}>{data.no_of_packages || "—"}</td>
                  <td style={{ border: "1px solid #BBCCE4", padding: "8px" }}>{data.quantity}</td>
                  <td style={{ border: "1px solid #BBCCE4", padding: "8px" }}>{data.unit}</td>
                  <td style={{ border: "1px solid #BBCCE4", padding: "8px" }}>{data.currency || "USD"} {data.unit_price || "—"}</td>
                  <td style={{ border: "1px solid #BBCCE4", padding: "8px" }}><strong>{data.currency || "USD"} {data.total_value || data.total_amount || "—"}</strong></td>
                </tr>
                {/* Sub Total */}
                <tr>
                  <td colSpan={6} style={{ border: "1px solid #BBCCE4", padding: "6px 8px" }} />
                  <td style={{ border: "1px solid #BBCCE4", padding: "6px 8px", fontWeight: 700, background: LIGHT_BLUE, color: NAVY }}>Sub Total</td>
                  <td style={{ border: "1px solid #BBCCE4", padding: "6px 8px", fontWeight: 700, background: LIGHT_BLUE, color: NAVY }}>{data.currency || "USD"} {data.total_value || data.total_amount || "—"}</td>
                </tr>
                {/* Tax */}
                <tr>
                  <td colSpan={6} style={{ border: "1px solid #BBCCE4", padding: "6px 8px" }} />
                  <td style={{ border: "1px solid #BBCCE4", padding: "6px 8px", color: "#666" }}>Tax / GST (Export 0%)</td>
                  <td style={{ border: "1px solid #BBCCE4", padding: "6px 8px", color: "#666" }}>{data.currency || "USD"} 0.00</td>
                </tr>
                {/* Total FOB */}
                <tr>
                  <td colSpan={6} style={{ border: "1px solid #BBCCE4", padding: "6px 8px" }} />
                  <td style={{ border: "none", padding: "6px 8px", fontWeight: 900, background: NAVY, color: "#fff" }}>TOTAL FOB VALUE</td>
                  <td style={{ border: "none", padding: "6px 8px", fontWeight: 900, background: NAVY, color: "#fff" }}>{data.currency || "USD"} {data.total_value || data.total_amount || "—"}</td>
                </tr>
                {/* Amount in words */}
                <tr style={{ background: LIGHT_BLUE }}>
                  <td colSpan={8} style={{ border: "1px solid #BBCCE4", padding: "8px", fontSize: "10px" }}>
                    <strong style={{ color: NAVY }}>Amount in Words : </strong>
                    <em>{data.amount_in_words || "—"}</em>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── PACKING & WEIGHT ── */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "8px" }}>
            <tbody>
              <tr>
                <td style={{ width: "50%", verticalAlign: "top", border: "1px solid #BBCCE4" }}>
                  {sectionHeader("PACKING DETAILS")}
                  <div style={{ padding: "10px", background: LIGHT_GRAY }}>
                    <table><tbody>
                      {labelVal("Packing Type", data.packing_type || "Carton Box")}
                      {labelVal("No. of Cartons", data.no_of_packages)}
                      {labelVal("Qty per Carton", data.qty_per_carton)}
                      {labelVal("Total Quantity", `${data.quantity} ${data.unit}`)}
                      {labelVal("Container Type", data.container_type || shipment.container_type || "20/40 Feet FCL")}
                    </tbody></table>
                  </div>
                </td>
                <td style={{ width: "50%", verticalAlign: "top", border: "1px solid #BBCCE4", borderLeft: "none" }}>
                  {sectionHeader("WEIGHT DETAILS")}
                  <div style={{ padding: "10px" }}>
                    <table><tbody>
                      {labelVal("Net Wt / Unit", data.net_weight_per_unit)}
                      {labelVal("Net Wt / Carton", data.net_weight_per_carton)}
                      {labelVal("Gross Wt / Carton", data.gross_weight_per_carton)}
                      {labelVal("Total Net Weight", data.total_net_weight)}
                      {labelVal("Total Gross Weight", data.total_gross_weight)}
                    </tbody></table>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── DECLARATION & SIGNATORY ── */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ width: "60%", verticalAlign: "top", border: "1px solid #BBCCE4" }}>
                  {sectionHeader("DECLARATION")}
                  <div style={{ padding: "10px", background: LIGHT_GRAY, fontSize: "10px", lineHeight: "1.7", color: "#333" }}>
                    <strong>We hereby declare and certify that:</strong><br />
                    1. The goods described in this packing list are of Indian origin.<br />
                    2. The details stated herein are true, correct and are the actual packing details.<br />
                    3. This document is issued solely for customs clearance and export purposes.<br />
                    4. All details comply with the laws and regulations of India and the destination country.<br />
                    <em style={{ fontSize: "9px", color: "#666" }}>This is a legally binding export document.</em>
                  </div>
                </td>
                <td style={{ width: "40%", verticalAlign: "top", border: "1px solid #BBCCE4", borderLeft: "none" }}>
                  {sectionHeader("AUTHORISED SIGNATORY")}
                  <div style={{ padding: "10px", fontSize: "10px" }}>
                    <strong style={{ color: NAVY }}>For SHASTIKA GLOBAL IMPEX PVT LTD</strong>
                    <div style={{ marginTop: "50px", borderTop: `1px solid ${NAVY}`, paddingTop: "6px", color: "#666" }}>
                      Authorised Signatory
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Footer */}
          <div style={{ marginTop: "14px", textAlign: "center", fontSize: "9px", color: "#999", borderTop: "1px solid #EEE", paddingTop: "8px" }}>
            SHASTIKA GLOBAL IMPEX PRIVATE LIMITED &nbsp;|&nbsp; GSTIN: 33ABPCS0605LIZ8 &nbsp;|&nbsp; Phone: +91 7397612015
          </div>

        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; }
          @page { margin: 0; size: A4; }
        }
      `}</style>
    </div>
  );
}