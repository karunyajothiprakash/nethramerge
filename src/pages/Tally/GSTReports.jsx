import { useState, useEffect } from 'react'
import { PageHeader } from '../../components/shared/PageHeader'
import { StatCard } from '../../components/shared/StatCard'
import { Badge } from '../../components/ui/badge'
import { Tag } from '../../components/ui/tag'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import { Download, AlertTriangle, Loader2 } from 'lucide-react'

const fmt = (n) => (n || n === 0) ? Number(n).toLocaleString('en-IN') : '—'

const defaultFilingStatus = {
  gstr1_status: 'Pending',
  gstr3b_status: 'Pending',
  gstr2a_status: 'Pending',
  net_gst_payable: 0,
}

export default function GSTReports() {
  const [gstrData, setGstrData] = useState([])
  const [filingStatus, setFilingStatus] = useState(defaultFilingStatus)
  const [loading, setLoading] = useState(true)

  const fetchGSTData = async () => {
    setLoading(true)
    try {
      const { data: reports, error: reportsError } = await supabase
        .from('gst_reports')
        .select('*')
        .eq('month', 'March 2026')
        .order('date', { ascending: false })

      if (reportsError) {
        throw reportsError
      }

      const { data: statusData, error: statusError } = await supabase
        .from('gst_filing_status')
        .select('*')
        .eq('month', 'March 2026')
        .single()

      if (statusError && statusError.code !== 'PGRST116') {
        throw statusError
      }

      setGstrData(reports || [])
      setFilingStatus(statusData || defaultFilingStatus)
    } catch (error) {
      toast.error('Unable to load GST report data.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGSTData()
  }, [])

  const totTaxable = gstrData.reduce((s, r) => s + (Number(r.taxable_value) || 0), 0)
  const totCgst = gstrData.reduce((s, r) => s + (Number(r.cgst) || 0), 0)
  const totSgst = gstrData.reduce((s, r) => s + (Number(r.sgst) || 0), 0)
  const totIgst = gstrData.reduce((s, r) => s + (Number(r.igst) || 0), 0)
  const totTotal = gstrData.reduce((s, r) => s + (Number(r.total) || 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="GST Reports"
        breadcrumbs={[{ label: 'Home' }, { label: 'Reports' }, { label: 'GST' }]}
        actions={
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20 font-mono">33AABCE1234F1Z5</Badge>
            <select className="select-field w-36 text-xs"><option>March 2026</option><option>February 2026</option></select>
            <button className="btn-gold text-xs py-1.5 rounded-lg shadow-gold/10"><Download size={13} /> GSTR-1</button>
            <button className="btn-gold text-xs py-1.5 rounded-lg shadow-gold/10 border-emerald-500/30 text-emerald-300"><Download size={13} /> GSTR-3B</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card/70 shadow-sm border-l-4 border-l-red-500/80">
          <StatCard label="Output GST" value={`₹${fmt(totCgst + totSgst + totIgst)}`} hint="CGST+SGST+IGST" />
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card/70 shadow-sm border-l-4 border-l-emerald-500/80">
          <StatCard label="Input Tax Credit (ITC)" value="₹38,500" hint="Available set-off" />
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card/70 shadow-sm border-l-4 border-l-amber-500/80">
          <StatCard label="Net GST Payable" value={`₹${fmt(filingStatus.net_gst_payable)}`} hint="Due 20 Apr 2026" />
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card/70 shadow-sm p-5">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest font-mono mb-3">Filing Status</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">GSTR-1</span>
              <Badge className={filingStatus.gstr1_status === 'Filed' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'}>{filingStatus.gstr1_status}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">GSTR-3B</span>
              <Badge className={filingStatus.gstr3b_status === 'Filed' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'}>{filingStatus.gstr3b_status}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">GSTR-2A Recon</span>
              <Badge className={filingStatus.gstr2a_status === 'Filed' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'}>{filingStatus.gstr2a_status}</Badge>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-border bg-card/70 p-8 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading GST reports...
        </div>
      ) : gstrData.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card/70 p-8 text-center text-slate-400">
          No GST report data found for March 2026.
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card/70 shadow-sm mb-4">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-card/80">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-white">GSTR-1 — Outward Supplies (B2B)</h3>
                <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20 flex items-center gap-1">
                  <AlertTriangle size={12} /> Pending Filing — Due 11 Apr
                </Badge>
              </div>
            </div>
            <div className="overflow-x-auto bg-card/70">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-card/80">
                    {['Invoice No.','Party Name','GSTIN','Date','Taxable Value','CGST','SGST','IGST','Total'].map((h) => (
                      <th key={h} className="tbl-th tbl-header py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gstrData.map((r) => (
                    <tr key={r.id} className="tbl-row hover:bg-amber-500/5 transition-colors">
                      <td className="tbl-cell"><Tag variant="gold">{r.invoice_no}</Tag></td>
                      <td className="tbl-cell text-slate-300">{r.party_name}</td>
                      <td className="tbl-cell font-mono text-[11px] text-slate-500">{r.gstin}</td>
                      <td className="tbl-cell font-mono text-xs text-slate-500">{r.date}</td>
                      <td className="tbl-cell font-mono text-slate-300">{fmt(r.taxable_value)}</td>
                      <td className="tbl-cell font-mono text-slate-400">{fmt(r.cgst)}</td>
                      <td className="tbl-cell font-mono text-slate-400">{fmt(r.sgst)}</td>
                      <td className="tbl-cell font-mono text-slate-400">{fmt(r.igst)}</td>
                      <td className="tbl-cell font-mono font-semibold text-emerald-400">₹{fmt(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-amber-500/30 bg-amber-500/10">
                    <td colSpan={4} className="px-4 py-4 font-bold text-white">Totals</td>
                    <td className="px-4 py-4 font-mono font-bold text-slate-200">{fmt(totTaxable)}</td>
                    <td className="px-4 py-4 font-mono font-bold text-slate-200">{fmt(totCgst)}</td>
                    <td className="px-4 py-4 font-mono font-bold text-slate-200">{fmt(totSgst)}</td>
                    <td className="px-4 py-4 font-mono font-bold text-slate-200">{fmt(totIgst)}</td>
                    <td className="px-4 py-4 font-mono font-bold text-emerald-400">₹{fmt(totTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card/70 shadow-sm">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-card/80">
                <h3 className="text-lg font-semibold text-white">GSTR-3B — ITC Claim</h3>
                <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20">Filed</Badge>
              </div>
              <div className="overflow-x-auto bg-card/70">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-card/80">
                      {['Category','IGST','CGST','SGST','Total ITC'].map((h) => (
                        <th key={h} className="tbl-th tbl-header py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="tbl-row hover:bg-amber-500/5 transition-colors">
                      <td className="tbl-cell text-slate-300">Inputs (Purchases)</td>
                      <td className="tbl-cell font-mono text-slate-400">12,000</td>
                      <td className="tbl-cell font-mono text-slate-400">8,500</td>
                      <td className="tbl-cell font-mono text-slate-400">8,500</td>
                      <td className="tbl-cell font-mono font-semibold text-emerald-400">₹29,000</td>
                    </tr>
                    <tr className="tbl-row hover:bg-amber-500/5 transition-colors">
                      <td className="tbl-cell text-slate-300">Capital Goods</td>
                      <td className="tbl-cell font-mono text-slate-500">—</td>
                      <td className="tbl-cell font-mono text-slate-400">4,750</td>
                      <td className="tbl-cell font-mono text-slate-400">4,750</td>
                      <td className="tbl-cell font-mono font-semibold text-emerald-400">₹9,500</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-emerald-500/30 bg-emerald-500/10">
                      <td className="px-4 py-4 font-bold text-white">Total ITC</td>
                      <td className="px-4 py-4 font-mono font-bold text-slate-200">12,000</td>
                      <td className="px-4 py-4 font-mono font-bold text-slate-200">13,250</td>
                      <td className="px-4 py-4 font-mono font-bold text-slate-200">13,250</td>
                      <td className="px-4 py-4 font-mono font-bold text-emerald-400">₹38,500</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-border bg-card/70 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-amber-500/30 pb-2">Net GST Calculation — Mar 2026</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-400">Output GST Liability</span>
                  <span className="font-mono font-semibold text-red-400">₹{fmt(totCgst + totSgst + totIgst)}</span>
                </div>
                <div className="border-t border-slate-800 my-3" />
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-400">Less: IGST Credit</span>
                  <span className="font-mono font-semibold text-emerald-400">-₹12,000</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-400">Less: CGST Credit</span>
                  <span className="font-mono font-semibold text-emerald-400">-₹13,250</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-400">Less: SGST Credit</span>
                  <span className="font-mono font-semibold text-emerald-400">-₹13,250</span>
                </div>
              </div>
              <div className="border-t border-amber-500/30 mt-4 pt-4">
                <div className="flex justify-between items-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-sm shadow-amber-500/20">
                  <span className="font-bold text-white">Net Payable in Cash</span>
                  <span className="font-mono font-bold text-amber-400 text-xl">₹{fmt(filingStatus.net_gst_payable)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
