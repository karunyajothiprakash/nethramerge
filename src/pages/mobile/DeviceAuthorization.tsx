import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import Card from "@/components/Card";
import { Smartphone, Key, ShieldCheck, CheckCircle, RefreshCw, XCircle, AlertCircle, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DeviceAuthorization() {
  const [devices, setDevices] = useState([
    { id: "DEV-892", employee: "Swathi Swathi", model: "iPhone 15 Pro", token: "sha256_bde98x...", pairedAt: "May 10, 2026", status: "Approved" },
    { id: "DEV-876", employee: "Rajesh Kumar", model: "OnePlus 11", token: "sha256_bde43f...", pairedAt: "May 12, 2026", status: "Approved" },
    { id: "DEV-811", employee: "Priya Nair", model: "MacBook Air", token: "sha256_bde12c...", pairedAt: "May 20, 2026", status: "Pending Verification" }
  ]);

  const handleApprove = (id: string) => {
    setDevices(prev =>
      prev.map(d => d.id === id ? { ...d, status: "Approved" } : d)
    );
  };

  const handleRevoke = (id: string) => {
    setDevices(prev =>
      prev.map(d => d.id === id ? { ...d, status: "Revoked" } : d)
    );
  };

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      <PageHeader
        title="Mobile Device Authorization"
        description="Verify BDE phone hardware signatures, register authorization certificates, and revoke paired sessions"
        breadcrumbs={[{ label: "CRM", to: "/crm/dashboard" }, { label: "Device Authorization" }]}
        actions={
          <Button size="sm" className="btn-gold shadow-md">
            <Key className="h-4 w-4 mr-1.5" /> Issue Device Token
          </Button>
        }
      />

      {/* Grid Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Registered Devices</div>
            <div className="text-2xl font-bold text-foreground font-mono mt-0.5">18 Active</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Hardware Key Security</div>
            <div className="text-2xl font-bold text-foreground font-mono mt-0.5">RSA 4096-bit</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <AlertCircle className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Verification Queue</div>
            <div className="text-2xl font-bold text-foreground font-mono mt-0.5">1 Pending</div>
          </div>
        </Card>
      </div>

      <Card className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Active Pairing Certificates</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Cryptographic device fingerprints authorized to request lead lists and push notifications</p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-900/60 text-muted-foreground font-semibold border-b border-border">
                <th className="p-3">Device Token ID</th>
                <th className="p-3">BDE / Employee</th>
                <th className="p-3">Hardware Model</th>
                <th className="p-3">Certificate SHA-256</th>
                <th className="p-3">Date Paired</th>
                <th className="p-3">Authorization Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id} className="border-b border-border/40 hover:bg-neutral-900/30 transition-colors">
                  <td className="p-3 font-mono text-muted-foreground">{d.id}</td>
                  <td className="p-3 font-semibold text-foreground">{d.employee}</td>
                  <td className="p-3 text-foreground flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                    {d.model}
                  </td>
                  <td className="p-3 font-mono text-muted-foreground">{d.token}</td>
                  <td className="p-3 text-muted-foreground">{d.pairedAt}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                      d.status === "Approved"
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : d.status === "Pending Verification"
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse"
                        : "bg-red-500/10 text-red-500 border border-red-500/20"
                    }`}>
                      {d.status === "Approved" ? (
                        <CheckCircle className="h-2.5 w-2.5" />
                      ) : d.status === "Pending Verification" ? (
                        <AlertCircle className="h-2.5 w-2.5" />
                      ) : (
                        <XCircle className="h-2.5 w-2.5" />
                      )}
                      {d.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1.5">
                    {d.status === "Pending Verification" && (
                      <Button
                        size="xs"
                        variant="default"
                        className="text-[10px] py-1 px-2 h-7 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        onClick={() => handleApprove(d.id)}
                      >
                        Approve
                      </Button>
                    )}
                    {d.status !== "Revoked" ? (
                      <Button
                        size="xs"
                        variant="destructive"
                        className="text-[10px] py-1 px-2 h-7 text-xs font-semibold"
                        onClick={() => handleRevoke(d.id)}
                      >
                        Revoke Token
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic px-2">Revocation Complete</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
