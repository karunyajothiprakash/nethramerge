import { useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import Card from "@/components/Card";
import { ShieldCheck, Key, Lock, Eye, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Security() {
  const [logs] = useState([
    { id: "LOG-921", bde: "Swathi Swathi", action: "Authorized Mobile Session", device: "iPhone 15 Pro", time: "10 mins ago", status: "Secure" },
    { id: "LOG-918", bde: "Rajesh Kumar", action: "Logged in via Web APP", device: "Windows PC · Chrome", time: "1 hour ago", status: "Secure" },
    { id: "LOG-902", bde: "Priya Nair", action: "Updated 2FA secret key", device: "MacBook Air", time: "4 hours ago", status: "Secure" },
    { id: "LOG-891", bde: "Arjun Menon", action: "Failed API Signature check", device: "Unknown (IP Flagged)", time: "1 day ago", status: "Blocked" }
  ]);

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      <SectionHeader
        title="Security & Auditing"
        sub="Configure BDE database access rights, monitor 2FA pairing tokens, and trace server logs"
        actions={
          <Button size="sm" className="btn-gold shadow-md">
            <RefreshCw className="h-4 w-4 mr-1.5" /> Force Key Rotation
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Security Score</div>
            <div className="text-2xl font-bold font-mono mt-0.5">A+ Excellent</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Data Encryption</div>
            <div className="text-2xl font-bold font-mono mt-0.5">AES 256-GCM</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">2FA Compliance</div>
            <div className="text-2xl font-bold font-mono mt-0.5">100% Enforced</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Policy Setting Grid */}
        <Card className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-primary" /> CRM Access Policies
          </h3>
          <p className="text-xs text-muted-foreground leading-normal">
            Enforced policies for BDE agents accessing agribusiness customer pipelines.
          </p>

          <div className="space-y-3 pt-2">
            {[
              { label: "IP Whitelisting Restrictions", sub: "BDE logins constrained to registered office ranges.", active: true },
              { label: "Hardware Token Pairing", sub: "Pairing authenticated via RSA encrypted keys.", active: true },
              { label: "Screenshots Tracking Protection", sub: "Revokes token if monitor flags sensitive downloads.", active: false }
            ].map((p, i) => (
              <div key={i} className="p-3 rounded-lg bg-neutral-900/40 border border-white/5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground">{p.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-normal">{p.sub}</div>
                </div>
                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${p.active ? "bg-primary" : "bg-neutral-800"} flex-shrink-0`}>
                  <div className={`w-3 h-3 rounded-full bg-black shadow-md transition-transform ${p.active ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Security Audit logs list */}
        <Card className="lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Recent Security Activities</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Audit log of system sessions, authentication changes, and warnings</p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-900/60 text-muted-foreground font-semibold border-b border-border">
                  <th className="p-3">Reference ID</th>
                  <th className="p-3">BDE / User</th>
                  <th className="p-3">Activity</th>
                  <th className="p-3">Device Signature</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/40 hover:bg-neutral-900/30 transition-colors">
                    <td className="p-3 font-mono text-muted-foreground">{log.id}</td>
                    <td className="p-3 font-semibold text-foreground">{log.bde}</td>
                    <td className="p-3 text-foreground">{log.action}</td>
                    <td className="p-3 font-mono text-muted-foreground">{log.device}</td>
                    <td className="p-3 text-muted-foreground">{log.time}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                        log.status === "Secure"
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse"
                      }`}>
                        {log.status === "Secure" ? (
                          <CheckCircle className="h-2.5 w-2.5" />
                        ) : (
                          <AlertTriangle className="h-2.5 w-2.5" />
                        )}
                        {log.status}
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
