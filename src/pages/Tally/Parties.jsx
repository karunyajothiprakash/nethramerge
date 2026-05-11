import { useState } from 'react'
import { PageHeader } from '../../components/shared/PageHeader'
import { StatCard } from '../../components/shared/StatCard'
import { Badge } from '../../components/ui/badge'
import { Tag } from '../../components/ui/tag'
import { parties } from '../../data/mockData'
import { Plus, AlertTriangle } from 'lucide-react'


const SearchBar = ({ placeholder, value, onChange, children }) => (
  <div className="flex flex-wrap items-center gap-2">
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="input-field text-xs py-1.5 min-w-[220px]"
    />
    {children}
  </div>
)

export default function Parties() {
  const [search, setSearch] = useState('')
  const [typeFilter, setType] = useState('All')

  const filtered = parties.filter(p => {
    const s = p.name.toLowerCase().includes(search.toLowerCase()) || p.gstin.includes(search)
    const t = typeFilter === 'All' || p.type === typeFilter
    return s && t
  })

  const customers = parties.filter(p => p.type === 'Customer')
  const vendors = parties.filter(p => p.type === 'Vendor')
  const receivable = customers.reduce((s, p) => s + p.outstanding, 0)
  const payable = Math.abs(vendors.reduce((s, p) => s + p.outstanding, 0))
  const overdue = parties.reduce((s, p) => s + p.overdue, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parties"
        breadcrumbs={[{ label: 'Home' }, { label: 'Masters' }, { label: 'Parties' }]}
        actions={<button className="btn-gold text-xs py-1.5"><Plus size={13} /> Add Party</button>}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card/70 shadow-sm border-l-4 border-l-indigo-500/80">
          <StatCard label="Total Parties" value={parties.length.toString()} hint={`${customers.length} customers, ${vendors.length} vendors`} />
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card/70 shadow-sm border-l-4 border-l-emerald-500/80">
          <StatCard label="Receivables" value={`₹${(receivable / 100000).toFixed(2)}L`} hint="From customers" />
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card/70 shadow-sm border-l-4 border-l-red-500/80">
          <StatCard label="Payables" value={`₹${(payable / 100000).toFixed(2)}L`} hint="To vendors" />
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card/70 shadow-sm border-l-4 border-l-amber-500/80">
          <StatCard label="Overdue" value={`₹${(overdue / 100000).toFixed(2)}L`} hint="2 parties" />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-border bg-card/70 shadow-sm">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-card/80 flex-wrap gap-3">
          <h3 className="text-lg font-semibold text-white">All Parties ({filtered.length})</h3>
          <div className="flex items-center gap-3">
            <SearchBar placeholder="Name or GSTIN..." value={search} onChange={e => setSearch(e.target.value)} />
            <div className="flex gap-1">
              {['All','Customer','Vendor'].map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    typeFilter === t
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto bg-card/70">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card/80">
                {['Party Name','GSTIN','Type','State','Credit Limit','Outstanding','Overdue','Status',''].map(h => (
                  <th key={h} className="tbl-th tbl-header py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['Customer','Vendor'].map(type => {
                const rows = filtered.filter(p => p.type === type)
                if (!rows.length) return null
                const groupBg = type === 'Customer' ? 'bg-blue-500/10' : 'bg-amber-500/10'
                const groupText = type === 'Customer' ? 'text-blue-300' : 'text-amber-300'
                return [
                  <tr key={`g-${type}`} className={`${groupBg} border-y border-border/50`}>
                    <td colSpan={9} className="px-4 py-3 flex items-center justify-between">
                      <span className={`text-sm font-bold uppercase tracking-wider ${groupText}`}>{type}s</span>
                      <Badge className={`${groupBg} ${groupText} border-border/50`}>{rows.length}</Badge>
                    </td>
                  </tr>,
                  ...rows.map((p, i) => (
                    <tr key={i} className="tbl-row hover:bg-amber-500/5 transition-colors cursor-pointer">
                      <td className="tbl-cell font-semibold text-slate-200">{p.name}</td>
                      <td className="tbl-cell font-mono text-[11px] text-slate-500">{p.gstin}</td>
                      <td className="tbl-cell">
                        <Badge className={p.type === 'Customer' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'}>
                          {p.type}
                        </Badge>
                      </td>
                      <td className="tbl-cell text-slate-400 text-xs">{p.state}</td>
                      <td className="tbl-cell font-mono text-xs text-slate-400">{p.creditLimit}</td>
                      <td className="tbl-cell font-mono font-semibold">
                        {p.outstanding > 0
                          ? <span className="text-emerald-400">₹{p.outstanding.toLocaleString('en-IN')}</span>
                          : p.outstanding < 0
                            ? <span className="text-red-400">₹{Math.abs(p.outstanding).toLocaleString('en-IN')}</span>
                            : <span className="text-slate-600">—</span>
                        }
                      </td>
                      <td className="tbl-cell">
                        {p.overdue > 0
                          ? <div className="flex items-center gap-1">
                              <AlertTriangle size={12} className="text-amber-400" />
                              <span className="font-mono text-amber-400 font-semibold">₹{p.overdue.toLocaleString('en-IN')}</span>
                            </div>
                          : <span className="text-slate-600 text-xs">None</span>
                        }
                      </td>
                      <td className="tbl-cell">
                        <Badge className={`flex items-center gap-1 ${p.status === 'Active' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="tbl-cell">
                        <button className="text-xs text-amber-400 hover:text-amber-300 font-medium border border-amber-500/30 hover:border-amber-500/50 px-2 py-1 rounded transition-colors">Edit</button>
                      </td>
                    </tr>
                  ))
                ]
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-5 border-t border-border bg-amber-500/5 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">{filtered.length} of {parties.length} parties</span>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Total Receivable</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">₹{receivable.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-px h-4 bg-amber-500/30" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Total Payable</span>
              <span className="font-mono font-bold text-red-400 text-sm">₹{payable.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
