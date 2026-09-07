import { useId, useMemo, useState } from 'react';
import {
    ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts';
import { COLORS as C, FONT as F } from '@/Components/Dashboard/theme';
import { fmtMAD, fmtAxis } from '@/Components/Dashboard/format';
import { bucketStocks } from '@/Components/Dashboard/aggregate';
import { EmptyState } from '@/Components/Dashboard/Panel';


function WealthTooltip({ active, payload, label, lines, hidden, changes }) {
    if (!active || !payload?.length) return null;

    const d = payload[0]?.payload;
    if (!d) return null;

    const visible = lines.filter((l) => !hidden.has(l.key));
    const change = changes.get(d.date);
    const changeColor = (change ?? 0) >= 0 ? C.green : C.red;

    return (
        <div className="border p-3 text-[0.72rem] shadow-[0_8px_30px_rgba(0,0,0,0.6)]" style={{ background: C.card, borderColor: C.bHot }}>
            <div className={`${F.mono} mb-2 font-bold tracking-[1px]`} style={{ color: C.t1 }}>{label}</div>

            {visible.map((l) => (
                <div key={l.key} className="flex items-center justify-between gap-6 mb-1 last:mb-0">
                    <span className="flex items-center gap-1.5" style={{ color: C.t2 }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: l.key === 'total' ? C.gold : l.color }} />
                        {l.name}
                    </span>
                    <span className={`${F.mono} font-bold`} style={{ color: l.key === 'total' ? C.gold : C.t1 }}>
                        {fmtMAD(d[l.key] ?? 0)} MAD
                    </span>
                </div>
            ))}

            {change !== undefined && (
                <div className="border-t mt-1.5 pt-1.5 flex items-center justify-between gap-6" style={{ borderColor: C.b }}>
                    <span style={{ color: C.t3 }}>تغير الفترة</span>
                    <span className={`${F.mono} font-bold`} style={{ color: changeColor }}>
                        {change >= 0 ? '+' : '-'}{fmtMAD(Math.abs(change))} MAD
                    </span>
                </div>
            )}
        </div>
    );
}

