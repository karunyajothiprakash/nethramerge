import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import Card from "@/components/Card";
import { Smartphone, QrCode, Shield, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";

export default function MobileLogin() {
  const [sessions, setSessions] = useState([
    { id: "S-1092", device: "iPhone 15 Pro", location: "Chennai, India", ip: "192.168.1.101", lastActive: "Just now", status: "Active" },
    { id: "S-1087", device: "OnePlus 11", location: "Coimbatore, India", ip: "106.51.28.14", lastActive: "2 hours ago", status: "Active" },
    { id: "S-1021", device: "iPad Air", location: "Tiruppur, India", ip: "49.37.192.88", lastActive: "3 days ago", status: "Expired" }
  ]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [pairingToken, setPairingToken] = useState<string>("");

  const generateQRCode = async () => {
    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setPairingToken(token);
      // Generate a dynamic pairing payload
      const payload = JSON.stringify({
        action: "pair-bde",
        token: token,
        url: window.location.origin,
        timestamp: Date.now()
      });
      const url = await QRCode.toDataURL(payload, {
        width: 176,
        margin: 2,
        color: {
          dark: "#0a0a0a",
          light: "#ffffff"
        }
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error("Failed to generate QR Code", err);
    }
  };

  useEffect(() => {
    generateQRCode();
    // Rotate code every 60 seconds
    const interval = setInterval(generateQRCode, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRegenerateQR = async () => {
    setIsRegenerating(true);
    await generateQRCode();
    setTimeout(() => setIsRegenerating(false), 600);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Mobile Login & Pairing"
        description="Authorize new mobile device sessions and manage active connections"
        breadcrumbs={[{ label: "CRM", to: "/crm/dashboard" }, { label: "Mobile Login" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Code pairing card */}
        <Card className="lg:col-span-1 flex flex-col items-center justify-between text-center p-8 bg-card/60 backdrop-blur-md">
          <div className="space-y-3 w-full">
            <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-md">
              <QrCode className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Scan to Pair</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Scan this secure single-use QR code using the Shastika Mobile app to authorize your BDE session.
            </p>
          </div>

          <div className="my-8 relative bg-white p-2 rounded-xl shadow-gold shadow-sm flex items-center justify-center border border-primary/30">
            <div className={`transition-all duration-300 ${isRegenerating ? "opacity-30 blur-xs" : "opacity-100"}`}>
              <div className="w-44 h-44 flex items-center justify-center bg-white rounded-lg">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="Pairing QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-neutral-900 animate-pulse rounded-lg" />
                )}
              </div>
            </div>
            {isRegenerating && (
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              </div>
            )}
          </div>

          <div className="w-full space-y-4">
            <div className="text-[11px] font-mono text-muted-foreground flex items-center justify-center gap-1">
              <Shield className="h-3 w-3 text-emerald-500" /> Codes rotate every 60 seconds
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-primary/30 hover:bg-primary/10 text-xs font-semibold"
              onClick={handleRegenerateQR}
              disabled={isRegenerating}
            >
              <RefreshCw className={`h-3 w-3 mr-1.5 ${isRegenerating ? "animate-spin" : ""}`} /> Regenerate QR Code
            </Button>
          </div>
        </Card>

        {/* Info and Instructions */}
        <Card className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">Mobile Device Authorization</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Follow these secure steps to authenticate mobile clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-neutral-900/40 border border-white/5 space-y-2">
              <div className="text-primary font-bold text-sm">1. Install Shastika CRM</div>
              <p className="text-xs text-muted-foreground">
                Download the official application for iOS or Android from the private corporate app store.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-neutral-900/40 border border-white/5 space-y-2">
              <div className="text-primary font-bold text-sm">2. Scan Pairing QR</div>
              <p className="text-xs text-muted-foreground">
                Open the app, select &quot;Scan ERP QR&quot; and point your device camera at the rotating QR on the left.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-neutral-900/40 border border-white/5 space-y-2">
              <div className="text-primary font-bold text-sm">3. Approve Token</div>
              <p className="text-xs text-muted-foreground">
                Confirm the login authorization request via 2FA verification on your registered work email.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-neutral-900/40 border border-white/5 space-y-2">
              <div className="text-primary font-bold text-sm">4. Start Synchronization</div>
              <p className="text-xs text-muted-foreground">
                Your device will immediately download hot leads, customer databases, and enable secure call logs sync.
              </p>
            </div>
          </div>

          {/* Active mobile sessions */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-primary" /> Active Mobile Sessions
              </h4>
              <span className="text-xs text-emerald-500 font-medium">2 Devices Online</span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-900/60 text-muted-foreground font-semibold border-b border-border">
                    <th className="p-3">Device</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Last Active</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className="border-b border-border/40 hover:bg-neutral-900/30 transition-colors">
                      <td className="p-3 font-medium text-foreground flex items-center gap-1.5">
                        <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                        {s.device}
                      </td>
                      <td className="p-3 text-muted-foreground">{s.location}</td>
                      <td className="p-3 font-mono text-muted-foreground">{s.ip}</td>
                      <td className="p-3 text-muted-foreground">{s.lastActive}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          s.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-neutral-800 text-muted-foreground border border-neutral-700"
                        }`}>
                          {s.status === "Active" ? (
                            <CheckCircle className="h-2.5 w-2.5" />
                          ) : (
                            <AlertCircle className="h-2.5 w-2.5" />
                          )}
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
