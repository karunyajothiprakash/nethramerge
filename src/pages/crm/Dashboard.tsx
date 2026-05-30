import { useState } from "react";
import { Target, Bell, CheckCircle2, DollarSign, TrendingUp } from "lucide-react";

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

const initialLeads = [
  { id: "L001", company: "Future Wave Food Trading", country: "UAE", contact: "Ahmad Al-Rashid", email: "ahmad@futurewave.ae", phone: "+971 50 123 4567", product: "Turmeric Powder", status: "Negotiation", value: 85000, assignee: "Swathi", date: "2026-05-01", followUp: "2026-06-02" },
  { id: "L002", company: "Sea Horse Pvt Ltd", country: "Australia", contact: "James Carter", email: "james@seahorse.com.au", phone: "+61 2 9876 5432", product: "Coconut Oil", status: "New", value: 12000, assignee: "Rajesh", date: "2026-05-10", followUp: "2026-06-01" },
  { id: "L003", company: "OrganicLife GmbH", country: "Germany", contact: "Klaus Weber", email: "k.weber@organiclife.de", phone: "+49 89 456 789", product: "Pepper Spices", status: "Qualified", value: 45000, assignee: "Priya", date: "2026-05-12", followUp: "2026-05-30" },
  { id: "L004", company: "Greenfield Traders", country: "UK", contact: "Sarah Mitchell", email: "sarah@greenfield.co.uk", phone: "+44 20 7946 0958", product: "Basmati Rice", status: "Closed Won", value: 120000, assignee: "Swathi", date: "2026-04-20", followUp: null },
  { id: "L005", company: "NaturalBest Co.", country: "Canada", contact: "Marc Dupont", email: "marc@naturalbest.ca", phone: "+1 416 555 0192", product: "Cumin Seeds", status: "Follow-Up", value: 28000, assignee: "Rajesh", date: "2026-05-15", followUp: "2026-05-31" },
  { id: "L006", company: "Spice Kingdom LLC", country: "USA", contact: "Robert King", email: "robert@spicekingdom.com", phone: "+1 212 555 0111", product: "Cardamom", status: "New", value: 67000, assignee: "Priya", date: "2026-05-18", followUp: "2026-06-05" },
  { id: "L007", company: "EastWest Imports", country: "Singapore", contact: "Li Wei", email: "liwei@eastwest.sg", phone: "+65 9123 4567", product: "Chilli Powder", status: "Closed Lost", value: 34000, assignee: "Swathi", date: "2026-04-10", followUp: null },
];

const initialEmployees = [
  { id: "E001", name: "Swathi Swathi", role: "Senior BDE", email: "swathi@shastika.com", leads: 24, calls: 87, deals: 8, revenue: 485000, target: 500000, status: "Online", ip: "192.168.1.101", device: "MacBook Pro", login: "09:02 AM", idle: "0m", location: "Chennai" },
  { id: "E002", name: "Rajesh Kumar", role: "BDE", email: "rajesh@shastika.com", leads: 18, calls: 64, deals: 5, revenue: 320000, target: 400000, status: "Online", ip: "10.0.0.45", device: "Windows PC", login: "09:15 AM", idle: "12m", location: "Tiruppur" },
  { id: "E003", name: "Priya Nair", role: "BDE", email: "priya@shastika.com", leads: 21, calls: 72, deals: 6, revenue: 410000, target: 450000, status: "Idle", ip: "172.16.0.22", device: "MacBook Air", login: "09:30 AM", idle: "28m", location: "Coimbatore" },
  { id: "E004", name: "Arjun Menon", role: "Junior BDE", email: "arjun@shastika.com", leads: 11, calls: 38, deals: 2, revenue: 145000, target: 300000, status: "Offline", ip: "—", device: "—", login: "—", idle: "—", location: "Remote" },
];