export default function WealthChart({ data = null, granularity = 'day' }) {
    const gid = useId().replace(/[^a-zA-Z0-9]/g, '');
    const [hidden, setHidden] = useState(() => new Set());

    const lines = useMemo(() => data?.lines ?? [], [data]);
    const keys = useMemo(() => lines.map((l) => l.key), [lines]);

    const points = useMemo(
        () => bucketStocks(data?.points ?? [], granularity, keys),
        [data, granularity, keys]
    );

  
    const changes = useMemo(() => {
        const map = new Map();
        points.forEach((p, i) => {
            if (i > 0) map.set(p.date, Math.round((p.total - points[i - 1].total) * 100) / 100);
        });
        return map;
    }, [points]);


    const stats = useMemo(() => {
        if (points.length < 2) return null;
        const first = points[0];
        const last = points[points.length - 1];
        const abs = Math.round((last.total - first.total) * 100) / 100;
        const pct = first.total > 0 ? Math.round((abs / first.total) * 1000) / 10 : null;

        let best = null;
        let worst = null;
        points.forEach((p, i) => {
            if (i === 0) return;
            const ch = p.total - points[i - 1].total;
            if (!best || ch > best.ch) best = { ch, label: p.label };
            if (!worst || ch < worst.ch) worst = { ch, label: p.label };
        });

        return { first, last, abs, pct, best, worst };
    }, [points]);

    
    const domain = useMemo(() => {
        if (!points.length) return [0, 'auto'];
        const vals = [];
        points.forEach((p) => lines.forEach((l) => {
            if (!hidden.has(l.key) && typeof p[l.key] === 'number') vals.push(p[l.key]);
        }));
        if (!vals.length) return [0, 'auto'];
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const pad = Math.max(100, (max - min) * 0.18);
        return [
            Math.floor((min - pad) / 100) * 100,
            Math.ceil((max + pad) / 100) * 100,
        ];
    }, [points, lines, hidden]);

    if (!data || !lines.length || !points.length) {
        return <EmptyState>// لا توجد حسابات لعرض تطور الثروة //</EmptyState>;
    }

    const toggle = (key) => setHidden((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
    });

    const accountLines = lines.filter((l) => l.key !== 'total');

    const curveType = granularity === 'day' ? 'stepAfter' : 'monotone';
    const single = points.length === 1;

    return (
        <div className="flex flex-col gap-5">
       
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="border p-2.5" style={{ borderColor: `${C.gold}44`, background: `${C.gold}08` }}>
                    <div className={`${F.mono} text-[0.55rem] tracking-[1px] mb-1`} style={{ color: C.t4 }}>الثروة الحالية</div>
                    <div className={`${F.mono} text-[0.95rem] font-bold`} style={{ color: C.gold }}>
                        {fmtMAD(data.current)} <span className="text-[0.55rem]">MAD</span>
                    </div>
                    <div className={`${F.mono} text-[0.55rem] mt-0.5`} style={{ color: C.t4 }}>
                        بداية العرض: {fmtMAD(points[0]?.total ?? 0)} MAD
                    </div>
                </div>

                <div className="border p-2.5" style={{ borderColor: C.b, background: C.card2 }}>
                    <div className={`${F.mono} text-[0.55rem] tracking-[1px] mb-1`} style={{ color: C.t4 }}>النمو في العرض</div>
                    <div className={`${F.mono} text-[0.95rem] font-bold`} style={{ color: (stats?.abs ?? 0) >= 0 ? C.green : C.red }}>
                        {(stats?.abs ?? 0) >= 0 ? '+' : '-'}{fmtMAD(Math.abs(stats?.abs ?? 0))}
                        {stats?.pct !== null && stats?.pct !== undefined && (
                            <span className="text-[0.6rem] ms-1">({stats.pct}%)</span>
                        )}
                    </div>
                </div>

                <div className="border p-2.5" style={{ borderColor: C.b, background: C.card2 }}>
                    <div className={`${F.mono} text-[0.55rem] tracking-[1px] mb-1`} style={{ color: C.t4 }}>أفضل فترة</div>
                    <div className={`${F.mono} text-[0.85rem] font-bold truncate`} style={{ color: C.green }}>
                        {stats?.best ? `+${fmtMAD(stats.best.ch)}` : '—'}
                    </div>
                    {stats?.best && (
                        <div className={`${F.ar} text-[0.6rem] mt-0.5 truncate`} style={{ color: C.t4 }}>{stats.best.label}</div>
                    )}
                </div>

                <div className="border p-2.5" style={{ borderColor: C.b, background: C.card2 }}>
                    <div className={`${F.mono} text-[0.55rem] tracking-[1px] mb-1`} style={{ color: C.t4 }}>أضعف فترة</div>
                    <div className={`${F.mono} text-[0.85rem] font-bold truncate`} style={{ color: C.red }}>
                        {stats?.worst ? `-${fmtMAD(Math.abs(stats.worst.ch))}` : '—'}
                    </div>
                    {stats?.worst && (
                        <div className={`${F.ar} text-[0.6rem] mt-0.5 truncate`} style={{ color: C.t4 }}>{stats.worst.label}</div>
                    )}
                </div>
            </div>

         
            <div className="flex flex-wrap items-center justify-center gap-2">
                {lines.map((l) => {
                    const color = l.key === 'total' ? C.gold : l.color;
                    const off = hidden.has(l.key);
                    return (
                        <button
                            key={l.key}
                            type="button"
                            onClick={() => toggle(l.key)}
                            className={`${F.head} flex items-center gap-1.5 text-[0.72rem] font-semibold px-2.5 py-1 border transition-colors`}
                            style={off
                                ? { borderColor: C.b, color: C.t4 }
                                : { borderColor: color, color, background: `${color}11` }}
                        >
                            <span className="w-2 h-2 rounded-full" style={{ background: off ? C.t4 : color }} />
                            {l.name}
                        </button>
                    );
                })}
            </div>

            
            <div className="w-full" style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={points} margin={{ top: 10, right: 12, left: -6, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`gTotal${gid}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={C.gold} stopOpacity={0.22} />
                                <stop offset="100%" stopColor={C.gold} stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid stroke={C.greenTrace} strokeDasharray="3 3" vertical={false} />

                        <XAxis
                            dataKey="label"
                            tick={{ fill: C.t4, fontFamily: 'Share Tech Mono', fontSize: 10 }}
                            axisLine={{ stroke: C.b }}
                            tickLine={false}
                            minTickGap={18}
                            interval={points.length > 15 ? Math.ceil(points.length / 8) - 1 : 0}
                        />

                        <YAxis
                            tick={{ fill: C.t4, fontFamily: 'Share Tech Mono', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={fmtAxis}
                            width={48}
                            domain={domain}
                        />

                        <Tooltip
                            content={<WealthTooltip lines={lines} hidden={hidden} changes={changes} />}
                            cursor={{ stroke: C.greenDim, strokeDasharray: '3 3' }}
                        />

                      
                        {!hidden.has('total') && (
                            <Area
                                type={curveType}
                                dataKey="total"
                                stroke={C.gold}
                                strokeWidth={2.6}
                                fill={`url(#gTotal${gid})`}
                                dot={single ? { r: 4, fill: C.gold, stroke: C.card, strokeWidth: 2 } : false}
                                activeDot={{ r: 6, stroke: C.gold, strokeWidth: 2, fill: C.card }}
                                isAnimationActive={false}
                            />
                        )}

                       
                        {accountLines.map((l) => !hidden.has(l.key) && (
                            <Line
                                key={l.key}
                                type={curveType}
                                dataKey={l.key}
                                stroke={l.color}
                                strokeWidth={1.6}
                                strokeOpacity={0.9}
                                dot={single ? { r: 3, fill: l.color, stroke: C.card, strokeWidth: 1.5 } : false}
                                activeDot={{ r: 4, stroke: l.color, strokeWidth: 1.5, fill: C.card }}
                                isAnimationActive={false}
                            />
                        ))}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

          
            <div className={`${F.mono} text-[0.58rem] tracking-[1px] pt-2 border-t text-center`} style={{ borderColor: C.b, color: C.t4 }}>
                // الثروة = الرصيد الابتدائي لكل حساب + سجل العمليات (transaction_date) · تُعرض بدقة {granularity} //
            </div>
        </div>
    );
}