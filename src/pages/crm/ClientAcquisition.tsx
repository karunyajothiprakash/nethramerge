import { useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import Card from "@/components/Card";
import { UserPlus, Star, BarChart3, TrendingUp, Search, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClientAcquisition() {
  const [sources] = useState([
    { channel: "Corporate Website Inquiry", leads: 48, clients: 12, cost: "$14.50", rate: "25.0%", value: "$340,000" },
    { channel: "Gulf Agri Expo UAE (Trade Fair)", leads: 24, clients: 8, cost: "$240.00", rate: "33.3%", value: "$485,000" },
    { channel: "Partner Referrals", leads: 11, clients: 4, cost: "$0.00", rate: "36.4%", value: "$180,000" },
    { channel: "LinkedIn Outbound BDE", leads: 62, clients: 9, cost: "$12.00", rate: "14.5%", value: "$165,000" },
    { channel: "AgriMarketplace B2B", leads: 34, clients: 5, cost: "$45.00", rate: "14.7%", value: "$95,000" }
  ]);

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      <SectionHeader
        title="Client Acquisition & Funnels"
        sub="Trace customer generation channels, review marketing ROI, and analyze channel conversion ratios"
        actions={
          <Button size="sm" className="btn-gold shadow-md">
            <BarChart3 className="h-4 w-4 mr-1.5" /> Funnel Reports
          </Button>
        }
      />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">New Leads Acquired</div>
            <div className="text-2xl font-bold font-mono mt-0.5">179</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Converted Buyers</div>
            <div className="text-2xl font-bold font-mono mt-0.5">38 Clients</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Acquisition Rate</div>
            <div className="text-2xl font-bold font-mono mt-0.5">21.2%</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Pipe Value</div>
            <div className="text-2xl font-bold font-mono mt-0.5">$1.26M</div>
          </div>
        </Card>
      </div>

      <Card className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Acquisition Channels Register</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Cost efficiency and inquiry volume analysis across all sales routes</p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-900/60 text-muted-foreground font-semibold border-b border-border">
                <th className="p-3">Inbound Channel</th>
                <th className="p-3">Leads Captured</th>
                <th className="p-3">Converted Clients</th>
                <th className="p-3">Avg Lead Cost</th>
                <th className="p-3">Conversion Rate</th>
                <th className="p-3 font-semibold">Total Revenue Acquired</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((item, i) => (
                <tr key={i} className="border-b border-border/40 hover:bg-neutral-900/30 transition-colors">
                  <td className="p-3 font-semibold text-foreground">{item.channel}</td>
                  <td className="p-3 font-mono text-muted-foreground">{item.leads}</td>
                  <td className="p-3 font-mono text-muted-foreground">{item.clients}</td>
                  <td className="p-3 font-mono text-muted-foreground">{item.cost}</td>
                  <td className="p-3 font-mono text-primary font-semibold">{item.rate}</td>
                  <td className="p-3 font-mono text-emerald-500 font-bold">{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
