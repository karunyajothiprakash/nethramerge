/**
 * FaceAttendance.tsx
 * Main Face Attendance page — uses FaceScanner component
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import FaceScanner from '../components/FaceScanner';
import {
    getAllFaceEmbeddings,
    recordCheckIn,
    recordCheckOut,
    getTodayAttendance,
    getTodaySummary,
} from '../services/supabase';
import { loadModels, findBestMatch, areModelsLoaded } from '../services/faceEngine';

const CONFIDENCE_THRESHOLD = 55;

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusChip({ status }: { status: string }) {
    const map: Record<string, { bg: string; color: string; label: string }> = {
        present: { bg: 'rgba(0,255,136,0.12)', color: '#00ff88', label: 'Present' },
        late: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', label: 'Late' },
        absent: { bg: 'rgba(255,68,102,0.12)', color: '#ff4466', label: 'Absent' },
    };
    const s = map[status] || { bg: '#1e293b', color: '#94a3b8', label: status };
    return (
        <span style={{
            background: s.bg, color: s.color, borderRadius: '20px',
            padding: '3px 10px', fontSize: '11px', fontWeight: 600,
            letterSpacing: '0.04em', textTransform: 'uppercase' as const,
        }}>{s.label}</span>
    );
}

function StatCard({ label, value, accent }: { label: string; value: any; accent?: string }) {
    return (
        <div style={{
            background: '#0d1424', border: `1px solid ${accent || '#1e293b'}`,
            borderRadius: '12px', padding: '16px', flex: 1, minWidth: '100px',
        }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: accent || '#e2e8f0' }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{label}</div>
        </div>
    );
}

function TimeRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>{label}</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: accent ? '#00ff88' : '#e2e8f0' }}>{value}</span>
        </div>
    );
}

function AttendanceRow({ record }: { record: any }) {
    const fmt = (ts: string) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 0', borderBottom: '1px solid #1e293b', gap: '8px',
        }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {record.name || record.full_name || '—'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{record.role || record.department || ''}</div>
            </div>
            <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    {fmt(record.clock_in || record.punch_in)}
                    {(record.clock_out || record.punch_out) ? ` → ${fmt(record.clock_out || record.punch_out)}` : ''}
                </div>
                <StatusChip status={record.attendance_status || record.status || 'absent'} />
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FaceAttendance() {
    const [storedEmbeddings, setStoredEmbeddings] = useState<any[]>([]);
    const [todaySummary, setTodaySummary] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [scanPhase, setScanPhase] = useState<'idle' | 'scanning' | 'matching' | 'recording' | 'done' | 'error'>('idle');
    const [scanMessage, setScanMessage] = useState('');
    const [scanResult, setScanResult] = useState<any>(null);
    const [stats, setStats] = useState({ present: 0, late: 0, absent: 0, total: 0 });
    const [modelsReady, setModelsReady] = useState(false);
    const [clock, setClock] = useState(new Date());

    const scannerRef = useRef<any>(null);
    const isMounted = useRef(true);

    // Live clock
    useEffect(() => {
        const t = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    // Init
    useEffect(() => {
        isMounted.current = true;
        initPage();
        return () => { isMounted.current = false; };
    }, []);

    async function initPage() {
        setLoadingData(true);
        try {
            if (!areModelsLoaded()) {
                loadModels('/models').then(() => { if (isMounted.current) setModelsReady(true); });
            } else {
                setModelsReady(true);
            }

            const [embeddings, summary] = await Promise.all([
                getAllFaceEmbeddings(),
                getTodaySummary(),
            ]);

            if (!isMounted.current) return;
            setStoredEmbeddings(embeddings);
            setTodaySummary(summary);
            computeStats(summary);
        } catch (err) {
            console.error('[FaceAttendance] Init error:', err);
        } finally {
            if (isMounted.current) setLoadingData(false);
        }
    }

    function computeStats(summary: any[]) {
        const present = summary.filter(r => (r.attendance_status || r.status) === 'present').length;
        const late = summary.filter(r => (r.attendance_status || r.status) === 'late').length;
        const total = summary.length;
        setStats({ present, late, absent: Math.max(0, total - present - late), total });
    }

    // ── Scan handlers ────────────────────────────────────────────────────────────

    function handleStartScan() {
        if (!modelsReady) { setScanMessage('AI models still loading, please wait…'); return; }
        if (storedEmbeddings.length === 0) { setScanMessage('No faces registered yet. Ask admin to register employees first.'); return; }
        setScanPhase('scanning');
        setScanning(true);
        setScanResult(null);
        setScanMessage('');
        setTimeout(() => { scannerRef.current?.startScan(); }, 600);
    }

    function handleCancelScan() {
        scannerRef.current?.stopCamera();
        setScanning(false);
        setScanPhase('idle');
        setScanMessage('');
    }

    const handleScanComplete = useCallback(async (embedding: Float32Array) => {
        if (!isMounted.current) return;
        setScanPhase('matching');
        setScanMessage('Matching face against database…');

        try {
            const matchResult = findBestMatch(embedding, storedEmbeddings);

            if (!matchResult.matched || matchResult.confidence < CONFIDENCE_THRESHOLD) {
                throw new Error(
                    `Face not recognised (${matchResult.confidence}% confidence). ` +
                    `Try again in better lighting or ask admin to re-register your face.`
                );
            }

            setScanPhase('recording');
            setScanMessage(`Matched ${matchResult.employee?.full_name || matchResult.employee?.name} (${matchResult.confidence}%) — saving…`);

            const existing = await getTodayAttendance(matchResult.employeeId);
            let record: any;

            if (existing?.clock_in && !existing?.clock_out) {
                record = await recordCheckOut(matchResult.employeeId);
                record._action = 'check-out';
            } else if (existing?.clock_in && existing?.clock_out) {
                record = existing;
                record._action = 'already-done';
            } else {
                record = await recordCheckIn(matchResult.employeeId, matchResult.confidence / 100);
                record._action = 'check-in';
            }

            if (!isMounted.current) return;
            scannerRef.current?.stopCamera();
            setScanPhase('done');
            setScanResult({ employee: matchResult.employee, confidence: matchResult.confidence, record, action: record._action });
            setScanning(false);

            const summary = await getTodaySummary();
            if (isMounted.current) { setTodaySummary(summary); computeStats(summary); }

        } catch (err: any) {
            if (!isMounted.current) return;
            setScanPhase('error');
            setScanMessage(err.message);
            setScanning(false);
        }
    }, [storedEmbeddings]);

    const handleScanError = useCallback((msg: string) => {
        if (!isMounted.current) return;
        setScanPhase('error');
        setScanMessage(msg);
        setScanning(false);
    }, []);

    // ── Helpers ──────────────────────────────────────────────────────────────────

    const fmt = (ts: string) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
    const fmtDate = () => new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const uniqueFaces = [...new Set(storedEmbeddings.map(e => e.employee_id))].length;

    // ─── Render ───────────────────────────────────────────────────────────────────

    return (
        <div style={S.page}>
            <div style={S.container}>

                {/* ── Header ── */}
                <header style={S.header}>
                    <div style={S.logoArea}>
                        <div style={S.logoIcon}>⬡</div>
                        <div>
                            <h1 style={S.title}>Face Attendance</h1>
                            <p style={S.dateText}>{fmtDate()}</p>
                        </div>
                    </div>
                    <div style={S.clockBadge}>
                        {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                </header>

                {/* ── Stats ── */}
                {!loadingData && (
                    <div style={S.statsRow}>
                        <StatCard label="Present" value={stats.present} accent="#00ff88" />
                        <StatCard label="Late" value={stats.late} accent="#fbbf24" />
                        <StatCard label="Absent" value={stats.absent} accent="#ff4466" />
                        <StatCard label="Registered" value={uniqueFaces} accent="#00c8ff" />
                    </div>
                )}

                {/* ── Scan Panel ── */}
                <div style={S.scanPanel}>

                    {/* Idle */}
                    {!scanning && scanPhase === 'idle' && (
                        <div style={S.center}>
                            <div style={S.faceIcon}>
                                <svg width="52" height="52" viewBox="0 0 48 48" fill="none">
                                    <circle cx="24" cy="24" r="23" stroke="#1e293b" strokeWidth="2" />
                                    <circle cx="24" cy="20" r="7" stroke="#00c8ff" strokeWidth="2" />
                                    <path d="M10 40c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#00c8ff" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                            <h2 style={S.heading}>Mark Attendance</h2>
                            <p style={S.sub}>
                                Look directly at the camera when scanning begins.
                                The system will automatically identify and record your attendance.
                            </p>
                            {!modelsReady && (
                                <p style={{ color: '#fbbf24', fontSize: '12px', margin: 0 }}>⏳ Loading AI models…</p>
                            )}
                            <button style={S.btnPrimary} onClick={handleStartScan}>
                                <span style={{ fontSize: '18px' }}>◉</span> Start Face Scan
                            </button>
                            {scanMessage && <p style={S.errorText}>{scanMessage}</p>}
                        </div>
                    )}

                    {/* Scanning */}
                    {scanning && (
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h2 style={S.heading}>
                                        {scanPhase === 'matching' ? 'Matching Face…' :
                                            scanPhase === 'recording' ? 'Recording…' : 'Face Scanning'}
                                    </h2>
                                    {scanMessage && <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0' }}>{scanMessage}</p>}
                                </div>
                                <button style={S.btnCancel} onClick={handleCancelScan}>✕</button>
                            </div>

                            <FaceScanner
                                ref={scannerRef}
                                isActive={scanning}
                                onScanComplete={handleScanComplete}
                                onError={handleScanError}
                                onFaceDetected={() => { }}
                            />

                            {(scanPhase === 'matching' || scanPhase === 'recording') && (
                                <div style={S.progressBar}><div style={S.progressFill} /></div>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {!scanning && scanPhase === 'error' && (
                        <div style={S.center}>
                            <div style={{ ...S.resultCircle, borderColor: '#ff4466', background: 'rgba(255,68,102,0.1)', boxShadow: '0 0 24px rgba(255,68,102,0.2)' }}>
                                <span style={{ fontSize: '32px', color: '#ff4466' }}>✗</span>
                            </div>
                            <h2 style={{ ...S.heading, color: '#ff8099' }}>Scan Failed</h2>
                            <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center' as const, lineHeight: 1.6, maxWidth: '320px' }}>
                                {scanMessage}
                            </p>
                            <button style={S.btnPrimary} onClick={() => { setScanPhase('idle'); setScanMessage(''); }}>
                                ↺ &nbsp; Try Again
                            </button>
                        </div>
                    )}

                    {/* Success */}
                    {!scanning && scanPhase === 'done' && scanResult && (
                        <div style={S.center}>
                            <div style={S.resultCircle}>
                                <span style={{ fontSize: '32px', color: '#00ff88' }}>✓</span>
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: 700, color: '#f1f5f9' }}>
                                {scanResult.employee?.full_name || scanResult.employee?.name || 'Employee'}
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                                {scanResult.employee?.role || scanResult.employee?.department || ''}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const, justifyContent: 'center' as const }}>
                                <StatusChip status={scanResult.record?.status || 'present'} />
                                <span style={S.confidenceChip}>{scanResult.confidence}% match</span>
                            </div>
                            <div style={S.timeCard}>
                                {scanResult.action === 'check-out' ? (
                                    <><TimeRow label="Check In" value={fmt(scanResult.record?.clock_in)} />
                                        <TimeRow label="Check Out" value={fmt(scanResult.record?.clock_out)} accent /></>
                                ) : scanResult.action === 'already-done' ? (
                                    <><TimeRow label="Check In" value={fmt(scanResult.record?.clock_in)} />
                                        <TimeRow label="Check Out" value={fmt(scanResult.record?.clock_out)} />
                                        <p style={{ color: '#fbbf24', fontSize: '12px', textAlign: 'center' as const, margin: '8px 0 0' }}>
                                            Attendance already complete for today.
                                        </p></>
                                ) : (
                                    <TimeRow label="Check In" value={fmt(scanResult.record?.clock_in)} accent />
                                )}
                            </div>
                            <button
                                style={{ ...S.btnPrimary, background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}
                                onClick={() => { setScanPhase('idle'); setScanResult(null); }}
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Today's Attendance List ── */}
                <div style={S.summaryPanel}>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#cbd5e1', margin: '0 0 12px' }}>
                        Today's Attendance
                    </h2>
                    {loadingData ? (
                        <p style={{ color: '#64748b', fontSize: '13px' }}>Loading…</p>
                    ) : todaySummary.length === 0 ? (
                        <p style={{ color: '#64748b', fontSize: '13px' }}>No records yet today.</p>
                    ) : (
                        todaySummary.map((r, i) => <AttendanceRow key={r.employee_id || i} record={r} />)
                    )}
                </div>

            </div>

            <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes slide  { from{transform:translateX(-100%)} to{transform:translateX(300%)} }
        * { box-sizing: border-box; }
        button { cursor: pointer; }
      `}</style>
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 0%,#0a1628,#060b14 60%)', padding: '24px 16px 64px', fontFamily: '"DM Sans","Segoe UI",system-ui,sans-serif', color: '#e2e8f0' },
    container: { maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.4s ease' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' },
    logoArea: { display: 'flex', alignItems: 'center', gap: '12px' },
    logoIcon: { width: '40px', height: '40px', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#fff' },
    title: { fontSize: '20px', fontWeight: 700, margin: 0, color: '#f1f5f9' },
    dateText: { fontSize: '11px', color: '#64748b', margin: '2px 0 0' },
    clockBadge: { background: '#0d1424', border: '1px solid #1e293b', borderRadius: '8px', padding: '6px 12px', fontSize: '14px', fontWeight: 600, color: '#00c8ff', fontVariantNumeric: 'tabular-nums' },
    statsRow: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
    scanPanel: { background: '#0d1424', border: '1px solid #1e293b', borderRadius: '20px', overflow: 'hidden' },
    center: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', gap: '14px', animation: 'fadeIn 0.3s ease' },
    faceIcon: { width: '80px', height: '80px', background: 'rgba(0,200,255,0.06)', border: '1px solid rgba(0,200,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    heading: { fontSize: '20px', fontWeight: 700, color: '#f1f5f9', margin: 0, textAlign: 'center' },
    sub: { color: '#64748b', fontSize: '13px', textAlign: 'center', lineHeight: 1.6, maxWidth: '320px', margin: 0 },
    btnPrimary: { background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', border: 'none', borderRadius: '12px', padding: '13px 28px', color: '#fff', fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' },
    btnCancel: { background: 'transparent', border: '1px solid #334155', borderRadius: '8px', color: '#64748b', padding: '6px 10px', fontSize: '14px' },
    progressBar: { height: '3px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' },
    progressFill: { height: '100%', width: '40%', background: 'linear-gradient(90deg,transparent,#00c8ff,transparent)', animation: 'slide 1.2s ease-in-out infinite' },
    errorText: { color: '#ff8099', fontSize: '13px', margin: 0, textAlign: 'center' },
    resultCircle: { width: '72px', height: '72px', borderRadius: '50%', border: '2px solid #00ff88', background: 'rgba(0,255,136,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(0,255,136,0.2)' },
    confidenceChip: { background: 'rgba(0,200,255,0.1)', border: '1px solid rgba(0,200,255,0.25)', color: '#00c8ff', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600 },
    timeCard: { width: '100%', maxWidth: '260px', background: '#060b14', border: '1px solid #1e293b', borderRadius: '12px', padding: '12px 16px' },
    summaryPanel: { background: '#0d1424', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px' },
};