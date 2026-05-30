import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import Card from "@/components/Card";
import { MapPin, Navigation, Signal, Eye, Clock, ShieldCheck, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GPSTracking() {
  const [agents] = useState([
    { id: "A-8821", name: "Swathi Swathi", status: "Active (On Route)", battery: "84%", signal: "Strong", lastLocation: "Nungambakkam, Chennai", coordinates: "13.0604° N, 80.2496° E", lastUpdate: "3 mins ago" },
    { id: "A-8819", name: "Rajesh Kumar", status: "Active (Client Meet)", battery: "92%", signal: "Moderate", lastLocation: "Gandhipuram, Coimbatore", coordinates: "11.0168° N, 76.9558° E", lastUpdate: "12 mins ago" },
    { id: "A-8812", name: "Priya Nair", status: "Active (Travel)", battery: "76%", signal: "Strong", lastLocation: "Palladam Road, Tiruppur", coordinates: "10.9691° N, 77.3481° E", lastUpdate: "Just now" },
    { id: "A-8805", name: "Arjun Menon", status: "Offline", battery: "—", signal: "—", lastLocation: "Remote (Home)", coordinates: "—", lastUpdate: "2 hours ago" }
  ]);

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      <PageHeader
        title="GPS Tracking & Check-ins"
        description="Verify BDE site visits and client meetings with secure cryptographic GPS coordinates"
        breadcrumbs={[{ label: "CRM", to: "/crm/dashboard" }, { label: "GPS Tracking" }]}
        actions={
          <Button size="sm" className="btn-gold shadow-md">
            <Compass className="h-4 w-4 mr-1.5" /> Start Live Monitoring
          </Button>
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Active Field Agents</div>
            <div className="text-2xl font-bold text-foreground font-mono mt-0.5">3 Online</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Check-in Authentications</div>
            <div className="text-2xl font-bold text-foreground font-mono mt-0.5">24 Verified Today</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Navigation className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Mileage Synced</div>
            <div className="text-2xl font-bold text-foreground font-mono mt-0.5">148.5 km</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Map Mock (Lucid Aesthetics) */}
        <Card className="lg:col-span-1 flex flex-col justify-between p-6 bg-card/60 backdrop-blur-md border-border">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Signal className="h-4 w-4 text-emerald-500" /> Active Tracking Radar
            </h3>
            <p className="text-xs text-muted-foreground">
              Encrypted mobile connection logs synced to backend servers every 2 minutes.
            </p>
          </div>

          {/* Visual Map Mock */}
          <div className="my-6 h-48 rounded-xl bg-neutral-900 border border-border flex items-center justify-center relative overflow-hidden">
            {/* Grid pattern mock map */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#00d4aa_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
            <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            {/* Mock map pins */}
            <div className="absolute top-1/3 left-1/4 flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping absolute" />
              <div className="w-2.5 h-2.5 rounded-full bg-primary relative" />
              <span className="text-[9px] font-semibold text-foreground px-1.5 py-0.5 rounded-sm bg-neutral-950 border border-white/10 mt-1 shadow-sm font-mono">Swathi</span>
            </div>

            <div className="absolute bottom-1/4 right-1/3 flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
              <span className="text-[9px] font-semibold text-foreground px-1.5 py-0.5 rounded-sm bg-neutral-950 border border-white/10 mt-1 shadow-sm font-mono">Priya</span>
            </div>
            
            <div className="absolute top-1/2 right-1/4 flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping absolute" />
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 relative" />
              <span className="text-[9px] font-semibold text-foreground px-1.5 py-0.5 rounded-sm bg-neutral-950 border border-white/10 mt-1 shadow-sm font-mono">Rajesh</span>
            </div>

            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase absolute top-3 right-3 tracking-widest bg-neutral-950/80 px-2 py-0.5 rounded-md border border-white/5">
              Live Feed
            </span>
          </div>

          <div className="space-y-3">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3 text-primary" /> Last server update: Just now
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs font-semibold border-primary/20 hover:bg-primary/10">
              Refresh Map Feed
            </Button>
          </div>
        </Card>

        {/* Live Agent Location List */}
        <Card className="lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Field Representatives Live Status</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time coordinates and device statuses</p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-900/60 text-muted-foreground font-semibold border-b border-border">
                  <th className="p-3">Agent</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Battery</th>
                  <th className="p-3">Signal</th>
                  <th className="p-3">Last Known Location</th>
                  <th className="p-3">Coordinates</th>
                  <th className="p-3">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id} className="border-b border-border/40 hover:bg-neutral-900/30 transition-colors">
                    <td className="p-3 font-semibold text-foreground">{a.name}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        a.status.includes("Active")
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-neutral-800 text-muted-foreground border border-neutral-700"
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-muted-foreground">{a.battery}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center font-semibold text-[10px] ${
                        a.signal === "Strong" ? "text-emerald-500" : a.signal === "Moderate" ? "text-amber-500" : "text-muted-foreground"
                      }`}>
                        {a.signal}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{a.lastLocation}</td>
                    <td className="p-3 font-mono text-muted-foreground">{a.coordinates}</td>
                    <td className="p-3 text-muted-foreground">{a.lastUpdate}</td>
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
