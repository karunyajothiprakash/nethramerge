import { useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import Card from "@/components/Card";
import { Eye, Monitor, Clock, Play, AlertCircle, ShieldAlert, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScreenMonitor() {
  const [screens] = useState([
    { id: "M-101", name: "Swathi Swathi", role: "Senior BDE", activeApp: "Vite CRM · Leads Pipeline", idle: "Active now", status: "Online" },
    { id: "M-102", name: "Rajesh Kumar", role: "BDE", activeApp: "Zoho API Sync Module", idle: "12m idle", status: "Idle" },
    { id: "M-103", name: "Priya Nair", role: "BDE", activeApp: "Excel · Turkey Turmeric Invoice", idle: "Active now", status: "Online" },
    { id: "M-104", name: "Arjun Menon", role: "Junior BDE", activeApp: "Offline", idle: "2h offline", status: "Offline" }
  ]);

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      <SectionHeader
        title="Live BDE Screen Monitoring & Auditing"
        sub="Audit live employee screens, monitor idle timers, and verify data privacy compliance for remote sales terminals"
        actions={
          <Button size="sm" className="btn-gold shadow-md">
            <RefreshCw className="h-4 w-4 mr-1.5" /> Re-sync Screens
          </Button>
        }
      />

      {/* Grid Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Monitor className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Terminals Monitored</div>
            <div className="text-2xl font-bold font-mono mt-0.5">4 Active</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Compliance Status</div>
            <div className="text-2xl font-bold font-mono mt-0.5">Secure</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Log Retentions</div>
            <div className="text-2xl font-bold font-mono mt-0.5">30 Days</div>
          </div>
        </Card>
      </div>

      {/* Screens Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {screens.map((s, i) => (
          <Card key={i} className="p-5 flex flex-col justify-between gap-4 bg-card/60 backdrop-blur-md hover:border-primary/30 transition-all duration-300">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground leading-normal">{s.name}</h4>
                  <p className="text-[10px] text-muted-foreground">{s.role}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[9px] ${
                  s.status === "Online"
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : s.status === "Idle"
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    : "bg-neutral-800 text-muted-foreground border border-neutral-700"
                }`}>
                  {s.status}
                </span>
              </div>

              {/* Mock Screen Screenshot */}
              <div className="h-28 rounded-lg bg-neutral-900 border border-border flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#00d4aa_1px,transparent_1px)] [background-size:8px_8px]" />
                {s.status !== "Offline" ? (
                  <>
                    <Eye className="h-6 w-6 text-muted-foreground opacity-30 animate-pulse" />
                    <span className="text-[9px] text-muted-foreground mt-2 font-mono truncate max-w-[140px]">{s.activeApp}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-6 w-6 text-muted-foreground opacity-20" />
                    <span className="text-[9px] text-muted-foreground mt-2 font-mono">Terminal Offline</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="h-3 w-3" /> {s.idle}
              </span>
              {s.status !== "Offline" && (
                <Button size="sm" variant="ghost" className="text-[10px] font-semibold h-7 py-1 px-2">
                  <Play className="h-3 w-3 mr-1" /> View Live
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-500" /> Screen Compliance Auditing Policy
        </h3>
        <p className="text-xs text-muted-foreground leading-normal">
          In compliance with international AgriExport trade regulations and client privacy agreements, remote sales terminal screens are monitored during active hours to check for non-disclosed data transactions. Logs are encrypted and accessible only by corporate system admins.
        </p>
      </Card>
    </div>
  );
}
