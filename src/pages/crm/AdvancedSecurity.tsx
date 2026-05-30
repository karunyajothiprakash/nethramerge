import { useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import Card from "@/components/Card";
import { ShieldAlert, Globe, Server, Activity, Lock, CheckCircle, RefreshCw, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdvancedSecurity() {
  const [threats] = useState([
    { id: "THR-102", type: "Anomalous VPN Detected", details: "Employee Rajesh Kumar logged from Germany VPN", severity: "Medium", status: "Mitigated" },
    { id: "THR-101", type: "Brute Force Attempt", details: "12 failed login attempts on endpoint /api/mobile", severity: "High", status: "IP Blocked" },
    { id: "THR-98", type: "Multiple Concurrent Pairings", details: "Swathi Swathi paired 3 active mobile sessions", severity: "Low", status: "Approved" }
  ]);

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      <SectionHeader
        title="AI Advanced Security & Threat Intel"
        sub="Monitor real-time network scans, Whitelist secure corporate subnets, and configure automatic token-revoking engines"
        actions={
          <Button size="sm" className="btn-gold shadow-md">
            <RefreshCw className="h-4 w-4 mr-1.5" /> Re-Scan Network
          </Button>
        }
      />

      {/* Security Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <ShieldAlert className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Active Threat Alerts</div>
            <div className="text-2xl font-bold font-mono mt-0.5">0 Warnings</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Token Sandbox</div>
            <div className="text-2xl font-bold font-mono mt-0.5">Encrypted</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">API Gateways</div>
            <div className="text-2xl font-bold font-mono mt-0.5">4 Secure</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Network Firewalls</div>
            <div className="text-2xl font-bold font-mono mt-0.5">3 Active</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Whitelists */}
        <Card className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Terminal className="h-4 w-4 text-primary" /> Corporate Subnets Whitelist
          </h3>
          <p className="text-xs text-muted-foreground">
            Allow BDE mobile CRM synchronizations only from approved CIDR blocks.
          </p>
          <div className="space-y-2 font-mono text-xs pt-2">
            {[
              { ip: "192.168.1.0/24", label: "Chennai Headquarters", active: true },
              { ip: "106.51.28.0/22", label: "Coimbatore Regional Office", active: true },
              { ip: "49.37.192.0/24", label: "Tiruppur Procurement Hub", active: true }
            ].map((subnet, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-neutral-900 border border-border flex items-center justify-between">
                <div>
                  <div className="text-foreground font-semibold">{subnet.ip}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 font-sans">{subnet.label}</div>
                </div>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-sans font-bold">Active</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Live Threat Logs */}
        <Card className="lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">AI Threat Mitigation Feed</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time threat assessment triggers and automated security locks</p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-900/60 text-muted-foreground font-semibold border-b border-border">
                  <th className="p-3">Incident ID</th>
                  <th className="p-3">Threat Category</th>
                  <th className="p-3">Incident Details</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3 font-semibold">Mitigation Status</th>
                </tr>
              </thead>
              <tbody>
                {threats.map((t) => (
                  <tr key={t.id} className="border-b border-border/40 hover:bg-neutral-900/30 transition-colors">
                    <td className="p-3 font-mono text-muted-foreground">{t.id}</td>
                    <td className="p-3 font-bold text-foreground">{t.type}</td>
                    <td className="p-3 text-muted-foreground leading-normal">{t.details}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                        t.severity === "High"
                          ? "bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse"
                          : t.severity === "Medium"
                          ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}>
                        {t.severity}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold text-[10px]">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
