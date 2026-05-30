import { useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import Card from "@/components/Card";
import { FileText, Download, Calendar, BarChart3, TrendingUp, RefreshCw, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Reports() {
  const [reports] = useState([
    { name: "Monthly BDE Conversion Summary", date: "May 2026", type: "PDF Report", size: "2.4 MB" },
    { name: "Outbound Lead Generation Logs", date: "Q2 2026", type: "CSV Spreadsheet", size: "12.8 KB" },
    { name: "Field Meeting Verification Audit", date: "May 2026", type: "PDF Report", size: "4.1 MB" },
    { name: "Export Pipeline Revenue Trends", date: "FY 2025-26", type: "Excel Spreadsheet", size: "340.5 KB" }
  ]);

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      <SectionHeader
        title="CRM Reports & Analytics Exports"
        sub="Export sales pipelines, download verified BDE check-in records, and audit marketing campaign budgets"
        actions={
          <Button size="sm" className="btn-gold shadow-md">
            <RefreshCw className="h-4 w-4 mr-1.5" /> Re-Compile Analytics
          </Button>
        }
      />

      {/* Analytics highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Reports Generated</div>
            <div className="text-2xl font-bold font-mono mt-0.5">348</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Monthly Growth Ratio</div>
            <div className="text-2xl font-bold font-mono mt-0.5">+14.2%</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Scheduled Email Audits</div>
            <div className="text-2xl font-bold font-mono mt-0.5">Weekly</div>
          </div>
        </Card>
      </div>

      <Card className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Available Reports & Downloads</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Export high-fidelity spreadsheets and documents detailing AgriExport operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((r, i) => (
            <div key={i} className="p-4 rounded-xl bg-neutral-900/40 border border-border hover:border-primary/20 transition-all duration-300 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-neutral-900 border border-white/5 text-primary mt-0.5 flex-shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground truncate max-w-xs">{r.name}</div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {r.date}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-primary">{r.type}</span>
                    <span>•</span>
                    <span className="font-mono">{r.size}</span>
                  </div>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-primary/20 text-xs hover:bg-primary/10 flex-shrink-0">
                <Download className="h-3.5 w-3.5 mr-1" /> Export
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
