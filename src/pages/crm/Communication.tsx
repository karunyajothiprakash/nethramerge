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

const Badge = ({ label, color = COLORS.accent }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
    {label}
  </span>
);

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

function Communication() {
  const [tab, setTab] = useState("calls");
  const tabs = [["calls", "📞 Call Logs"], ["email", "📧 Email Tracking"], ["whatsapp", "💬 WhatsApp"], ["meetings", "📅 Meetings"]];

  const callLogs = [
    { date: "May 29", time: "11:30 AM", contact: "Ahmad Al-Rashid", company: "Future Wave", duration: "18 min", outcome: "Positive", by: "Swathi" },
    { date: "May 29", time: "10:15 AM", contact: "Klaus Weber", company: "OrganicLife GmbH", duration: "12 min", outcome: "Follow-Up", by: "Priya" },
    { date: "May 28", time: "03:00 PM", contact: "Marc Dupont", company: "NaturalBest Co.", duration: "8 min", outcome: "Not Available", by: "Rajesh" },
    { date: "May 28", time: "11:00 AM", contact: "James Carter", company: "Sea Horse Pvt", duration: "22 min", outcome: "Quotation Requested", by: "Rajesh" },
  ];

  const emails = [
    { date: "May 29", subject: "Turmeric Powder — Price Revision Q2", to: "ahmad@futurewave.ae", status: "Opened", by: "Swathi" },
    { date: "May 28", subject: "Product Catalog — Organic Spices 2026", to: "k.weber@organiclife.de", status: "Delivered", by: "Priya" },
    { date: "May 27", subject: "PI-2026-421 — Payment Confirmation", to: "liwei@eastwest.sg", status: "Replied", by: "Swathi" },
  ];

  return (
    <div style={{ animation: "slideIn 0.3s ease" }}>
      <SectionHeader title="Communication Management" sub="All channels: calls, email, WhatsApp, meetings in one place" />
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: COLORS.surface, padding: 4, borderRadius: 10, width: "fit-content" }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background: tab === id ? COLORS.card : "transparent",
            color: tab === id ? COLORS.textPrimary : COLORS.textSecondary,
            border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 600
          }}>{label}</button>
        ))}
      </div>

      {tab === "calls" && (
        <Card style={{ padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                {["Date", "Time", "Contact", "Company", "Duration", "Outcome", "By"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: COLORS.textMuted, fontWeight: 600, letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {callLogs.map((c, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}22` }}>
                  <td style={{ padding: "10px 16px", fontSize: 12, color: COLORS.textSecondary }}>{c.date}</td>
                  <td style={{ padding: "10px 16px", fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}>{c.time}</td>
                  <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 500 }}>{c.contact}</td>
                  <td style={{ padding: "10px 16px", fontSize: 12, color: COLORS.textSecondary }}>{c.company}</td>
                  <td style={{ padding: "10px 16px", fontSize: 12, fontFamily: "JetBrains Mono, monospace", color: COLORS.blue }}>{c.duration}</td>
                  <td style={{ padding: "10px 16px" }}><Badge label={c.outcome} color={c.outcome === "Positive" ? COLORS.green : c.outcome === "Replied" ? COLORS.accent : COLORS.gold} /></td>
                  <td style={{ padding: "10px 16px", fontSize: 12 }}>{c.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "email" && (
        <Card style={{ padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                {["Date", "Subject", "To", "Status", "By"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: COLORS.textMuted, fontWeight: 600, letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {emails.map((e, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}22` }}>
                  <td style={{ padding: "10px 16px", fontSize: 12, color: COLORS.textSecondary }}>{e.date}</td>
                  <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 500 }}>{e.subject}</td>
                  <td style={{ padding: "10px 16px", fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: COLORS.textSecondary }}>{e.to}</td>
                  <td style={{ padding: "10px 16px" }}><Badge label={e.status} color={e.status === "Replied" ? COLORS.green : e.status === "Opened" ? COLORS.blue : COLORS.gold} /></td>
                  <td style={{ padding: "10px 16px", fontSize: 12 }}>{e.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "whatsapp" && (
        <Card>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>WhatsApp Business Integration</div>
            <div style={{ fontSize: 12, marginBottom: 16 }}>Connect your WhatsApp Business API to sync conversations</div>
            <button style={{ background: COLORS.accent, color: COLORS.bg, border: `1px solid ${COLORS.accent}`, borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Connect WhatsApp API</button>
          </div>
        </Card>
      )}

      {tab === "meetings" && (
        <div style={{ display: "grid", gap: 10 }}>
          {([
            { date: "Jun 02, 2:00 PM", title: "Q3 Pricing Discussion", with: "Ahmad Al-Rashid (Future Wave)", type: "Video Call", by: "Swathi" },
            { date: "Jun 05, 11:00 AM", title: "New Product Samples", with: "Klaus Weber (OrganicLife)", type: "In-Person", by: "Priya" },
          ]).map((m, i) => (
            <Card key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ background: COLORS.blueDim, borderRadius: 10, padding: "8px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: COLORS.blue, fontWeight: 600 }}>{m.date.split(",")[0]}</div>
                  <div style={{ fontSize: 12, color: COLORS.blue }}>{m.date.split(", ")[1]}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{m.title}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{m.with}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Badge label={m.type} color={COLORS.purple} />
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>by {m.by}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default Communication;
