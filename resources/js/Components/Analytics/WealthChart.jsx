import { useId, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { COLORS as C, FONT as F } from '@/Components/Dashboard/theme';
import { fmtMAD, fmtAxis } from '@/Components/Dashboard/format';
import { EmptyState } from '@/Components/Dashboard/Panel';

function WealthTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;

    const d = payload[0]?.payload;
    if (!d) return null;

    const changeColor = (d.change ?? 0) >= 0 ? C.green : C.red;

    return (
        <div className="border p-3 text-[0.72rem] shadow-[0_8px_30px_rgba(0,0,0,0.6)]" style={{ background: C.card, borderColor: C.bHot }}>
            <div className={`${F.mono} mb-2 font-bold tracking-[1px]`} style={{ color: C.t1 }}>{d.label}</div>

            <div className="flex items-center justify-between gap-6 mb-1">
                <span style={{ color: C.t2 }}>إجمالي الثروة</span>
                <span className={`${F.mono} font-bold`} style={{ color: C.gold }}>{fmtMAD(d.balance)} MAD</span>
            </div>

            {d.change !== null && (
                <div className="flex items-center justify-between gap-6">
                    <span style={{ color: C.t2 }}>التغير</span>
                    <span className={`${F.mono} font-bold`} style={{ color: changeColor }}>
                        {d.change >= 0 ? '+' : ''}{fmtMAD(d.change)} MAD
                    </span>
                </div>
            )}
        </div>
    );
}

export default function WealthChart({ data = null }) {
    const gid = useId().replace(/[^a-zA-Z0-9]/g, '');

    const stats = useMemo(() => {
        if (!data?.points?.length) return null;

        const withChange = data.points.filter((p) => p.change !== null);
        const best = withChange.length ? withChange.reduce((m, p) => (p.change > m.change ? p : m)) : null;
        const worst = withChange.length ? withChange.reduce((m, p) => (p.change < m.change ? p : m)) : null;

        return { best, worst };
    }, [data]);

    if (!data || !data.points || data.points.length === 0) {
        return <EmptyState>// لا توجد حسابات لعرض تطور الثروة //</EmptyState>;
    }

    const minBalance = Math.min(...data.points.map((p) => p.balance), 0);
    const growth = data.growth;

    return (
        <div className="flex flex-col gap-5">
        
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="border p-2.5" style={{ borderColor: `${C.gold}44`, background: `${C.gold}08` }}>
                    <div className={`${F.mono} text-[0.55rem] tracking-[1px] mb-1`} style={{ color: C.t4 }}>الثروة الحالية</div>
                    <div className={`${F.mono} text-[0.95rem] font-bold`} style={{ color: C.gold }}>
                        {fmtMAD(data.current)} <span className="text-[0.55rem]">MAD</span>
                    </div>
                </div>

                <div className="border p-2.5" style={{ borderColor: C.b, background: C.card2 }}>
                    <div className={`${F.mono} text-[0.55rem] tracking-[1px] mb-1`} style={{ color: C.t4 }}>النمو في الفترة</div>
                    <div className={`${F.mono} text-[0.95rem] font-bold`} style={{ color: (growth?.abs ?? 0) >= 0 ? C.green : C.red }}>
                        {(growth?.abs ?? 0) >= 0 ? '+' : ''}{fmtMAD(growth?.abs ?? 0)}
                        {growth?.pct !== null && growth?.pct !== undefined && (
                            <span className="text-[0.6rem] ms-1">({growth.pct}%)</span>
                        )}
                    </div>
                </div>

                <div className="border p-2.5" style={{ borderColor: C.b, background: C.card2 }}>
                    <div className={`${F.mono} text-[0.55rem] tracking-[1px] mb-1`} style={{ color: C.t4 }}>أفضل شهر</div>
                    <div className={`${F.mono} text-[0.85rem] font-bold truncate`} style={{ color: C.green }}>
                        {stats?.best ? `${fmtMAD(stats.best.change)}+` : '—'}
                    </div>
                    {stats?.best && (
                        <div className={`${F.ar} text-[0.6rem] mt-0.5 truncate`} style={{ color: C.t4 }}>{stats.best.label}</div>
                    )}
                </div>

                <div className="border p-2.5" style={{ borderColor: C.b, background: C.card2 }}>
                    <div className={`${F.mono} text-[0.55rem] tracking-[1px] mb-1`} style={{ color: C.t4 }}>أضعف شهر</div>
                    <div className={`${F.mono} text-[0.85rem] font-bold truncate`} style={{ color: C.red }}>
                        {stats?.worst ? `${fmtMAD(stats.worst.change)}-` : '—'}
                    </div>
                    {stats?.worst && (
                        <div className={`${F.ar} text-[0.6rem] mt-0.5 truncate`} style={{ color: C.t4 }}>{stats.worst.label}</div>
                    )}
                </div>
            </div>

        
            <div className="w-full" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.points} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`gWealth${gid}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={C.gold} stopOpacity={0.25} />
                                <stop offset="100%" stopColor={C.gold} stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid stroke={C.greenTrace} strokeDasharray="3 3" vertical={false} />

                        <XAxis
                            dataKey="label"
                            tick={{ fill: C.t4, fontFamily: 'Share Tech Mono', fontSize: 10 }}
                            axisLine={{ stroke: C.b }}
                            tickLine={false}
                        />

                        <YAxis
                            tick={{ fill: C.t4, fontFamily: 'Share Tech Mono', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={fmtAxis}
                            width={45}
                            domain={[minBalance < 0 ? 'auto' : 0, 'auto']}
                        />

                        <Tooltip content={<WealthTooltip />} cursor={{ stroke: C.greenDim, strokeDasharray: '3 3' }} />

                        {minBalance < 0 && (
                            <ReferenceLine y={0} stroke={C.t4} strokeDasharray="2 2" strokeWidth={1} />
                        )}

                        <Area
                            type="monotone"
                            dataKey="balance"
                            stroke={C.gold}
                            strokeWidth={2.5}
                            fill={`url(#gWealth${gid})`}
                            dot={{ r: 3, fill: C.gold, stroke: C.card, strokeWidth: 2 }}
                            activeDot={{ r: 6, stroke: C.gold, strokeWidth: 2, fill: C.card }}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className={`${F.mono} text-[0.58rem] tracking-[1px] pt-2 border-t text-center`} style={{ borderColor: C.b, color: C.t4 }}>
                // الثروة محسوبة من الأرصدة الحالية + سجل العمليات عند نهاية كل شهر //
            </div>
        </div>
    );
}