const activityLogs = [
  { time: "09:45 AM", user: "Swathi", action: "Updated lead status", detail: "Future Wave → Negotiation", type: "lead" },
  { time: "09:32 AM", user: "Rajesh", action: "Created quotation", detail: "Sea Horse Pvt Ltd - AUD 0", type: "quote" },
  { time: "09:18 AM", user: "Priya", action: "Logged call", detail: "OrganicLife GmbH - 12 min", type: "call" },
  { time: "09:05 AM", user: "Swathi", action: "Sent email", detail: "Future Wave Food Trading", type: "email" },
  { time: "08:50 AM", user: "Rajesh", action: "Scheduled follow-up", detail: "NaturalBest Co. - May 31", type: "followup" },
  { time: "08:30 AM", user: "Swathi", action: "Login detected", detail: "IP: 192.168.1.101 | Chennai", type: "security" },
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

const MetricCard = ({ label, value, sub, color = COLORS.accent, icon }) => (
  <Card style={{ flex: 1, minWidth: 140 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 4 }}>{sub}</div>}
      </div>
      {icon && <div style={{ opacity: 0.6 }}>{icon}</div>}
    </div>
  </Card>
);

const SectionHeader = ({ title, sub }) => (
  <div style={{ marginBottom: 20 }}>
    <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary }}>{title}</h2>
    {sub && <p style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>{sub}</p>}
  </div>
);

const ProgressBar = ({ value, max, color = COLORS.accent }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ width: "100%", background: COLORS.border, borderRadius: 4, height: 6, marginTop: 6 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.5s" }} />
    </div>
  );
};

function Dashboard() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const revenueData = [280000, 340000, 295000, 410000, 485000, 520000];
  const maxRev = Math.max(...revenueData);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <SectionHeader title="CRM Dashboard" sub="Shastika Global Impex — Agri Export ERP Overview" />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <MetricCard label="Total Leads" value="75" sub="+12 this month" color={COLORS.blue} icon={<Target size={22} color={COLORS.blue} />} />
        <MetricCard label="Pending Follow-Ups" value="18" sub="5 overdue" color={COLORS.orange} icon={<Bell size={22} color={COLORS.orange} />} />
        <MetricCard label="Closed Deals" value="21" sub="This quarter" color={COLORS.green} icon={<CheckCircle2 size={22} color={COLORS.green} />} />
        <MetricCard label="Revenue (USD)" value="$1.36M" sub="vs $1.1M last quarter" color={COLORS.accent} icon={<DollarSign size={22} color={COLORS.accent} />} />
        <MetricCard label="Conversion Rate" value="28%" sub="+4% vs last month" color={COLORS.purple} icon={<TrendingUp size={22} color={COLORS.purple} />} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: COLORS.textSecondary }}>MONTHLY REVENUE TREND</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
            {revenueData.map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: "100%", background: i === 4 ? COLORS.accent : COLORS.blue + "55", borderRadius: "4px 4px 0 0", height: `${(v / maxRev) * 90}px`, transition: "height 0.5s", position: "relative" }}>
                  {i === 4 && <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: COLORS.accent, whiteSpace: "nowrap", fontFamily: "JetBrains Mono, monospace" }}>$485K</div>}
                </div>
                <span style={{ fontSize: 10, color: COLORS.textMuted }}>{months[i]}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: COLORS.textSecondary }}>LEAD STATUS BREAKDOWN</div>
          {["New", "Qualified", "Negotiation", "Follow-Up", "Closed Won", "Closed Lost"].map((s) => {
            const color = statusColor(s);
            const count = initialLeads.filter(l => l.status === s).length;
            return (
              <div key={s} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: COLORS.textSecondary }}>{s}</span>
                  <span style={{ color, fontFamily: "JetBrains Mono, monospace" }}>{count}</span>
                </div>
                <ProgressBar value={count} max={initialLeads.length} color={color} />
              </div>
            );
          })}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: COLORS.textSecondary }}>EMPLOYEE PERFORMANCE</div>
          {initialEmployees.map(e => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: COLORS.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: COLORS.accent, flexShrink: 0 }}>
                {e.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{e.name}</div>
                <ProgressBar value={e.revenue} max={e.target} color={e.revenue >= e.target * 0.9 ? COLORS.green : e.revenue >= e.target * 0.7 ? COLORS.gold : COLORS.orange} />
              </div>
              <span style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: COLORS.textSecondary, flexShrink: 0 }}>${(e.revenue / 1000).toFixed(0)}K</span>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: COLORS.textSecondary }}>RECENT ACTIVITY</div>
          {activityLogs.slice(0, 5).map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "JetBrains Mono, monospace", minWidth: 52, paddingTop: 2 }}>{a.time}</span>
              <div style={{ flex: 1, borderLeft: `2px solid ${COLORS.border}`, paddingLeft: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{a.action}</div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{a.detail}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
