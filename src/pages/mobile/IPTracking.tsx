import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import Card from "@/components/Card";
import { Globe, ShieldAlert, Activity, CheckCircle, Search, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function IPTracking() {
  const [searchTerm, setSearchTerm] = useState("");
  const [ips] = useState([
    { id: "IP-2911", name: "Swathi Swathi", ip: "192.168.1.101", network: "ACT Fibernet", city: "Chennai", country: "India", type: "Mobile CRM Sync", status: "Secure" },
    { id: "IP-2909", name: "Rajesh Kumar", ip: "106.51.28.14", network: "Jio Fiber", city: "Coimbatore", country: "India", type: "Web App Login", status: "Secure" },
    { id: "IP-2895", name: "Priya Nair", ip: "49.37.192.88", network: "Airtel Broadband", city: "Tiruppur", country: "India", type: "Mobile CRM Sync", status: "Secure" },
    { id: "IP-2874", name: "Arjun Menon", ip: "185.220.101.5", network: "Unknown VPN", city: "Frankfurt", country: "Germany", type: "API Request", status: "Anomaly Detected" },
    { id: "IP-2866", name: "Rajesh Kumar", ip: "103.241.12.89", network: "Jio Mobility", city: "Erode", country: "India", type: "Mobile CRM Sync", status: "Secure" }
  ]);

  const filteredIps = ips.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ip.includes(searchTerm) ||
    item.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      <PageHeader
        title="Network Audit & IP Tracking"
        description="Monitor network protocols, ISP providers, and login locations of active session tokens"
        breadcrumbs={[{ label: "CRM", to: "/crm/dashboard" }, { label: "IP Tracking" }]}
        actions={
          <Button size="sm" className="btn-gold shadow-md">
            <RefreshCw className="h-4 w-4 mr-1.5" /> Recalculate Anomaly Scores
          </Button>
        }
      />

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Tracked Network IPs</div>
            <div className="text-2xl font-bold text-foreground font-mono mt-0.5">85</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Verified Networks</div>
            <div className="text-2xl font-bold text-foreground font-mono mt-0.5">84 Approved</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <ShieldAlert className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Anomalous VPN Logs</div>
            <div className="text-2xl font-bold text-foreground font-mono mt-0.5">1 Flagged</div>
          </div>
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-foreground">Employee Session IP Log</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Geographic matching using live IP databases</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by IP, employee name, or location..."
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
                <th className="p-3">Reference ID</th>
                <th className="p-3">Employee</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">ISP Network</th>
                <th className="p-3">Location (City/Country)</th>
                <th className="p-3">Session Type</th>
                <th className="p-3">Security Level</th>
              </tr>
            </thead>
            <tbody>
              {filteredIps.map((item) => (
                <tr key={item.id} className="border-b border-border/40 hover:bg-neutral-900/30 transition-colors">
                  <td className="p-3 font-mono text-muted-foreground">{item.id}</td>
                  <td className="p-3 font-semibold text-foreground">{item.name}</td>
                  <td className="p-3 font-mono text-foreground">{item.ip}</td>
                  <td className="p-3 text-muted-foreground">{item.network}</td>
                  <td className="p-3 text-muted-foreground">
                    {item.city}, {item.country}
                  </td>
                  <td className="p-3 text-muted-foreground">{item.type}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                      item.status === "Secure"
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse"
                    }`}>
                      {item.status === "Secure" ? (
                        <CheckCircle className="h-2.5 w-2.5" />
                      ) : (
                        <AlertTriangle className="h-2.5 w-2.5" />
                      )}
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredIps.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No matching network logs found.
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
