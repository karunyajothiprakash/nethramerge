import { useState } from "react";

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

function CustomerDatabase() {
  const [selected, setSelected] = useState(null);
  const customers = initialLeads.filter(l => l.status !== "New");

  return (
    <div style={{ animation: "slideIn 0.3s ease" }}>
      <SectionHeader title="Customer Database" sub="Encrypted buyer profiles, inquiry history & communication timeline" />
      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1.4fr" : "1fr", gap: 16 }}>
        <div>
          {customers.map(c => (
            <Card key={c.id} style={{ marginBottom: 10, cursor: "pointer", border: selected?.id === c.id ? `1px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`, transition: "border 0.2s" }}
              onClick={() => setSelected(selected?.id === c.id ? null : c)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: COLORS.blueDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: COLORS.blue }}>
                    {c.company[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.company}</div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{c.contact} · {c.country}</div>
                  </div>
                </div>
                <Badge label={c.status} color={statusColor(c.status)} />
              </div>
            </Card>
          ))}
        </div>

        {selected && (
          <Card style={{ animation: "fadeIn 0.2s ease", border: `1px solid ${COLORS.accent}44` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{selected.company}</div>
              <Badge label="Encrypted" color={COLORS.green} />
            </div>
            {[
              ["Contact", selected.contact],
              ["Email", selected.email],
              ["Phone", selected.phone],
              ["Country", selected.country],
              ["Product Interest", selected.product],
              ["Estimated Value", `$${selected.value.toLocaleString()}`],
              ["Assigned To", selected.assignee],
              ["Lead Date", selected.date],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}22`, fontSize: 13 }}>
                <span style={{ color: COLORS.textSecondary }}>{k}</span>
                <span style={{ fontWeight: 500, fontFamily: k === "Email" || k === "Phone" ? "JetBrains Mono, monospace" : "inherit", fontSize: k === "Email" ? 12 : 13 }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, letterSpacing: "0.08em", marginBottom: 8 }}>COMMUNICATION TIMELINE</div>
              {[
                { date: "May 20", type: "Email", note: "Sent product catalog & pricing" },
                { date: "May 15", type: "Call", note: "Discussed product quality requirements" },
                { date: "May 10", type: "WhatsApp", note: "Initial contact established" },
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 10, color: COLORS.textMuted, minWidth: 40, paddingTop: 2 }}>{t.date}</span>
                  <Badge label={t.type} color={t.type === "Call" ? COLORS.green : t.type === "Email" ? COLORS.blue : COLORS.purple} />
                  <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{t.note}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default CustomerDatabase;
