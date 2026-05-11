import React from 'react'
import { PageHeader } from '../../components/shared/PageHeader'
import { StatCard } from '../../components/shared/StatCard'
import { Download } from 'lucide-react'

const Row = ({ label, value, depth = 0, bold, color, big }) => (
  <tr className={`border-b border-slate-800/50 ${bold ? 'bg-slate-800/30' : 'hover:bg-slate-800/20'}`}>
    <td className={`px-4 py-2.5 text-sm ${bold ? 'font-semibold text-slate-200' : 'text-slate-400'}`}
        style={{ paddingLeft: `${16 + depth * 20}px` }}>
      {label}
    </td>
    <td className={`px-4 py-2.5 text-right font-mono text-sm ${color || (bold ? 'text-slate-200 font-bold' : 'text-slate-400')}`}>
      {value}
    </td>
    <td className="w-40"></td>
  </tr>
)

const TotalRow = ({ label, value, color = 'text-white', bg = 'bg-slate-800/60' }) => (
  <tr className={`${bg} border-y border-slate-700`}>
    <td className="px-4 py-3 font-bold text-sm text-white">{label}</td>
    <td className="px-4 py-3 text-right font-mono font-bold text-base"></td>
    <td className={`px-4 py-3 text-right font-mono font-bold text-base ${color}`}>{value}</td>
  </tr>
)

const SectionHead = ({ label }) => (
  <tr className="bg-slate-800/40">
    <td colSpan={3} className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">{label}</td>
  </tr>
)

export default function PLStatement() {
  return (
    <div>
      <PageHeader
        title="Profit & Loss Statement"
        breadcrumbs={[{ label: 'Home' }, { label: 'Reports' }, { label: 'P&L Statement' }]}
        actions={
          <div className="flex items-center gap-2">
            <select className="select-field w-32 text-xs"><option>FY 2025–26</option><option>FY 2024–25</option></select>
            <button className="btn-secondary text-xs py-1.5"><Download size={13} /> Excel</button>
            <button className="btn-primary text-xs py-1.5"><Download size={13} /> PDF</button>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Gross Revenue" value="₹28.45L" hint="FY 2025–26" />
        <StatCard label="Total Expenses" value="₹16.32L" hint="Operational costs" />
        <StatCard label="Net Profit (PBT)" value="₹12.13L" hint="Margin: 42.6%" />
        <StatCard label="Profit After Tax" value="₹9.09L" hint="Tax @25% = ₹3.03L" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
          <h3 className="font-semibold text-white text-sm">Income &amp; Expenditure Statement — FY 2025–26</h3>
          <span className="text-xs font-mono text-slate-500">All amounts in ₹</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="tbl-th tbl-header py-3 w-[55%]">Particulars</th>
                <th className="tbl-th tbl-header py-3 text-right">Amount (₹)</th>
                <th className="tbl-th tbl-header py-3 text-right w-40">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              <SectionHead label="A — Income" />
              <Row label="1. Revenue from Operations" bold />
              <Row label="Sales — Domestic" value="18,45,000" depth={1} color="text-emerald-400 font-mono" />
              <Row label="Sales — Export" value="10,00,000" depth={1} color="text-emerald-400 font-mono" />
              <Row label="Less: Sales Returns & Discounts" value="(1,20,000)" depth={1} color="text-red-400 font-mono" />
              <TotalRow label="Net Revenue from Operations" value="₹27,25,000" color="text-emerald-400" bg="bg-emerald-500/5" />
              <Row label="2. Other Income" bold />
              <Row label="Interest Received" value="80,000" depth={1} color="text-emerald-400 font-mono" />
              <Row label="Miscellaneous Income" value="40,000" depth={1} color="text-emerald-400 font-mono" />
              <TotalRow label="Total Income (A)" value="₹28,45,000" color="text-emerald-400" bg="bg-emerald-500/10" />

              <SectionHead label="B — Expenditure" />
              <Row label="3. Cost of Goods Sold" bold />
              <Row label="Opening Stock" value="5,00,000" depth={1} color="text-red-400 font-mono" />
              <Row label="Add: Purchases" value="11,60,000" depth={1} color="text-red-400 font-mono" />
              <Row label="Less: Closing Stock" value="(6,60,000)" depth={1} color="text-emerald-400 font-mono" />
              <TotalRow label="Cost of Goods Sold (COGS)" value="₹10,00,000" color="text-red-400" bg="bg-red-500/5" />
              <Row label="4. Operating Expenses" bold />
              <Row label="Salaries & Wages" value="3,50,000" depth={1} color="text-red-400 font-mono" />
              <Row label="Office Rent" value="1,35,000" depth={1} color="text-red-400 font-mono" />
              <Row label="Travel & Conveyance" value="42,000" depth={1} color="text-red-400 font-mono" />
              <Row label="Utilities & Internet" value="28,000" depth={1} color="text-red-400 font-mono" />
              <Row label="Depreciation" value="65,000" depth={1} color="text-red-400 font-mono" />
              <Row label="Bank Charges" value="12,000" depth={1} color="text-red-400 font-mono" />
              <TotalRow label="Total Expenditure (B)" value="₹16,32,000" color="text-red-400" bg="bg-red-500/10" />

              <tr className="bg-emerald-500/10 border-y-2 border-emerald-500/30">
                <td className="px-4 py-4 font-bold text-emerald-300 text-base">Net Profit Before Tax (A − B)</td>
                <td></td>
                <td className="px-4 py-4 text-right font-mono font-bold text-emerald-300 text-xl">₹12,13,000</td>
              </tr>
              <Row label="Less: Income Tax Provision @25%" value="3,03,250" depth={1} color="text-red-400 font-mono" />
              <tr className="bg-indigo-500/10 border-y-2 border-indigo-500/30">
                <td className="px-4 py-4 font-bold text-indigo-300 text-base">Profit After Tax (PAT)</td>
                <td></td>
                <td className="px-4 py-4 text-right font-mono font-bold text-indigo-300 text-xl">₹9,09,750</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
