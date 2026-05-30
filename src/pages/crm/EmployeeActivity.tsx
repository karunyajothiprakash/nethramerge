import { useState, useEffect } from "react";

const COLORS = {
  bg: "#0a0c10",
  surface: "#111318",
  card: "#161b22",
  border: "#21262d",
  accent: "#00d4aa",
  accentDim: "#00d4aa22",
  blue: "#388bfd",
  blueDim: "#388bfd22",
  orange: "#f78166",
  orangeDim: "#f7816622",
  purple: "#bc8cff",
  purpleDim: "#bc8cff22",
  gold: "#e3b341",
  goldDim: "#e3b34122",
  red: "#ff7b72",
  green: "#3fb950",
  textPrimary: "#e6edf3",
  textSecondary: "#8b949e",
  textMuted: "#484f58",
};

const initialEmployees = [
  { id: "E001", name: "Swathi Swathi", role: "Senior BDE", email: "swathi@shastika.com", leads: 24, calls: 87, deals: 8, revenue: 485000, target: 500000, status: "Online", ip: "192.168.1.101", device: "MacBook Pro", login: "09:02 AM", idle: "0m", location: "Chennai" },
  { id: "E002", name: "Rajesh Kumar", role: "BDE", email: "rajesh@shastika.com", leads: 18, calls: 64, deals: 5, revenue: 320000, target: 400000, status: "Online", ip: "10.0.0.45", device: "Windows PC", login: "09:15 AM", idle: "12m", location: "Tiruppur" },
  { id: "E003", name: "Priya Nair", role: "BDE", email: "priya@shastika.com", leads: 21, calls: 72, deals: 6, revenue: 410000, target: 450000, status: "Idle", ip: "172.16.0.22", device: "MacBook Air", login: "09:30 AM", idle: "28m", location: "Coimbatore" },
  { id: "E004", name: "Arjun Menon", role: "Junior BDE", email: "arjun@shastika.com", leads: 11, calls: 38, deals: 2, revenue: 145000, target: 300000, status: "Offline", ip: "—", device: "—", login: "—", idle: "—", location: "Remote" },
];

const Badge = ({ label, color = COLORS.accent }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
    {label}
  </span>
);

const statusColor = (s) => {
  const map = { "New": COLORS.blue, "Qualified": COLORS.purple, "Negotiation": COLORS.gold, "Follow-Up": COLORS.orange, "Closed Won": COLORS.green, "Closed Lost": COLORS.red, "Draft": COLORS.textSecondary, "Sent": COLORS.blue, "Approved": COLORS.green, "Online": COLORS.green, "Idle": COLORS.gold, "Offline": COLORS.textMuted };
  return map[s] || COLORS.textSecondary;
};

const Card = ({ children, style = {} }) => (
  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "16px 20px", ...style }}>
    {children}
  </div>
);

const SectionHeader = ({ title, sub }) => (
  <div style={{ marginBottom: 20 }}>
    <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary }}>{title}</h2>
    {sub && <p style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>{sub}</p>}
  </div>
);

function EmployeeActivity() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 5000); return () => clearInterval(t); }, []);

  return (
    <div style={{ animation: "slideIn 0.3s ease" }}>
      <SectionHeader title="Employee Activity Tracking" sub="Real-time monitoring: login, IP, device, work duration, idle time" />

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <MetricCard label="Online Now" value="2" color={COLORS.green} icon="🟢" />
        <MetricCard label="Idle" value="1" color={COLORS.gold} icon="🟡" />
        <MetricCard label="Offline" value="1" color={COLORS.red} icon="🔴" />
        <MetricCard label="Avg Work Hrs" value="6.4h" color={COLORS.blue} icon="⏱️" />
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {initialEmployees.map(e => (
          <Card key={e.id}>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 16, alignItems: "center" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: COLORS.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: COLORS.accent }}>
                    {e.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: "50%", background: statusColor(e.status), border: `2px solid ${COLORS.card}`, animation: e.status === "Online" ? "pulse 2s infinite" : "none" }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{e.role}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {([
                  ["Login", e.login, "🕐"],
                  ["IP Address", e.ip, "🌐"],
                  ["Device", e.device, "💻"],
                  ["Location", e.location, "📍"],
                ]).map(([label, val, icon]) => (
                  <div key={label} style={{ background: COLORS.surface, borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 2 }}>{icon} {label}</div>
                    <div style={{ fontSize: 12, fontFamily: "JetBrains Mono, monospace", color: COLORS.textPrimary }}>{val}</div>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: "right" }}>
                <Badge label={e.status} color={statusColor(e.status)} />
                {e.idle !== "—" && <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6 }}>Idle: {e.idle}</div>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

const MetricCard = ({ label, value, sub, color = COLORS.accent, icon }) => (
  <Card style={{ flex: 1, minWidth: 140 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 4 }}>{sub}</div>}
      </div>
      {icon && <div style={{ fontSize: 22, opacity: 0.6 }}>{icon}</div>}
    </div>
  </Card>
);

export default EmployeeActivity;
