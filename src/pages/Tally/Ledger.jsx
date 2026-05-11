import { useState } from 'react'
import { PageHeader } from '../../components/shared/PageHeader'
import { StatCard } from '../../components/shared/StatCard'
import { Tag } from '../../components/ui/tag'
import { ledgerEntries, fmt } from '../../data/mockData'
import { Download } from 'lucide-react'

const ACCOUNTS = ['Sales Account','Cash Account','Bank — HDFC','Raj Exports','Purchase Account','CGST Payable','Salary Expense','Capital Account']

const getTagVariant = (voucher) => {
  if (voucher.startsWith('INV')) return 'bg-amber-500/10 text-amber-300 border-amber-500/20'
  if (voucher.startsWith('JV')) return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
  if (voucher.startsWith('REC')) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
  if (voucher.startsWith('BP') || voucher.startsWith('PAY')) return 'bg-red-500/10 text-red-300 border-red-500/20'
  if (voucher.startsWith('PUR')) return 'bg-orange-500/10 text-orange-300 border-orange-500/20'
  if (voucher.startsWith('INC')) return 'bg-blue-500/10 text-blue-300 border-blue-500/20'
  return 'bg-slate-500/10 text-slate-300 border-slate-500/20'
}

export default function Ledger() {
  const [account, setAccount] = useState('Sales Account')
  const [filter, setFilter] = useState('All')

  const filtered = ledgerEntries.filter(r => {
    if (filter === 'Debit') return r.debit > 0
    if (filter === 'Credit') return r.credit > 0
    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ledger"
        breadcrumbs={[{ label: 'Home' }, { label: 'Accounts' }, { label: 'Ledger' }]}
        actions={
          <div className="flex items-center gap-2">
            <select value={account} onChange={e => setAccount(e.target.value)} className="select-field w-48 text-xs focus:border-amber-500">
              {ACCOUNTS.map(a => <option key={a}>{a}</option>)}
            </select>
            <input type="date" defaultValue="2026-03-01" className="input-field w-36 text-xs focus:border-amber-500" />
            <input type="date" defaultValue="2026-03-31" className="input-field w-36 text-xs focus:border-amber-500" />
            <button className="btn-gold text-xs py-1.5 rounded-lg shadow-gold flex items-center gap-2"><Download size={13} /> Export</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card/70 shadow-sm border-l-4 border-l-indigo-500/80">
          <StatCard label="Opening Balance" value="₹0" hint="01 Mar 2026" />
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card/70 shadow-sm border-l-4 border-l-red-500/80">
          <StatCard label="Total Debits" value="₹15,000" hint="1 transaction" />
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card/70 shadow-sm border-l-4 border-l-emerald-500/80">
          <StatCard label="Total Credits" value="₹6,60,000" hint="6 transactions" />
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card/70 shadow-sm border-l-4 border-l-blue-500/80">
          <StatCard label="Closing Balance" value="₹6,45,000 Cr" hint="31 Mar 2026" />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-border bg-card/70 shadow-sm">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-card/80">
          <div>
            <h3 className="text-lg font-semibold text-white">{account} — March 2026</h3>
            <p className="text-sm text-slate-500 mt-1">Ledger transactions with debit/credit breakdown and balance tracking.</p>
          </div>
          <div className="flex gap-1.5">
            {['All','Debit','Credit'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  filter === f
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto bg-card/70">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card/80">
                {['Date','Particulars','Voucher','Type','Debit','Credit','Balance'].map(h => (
                  <th key={h} className="tbl-th tbl-header py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i} className="tbl-row hover:bg-amber-500/5 transition-colors">
                  <td className="tbl-cell font-mono text-xs text-slate-500">{r.date}</td>
                  <td className="tbl-cell text-slate-300">{r.particulars}</td>
                  <td className="tbl-cell">{r.voucher === '—' ? <span className="text-slate-600">—</span> : <Tag className={getTagVariant(r.voucher)}>{r.voucher}</Tag>}</td>
                  <td className="tbl-cell"><span className="text-xs text-slate-500 font-mono">{r.type}</span></td>
                  <td className="tbl-cell dr text-red-400 font-mono">{r.debit ? fmt(r.debit) : '—'}</td>
                  <td className="tbl-cell cr text-emerald-400 font-mono">{r.credit ? fmt(r.credit) : '—'}</td>
                  <td className="tbl-cell font-mono font-semibold">
                    {r.balance === 0 ? '—' : (
                      <span className={r.balType === 'Cr' ? 'text-emerald-400' : 'text-red-400'}>
                        {fmt(r.balance)} {r.balType}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-amber-500/30 bg-amber-500/10">
                <td colSpan={3} className="px-4 py-4 font-semibold text-slate-200 text-sm">Closing Balance — 31 Mar 2026</td>
                <td className="px-4 py-4"></td>
                <td className="px-4 py-4 dr font-bold text-red-400">₹15,000</td>
                <td className="px-4 py-4 cr font-bold text-emerald-400">₹6,60,000</td>
                <td className="px-4 py-4 font-mono font-bold text-emerald-400">₹6,45,000 Cr</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

