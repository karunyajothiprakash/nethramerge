import jsPDF from "jspdf";
import { format } from "date-fns";

export const exportSingleQuotationToPDF = (quotation: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  // Draw Main Border
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));

  // --- HEADER SECTION ---
  const headerHeight = 55;
  doc.line(margin, margin + headerHeight, pageWidth - margin, margin + headerHeight);
  doc.line(pageWidth / 2 + 10, margin, pageWidth / 2 + 10, margin + headerHeight);

  // Left Header - Company Info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(41, 60, 108); // Professional blue
  doc.text("SHASTIKA GLOBAL IMPEX PRIVATE LIMITED", margin + 35, margin + 10);

  // Logo placeholder (simulating the "AG" logo with text if no image)
  doc.setDrawColor(41, 60, 108);
  doc.setLineWidth(1);
  doc.rect(margin + 5, margin + 15, 25, 15);
  doc.setFontSize(12);
  doc.text("SGI", margin + 11, margin + 25);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.text("Address: 41/1,5T-5, Sathy Athani Main Road,", margin + 35, margin + 18);
  doc.text("Thuckanayakanpalayam", margin + 35, margin + 23);
  doc.text("Erode - 638506, Tamil Nadu, India.", margin + 35, margin + 28);
  doc.text(`Phone no : 7397612015`, margin + 35, margin + 38);
  doc.setFont("helvetica", "bold");
  doc.text("GSTIN : 33ABPCS0605LJZ8", margin + 35, margin + 45);

  // Right Header - Invoice Details
  doc.setFontSize(14);
  doc.setTextColor(41, 60, 108);
  doc.text("PROFORMA INVOICE", pageWidth / 2 + 25, margin + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.text(`PI NO : ${quotation.quotation_number || "N/A"}`, pageWidth / 2 + 20, margin + 25);
  doc.text(`DATE : ${format(new Date(quotation.created_at || new Date()), "dd-MM-yyyy")}`, pageWidth / 2 + 20, margin + 35);
  doc.text(`VALID PI DATE : ${quotation.valid_until || "N/A"}`, pageWidth / 2 + 20, margin + 45);

  // --- TERMS & PACKING SECTION ---
  const termsHeight = 70;
  const currentY = margin + headerHeight;
  doc.line(margin, currentY + 8, pageWidth - margin, currentY + 8); // Header line
  doc.line(margin + 60, currentY, margin + 60, currentY + termsHeight); // Vertical line 1
  doc.line(margin + 120, currentY, margin + 120, currentY + termsHeight); // Vertical line 2
  doc.line(margin, currentY + termsHeight, pageWidth - margin, currentY + termsHeight); // Bottom line

  // Column Headers
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("BILL TO :", margin + 2, currentY + 5);
  doc.text("SHIPMENT & TRADE TERMS", margin + 62, currentY + 5);
  doc.text("PACKING DETAILS", margin + 122, currentY + 5);

  // Bill To Content
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const custName = quotation.customer_name || quotation.customers?.name || "Unknown";
  doc.text(custName, margin + 2, currentY + 15);
  const custAddress = quotation.customers?.address || "";
  const splitAddress = doc.splitTextToSize(custAddress, 55);
  doc.text(splitAddress, margin + 2, currentY + 20);

  // Shipment & Trade Terms Content
  let shipY = currentY + 15;
  const drawTerm = (label: string, value: string) => {
    doc.setFont("helvetica", "normal");
    doc.text(`${label} :`, margin + 62, shipY);
    doc.setFont("helvetica", "bold");
    doc.text(String(value || "---"), margin + 95, shipY);
    shipY += 7;
  };
  drawTerm("Country of Origin", quotation.country_of_origin || "India");
  drawTerm("Mode of Transport", quotation.mode_of_transport || "Sea");
  drawTerm("Incoterms", quotation.incoterms || "FOB");
  drawTerm("Port of Loading", quotation.port_of_loading || "CHENNAI PORT");
  drawTerm("Port of Discharge", quotation.port_of_discharge || "---");
  drawTerm("Est. shipment date", quotation.estimated_shipment_date || "---");

  // Packing Details Content
  doc.setFont("helvetica", "normal");
  doc.text("Packing Type:", margin + 122, currentY + 15);
  doc.setFont("helvetica", "bold");
  doc.text(quotation.packing_type || "Standard", margin + 145, currentY + 15);

  // --- ITEMS TABLE ---
  const tableTop = currentY + termsHeight;
  const colWidths = [12, 70, 25, 20, 15, 25, 23];
  const colLabels = ["ID", "DESCRIPTION", "HSN", "QUANTITY", "UNIT", "PRICE", "AMOUNT"];

  // Table Header
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, tableTop, pageWidth - (margin * 2), 10, 'F');
  doc.setDrawColor(0);
  doc.line(margin, tableTop + 10, pageWidth - margin, tableTop + 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  let colX = margin;
  colLabels.forEach((label, i) => {
    const align = (i >= 3) ? "right" : "left";
    const xPos = align === "right" ? colX + colWidths[i] - 2 : colX + 2;
    doc.text(label, xPos, tableTop + 7, { align });
    colX += colWidths[i];
    if (i < colLabels.length - 1) doc.line(colX, tableTop, colX, tableTop + 100); // Draw vertical lines
  });

  // Table Body
  doc.setFont("helvetica", "normal");
  let itemY = tableTop + 15;
  const items = quotation.quotation_items || [];

  items.forEach((item: any, idx: number) => {
    colX = margin;
    doc.text(String(idx + 1), colX + 2, itemY); colX += colWidths[0];
    doc.text(item.products?.name || "Product", colX + 2, itemY); colX += colWidths[1];
    doc.text(item.products?.hs_code || "N/A", colX + 2, itemY); colX += colWidths[2];
    doc.text(String(item.quantity), colX + colWidths[3] - 2, itemY, { align: "right" }); colX += colWidths[3];
    doc.text(item.products?.unit || "PCS", colX + 2, itemY); colX += colWidths[4];
    doc.text(Number(item.unit_price).toLocaleString(), colX + colWidths[5] - 2, itemY, { align: "right" }); colX += colWidths[5];
    doc.text(Number(item.total_price || (item.quantity * item.unit_price)).toLocaleString(), colX + colWidths[6] - 2, itemY, { align: "right" });

    itemY += 8;
  });

  // Draw table bottom border
  doc.line(margin, tableTop + 100, pageWidth - margin, tableTop + 100);

  // --- FOOTER SECTION ---
  const footerTop = tableTop + 100;
  doc.line(pageWidth - 80, footerTop, pageWidth - 80, footerTop + 40); // Summary vertical line
  doc.line(margin, footerTop + 40, pageWidth - margin, footerTop + 40); // Bottom of summary line

  // Summary (Right)
  let summaryY = footerTop + 7;
  const drawSummaryRow = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(label, pageWidth - 78, summaryY);
    doc.text(value, pageWidth - 12, summaryY, { align: "right" });
    doc.line(pageWidth - 80, summaryY + 3, pageWidth - margin, summaryY + 3);
    summaryY += 10;
  };

  const total = Number(quotation.total_amount || 0);
  const subtotal = total / 1.18;
  const tax = total - subtotal;

  drawSummaryRow("SUB TOTAL", subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  drawSummaryRow("Tax Rate", "18 %");
  drawSummaryRow("Tax", tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  // Total Box
  doc.setFillColor(41, 60, 108);
  doc.rect(pageWidth - 80, summaryY - 7, 70, 10, 'F');
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.text("Total", pageWidth - 78, summaryY - 1);
  doc.text(`${quotation.currency} ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 12, summaryY - 1, { align: "right" });
  doc.setTextColor(0);

  // Terms & Declaration (Left)
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(41, 60, 108);
  doc.text("Terms of Payment", margin + 2, footerTop + 5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  const splitTerms = doc.splitTextToSize(quotation.payment_terms || "", 110);
  doc.text(splitTerms, margin + 2, footerTop + 12);

  doc.setFont("helvetica", "bold");
  doc.text("Note: Including packing, loading and Transport.", margin + 2, footerTop + 35);

  doc.setFontSize(7);
  doc.text(`Declaration : ${quotation.declaration || ""}`, margin + 2, footerTop + 48);

  // Final Signature Section
  const signatureTop = footerTop + 55;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("FOR SHASTIKA GLOBAL IMPEX PRIVATE LIMITED", pageWidth - margin - 5, signatureTop, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Authorized Signatory :", pageWidth - margin - 40, signatureTop + 20);
  doc.text("Seal & Sign :", pageWidth - margin - 40, signatureTop + 30);

  doc.save(`Quotation_${quotation.quotation_number}_${format(new Date(), "yyyyMMdd")}.pdf`);
};

export const exportQuotationsToPDF = (quotations: any[], forceList = false) => {
  // If it's a single quotation and not forced to list, use the professional format
  if (quotations.length === 1 && !forceList) {
    exportSingleQuotationToPDF(quotations[0]);
    return;
  }

  // Otherwise, keep the list format for multiple quotations
  const doc = new jsPDF();
  const now = new Date();
  const dateStr = format(now, "yyyy-MM-dd_HH-mm");

  doc.setFontSize(20);
  doc.text("Quotations Report", 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${format(now, "PPP p")}`, 14, 30);

  const startY = 40;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text("ID", 14, startY);
  doc.text("Customer", 45, startY);
  doc.text("Items", 110, startY);
  doc.text("Amount", 130, startY);
  doc.text("Status", 170, startY);

  doc.setLineWidth(0.5);
  doc.line(14, startY + 2, 196, startY + 2);

  doc.setFont("helvetica", "normal");
  let currentY = startY + 10;

  quotations.forEach((q) => {
    if (currentY > 280) {
      doc.addPage();
      currentY = 20;
    }
    const qId = (q.quotation_number || q.id.substring(0, 8));
    doc.text(qId, 14, currentY);
    doc.text(String(q.customer_name || q.customers?.name || "Unknown"), 45, currentY);
    const count = q.items_count !== undefined ? q.items_count : (q.quotation_items?.length || 0);
    doc.text(String(count), 110, currentY);
    doc.text(`${q.currency || "USD"} ${Number(q.total_amount || 0).toLocaleString()}`, 130, currentY);
    doc.text(q.status || "Draft", 170, currentY);
    currentY += 10;
  });

  doc.save(`Quotations_List_${dateStr}.pdf`);
};
