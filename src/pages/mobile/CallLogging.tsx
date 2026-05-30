import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import Card from "@/components/Card";
import { Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, Clock, RefreshCw, User, Search, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CallLogging() {
  const [searchTerm, setSearchTerm] = useState("");
  const [calls] = useState([
    { id: "C-4821", bde: "Swathi Swathi", lead: "Future Wave Food Trading", type: "outgoing", duration: "12m 40s", time: "Just now", status: "Synced", summary: "Discussed turmeric powder pricing and container availability for UAE route." },
    { id: "C-4819", bde: "Rajesh Kumar", lead: "NaturalBest Co.", type: "incoming", duration: "4m 15s", time: "32 mins ago", status: "Synced", summary: "Client called to confirm bulk order specs." },
    { id: "C-4812", bde: "Priya Nair", lead: "OrganicLife GmbH", type: "outgoing", duration: "8m 55s", time: "2 hours ago", status: "Synced", summary: "Initial negotiation on pepper spices pricing." },
    { id: "C-4801", bde: "Swathi Swathi", lead: "Greenfield Traders", type: "outgoing", duration: "18m 20s", time: "5 hours ago", status: "Synced", summary: "Detailed review of shipping terms and export paperwork." },
    { id: "C-4795", bde: "Arjun Menon", lead: "Sea Horse Pvt Ltd", type: "incoming", duration: "2m 10s", time: "1 day ago", status: "Synced", summary: "Quick update on sample delivery status." }
  ]);

  const filteredCalls = calls.filter(c => 
    c.lead.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.bde.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      <PageHeader
        title="Mobile Call Logging"
        description="Automated sync of sales calls, call recordings, and client interaction summaries"
        breadcrumbs={[{ label: "CRM", to: "/crm/dashboard" }, { label: "Call Logging" }]}
        actions={
          <Button size="sm" className="btn-gold shadow-md">
            <RefreshCw className="h-4 w-4 mr-1.5" /> Sync Call Logs
          </Button>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <PhoneCall className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Calls Logged</div>
            <div className="text-2xl font-bold text-foreground font-mono mt-0.5">148</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Talk Time Today</div>
            <div className="text-2xl font-bold text-foreground font-mono mt-0.5">1h 45m</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <PhoneOutgoing className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Outbound Calls</div>
            <div className="text-2xl font-bold text-foreground font-mono mt-0.5">92</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <PhoneIncoming className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Inbound Calls</div>
            <div className="text-2xl font-bold text-foreground font-mono mt-0.5">56</div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-foreground">BDE Call Registers</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Synchronized via BDE mobile dialers</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by lead or representative..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-neutral-900 border border-border text-foreground focus:outline-hidden focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-900/60 text-muted-foreground font-semibold border-b border-border">
                <th className="p-3">Type</th>
                <th className="p-3">BDE / Rep</th>
                <th className="p-3">Client / Lead</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Time</th>
                <th className="p-3">Summary & Notes</th>
                <th className="p-3">Sync Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCalls.map((c) => (
                <tr key={c.id} className="border-b border-border/40 hover:bg-neutral-900/30 transition-colors">
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                      c.type === "outgoing"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    }`}>
                      {c.type === "outgoing" ? (
                        <PhoneOutgoing className="h-2.5 w-2.5" />
                      ) : (
                        <PhoneIncoming className="h-2.5 w-2.5" />
                      )}
                      {c.type}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-foreground">{c.bde}</td>
                  <td className="p-3 text-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {c.lead}
                  </td>
                  <td className="p-3 font-mono text-muted-foreground">{c.duration}</td>
                  <td className="p-3 text-muted-foreground">{c.time}</td>
                  <td className="p-3 text-muted-foreground max-w-sm leading-normal">{c.summary}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold text-[10px]">
                      <CheckCircle className="h-2.5 w-2.5" />
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredCalls.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No call logs found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
