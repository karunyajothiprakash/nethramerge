import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  warehouse?: string;
  status?: string;
  product?: string;
  batchNumber?: string;
  supplier?: string;
}

export interface ReportColumn {
  field: string;
  header: string;
  width?: number;
  format?: (value: any) => string;
}

export interface ReportData {
  title: string;
  subtitle?: string;
  columns: ReportColumn[];
  rows: any[];
  summary?: Record<string, any>;
  generatedDate: Date;
  filters: ReportFilters;
}

/**
 * Export report data to Excel format
 */
export const exportToExcel = (reportData: ReportData, filename: string) => {
  try {
    // Prepare data for export
    const exportRows = reportData.rows.map(row => {
      const exportRow: any = {};
      reportData.columns.forEach(col => {
        const value = row[col.field];
        exportRow[col.header] = col.format ? col.format(value) : value;
      });
      return exportRow;
    });

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");

    // Add column widths
    const wscols = reportData.columns.map(col => ({
      wch: col.width || 15
    }));
    ws['!cols'] = wscols;

    // Save file
    XLSX.writeFile(wb, `${filename}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`);
  } catch (error) {
    console.error('Excel export failed:', error);
    throw new Error('Failed to export to Excel');
  }
};

/**
 * Export report data to PDF format
 */
export const exportToPDF = (reportData: ReportData, filename: string) => {
  try {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(reportData.title, 14, 15);
    
    // Add subtitle if available
    if (reportData.subtitle) {
      doc.setFontSize(12);
      doc.text(reportData.subtitle, 14, 22);
    }

    // Add generated date
    doc.setFontSize(9);
    doc.text(`Generated: ${format(reportData.generatedDate, 'PPP p')}`, 14, 28);

    // Add filters section if available
    if (Object.keys(reportData.filters).length > 0) {
      doc.setFontSize(10);
      doc.text('Filters Applied:', 14, 35);
      let filterY = 40;
      Object.entries(reportData.filters).forEach(([key, value]) => {
        if (value) {
          doc.setFontSize(8);
          doc.text(`${key}: ${value}`, 20, filterY);
          filterY += 5;
        }
      });
    }

    // Add table
    const tableData = reportData.rows.map(row => {
      return reportData.columns.map(col => {
        const value = row[col.field];
        return col.format ? col.format(value) : value;
      });
    });

    (doc as any).autoTable({
      startY: 50,
      head: [reportData.columns.map(col => col.header)],
      body: tableData,
      margin: 10,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      }
    });

    // Add summary if available
    if (reportData.summary && Object.keys(reportData.summary).length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.text('Summary:', 14, finalY);
      
      let summaryY = finalY + 7;
      Object.entries(reportData.summary).forEach(([key, value]) => {
        doc.setFontSize(9);
        doc.text(`${key}: ${value}`, 20, summaryY);
        summaryY += 5;
      });
    }

    // Save PDF
    doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.pdf`);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('Failed to export to PDF');
  }
};

/**
 * Export report data to CSV format
 */
export const exportToCSV = (reportData: ReportData, filename: string) => {
  try {
    // Prepare CSV headers
    const headers = reportData.columns.map(col => `"${col.header}"`).join(',');
    
    // Prepare CSV rows
    const csvRows = reportData.rows.map(row => {
      return reportData.columns.map(col => {
        const value = row[col.field];
        const formatted = col.format ? col.format(value) : value;
        // Escape quotes and wrap in quotes
        const escaped = String(formatted || '').replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',');
    });

    // Combine headers and rows
    const csv = [headers, ...csvRows].join('\n');

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('CSV export failed:', error);
    throw new Error('Failed to export to CSV');
  }
};

/**
 * Format date for display
 */
export const formatDate = (date: string | Date) => {
  return format(new Date(date), 'PPP');
};

/**
 * Format currency for display
 */
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(value);
};

/**
 * Format number with commas
 */
export const formatNumber = (value: number, decimals = 2) => {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Get status badge style
 */
export const getStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    'pending': 'bg-amber-500/10 text-amber-600',
    'pending_qc': 'bg-amber-500/10 text-amber-600',
    'qc_passed': 'bg-emerald-500/10 text-emerald-600',
    'approved': 'bg-emerald-500/10 text-emerald-600',
    'reserved': 'bg-blue-500/10 text-blue-600',
    'shipped': 'bg-cyan-500/10 text-cyan-600',
    'consumed': 'bg-gray-500/10 text-gray-600',
    'rejected': 'bg-red-500/10 text-red-600',
    'damaged': 'bg-red-500/10 text-red-600',
    'export_ready': 'bg-emerald-500/10 text-emerald-600'
  };
  return styles[status.toLowerCase()] || 'bg-gray-500/10 text-gray-600';
};
