import { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { COLORS as C, FONT as F } from '@/Components/Dashboard/theme';
import { fmtMAD, fmtAxis } from '@/Components/Dashboard/format';
import { EmptyState } from '@/Components/Dashboard/Panel';


function TrendTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0]?.payload;
    if (!data) return null;

    const netColor = data.net >= 0 ? C.green : C.red;
    const savingsColor = data.savingsRate >= 0 ? C.green : C.red;

    return (
        <div className="border p-3 text-[0.72rem] shadow-[0_8px_30px_rgba(0,0,0,0.6)]" style={{ background: C.card, borderColor: C.bHot }}>
            <div className={`${F.mono} mb-2 font-bold tracking-[1px]`} style={{ color: C.t1 }}>{label}</div>
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-6">
                    <span className="flex items-center gap-1.5" style={{ color: C.t2 }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: C.green }} />
                        الدخل
                    </span>
                    <span className={F.mono} style={{ color: C.green }}>{fmtMAD(data.income)} MAD</span>
                </div>
                <div className="flex items-center justify-between gap-6">
                    <span className="flex items-center gap-1.5" style={{ color: C.t2 }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: C.red }} />
                        المصاريف
                    </span>
                    <span className={F.mono} style={{ color: C.red }}>{fmtMAD(data.expense)} MAD</span>
                </div>
                <div className="border-t my-1 pt-1" style={{ borderColor: C.b }}>
                    <div className="flex items-center justify-between gap-6">
                        <span className="flex items-center gap-1.5" style={{ color: C.t2 }}>
                            <span className="w-2 h-2 rounded-full" style={{ background: C.cyan }} />
                            الصافي
                        </span>
                        <span className={`${F.mono} font-bold`} style={{ color: netColor }}>
                            {data.net >= 0 ? '+' : ''}{fmtMAD(data.net)} MAD
                        </span>
                    </div>
                </div>
                <div className="flex items-center justify-between gap-6">
                    <span className={`${F.ar} text-[0.65rem]`} style={{ color: C.t3 }}>معدل الادخار</span>
                    <span className={`${F.mono} text-[0.7rem] font-bold`} style={{ color: data.savingsRate !== null ? savingsColor : C.t4 }}>
                        {data.savingsRate !== null ? `${data.savingsRate}%` : '—'}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function TrendChart({ data = [] }) {
    const totals = useMemo(() => {
        if (!data.length) return null;
        
        const totalIncome = data.reduce((s, d) => s + (d.income || 0), 0);
        const totalExpense = data.reduce((s, d) => s + (d.expense || 0), 0);
        const totalNet = totalIncome - totalExpense;
        
        const validSavingsRates = data.filter(d => d.savingsRate !== null && d.income > 0);
        const avgSavingsRate = validSavingsRates.length > 0 
            ? validSavingsRates.reduce((s, d) => s + d.savingsRate, 0) / validSavingsRates.length 
            : null;
        
        return { totalIncome, totalExpense, totalNet, avgSavingsRate };
    }, [data]);

    if (!data || data.length === 0 || !totals) {
        return <EmptyState>// لا توجد بيانات اتجاهات شهرية //</EmptyState>;
    }


    const minNet = Math.min(...data.map(d => d.net), 0);

    return (
        <div className="flex flex-col gap-5">
         
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="border p-2.5" style={{ borderColor: C.b, background: C.card2 }}>
                    <div className={`${F.mono} text-[0.55rem] tracking-[1px] mb-1`} style={{ color: C.t4 }}>إجمالي الدخل</div>
                    <div className={`${F.mono} text-[0.9rem] font-bold`} style={{ color: C.green }}>
                        {fmtMAD(totals.totalIncome)} <span className="text-[0.55rem]">MAD</span>
                    </div>
                </div>
                <div className="border p-2.5" style={{ borderColor: C.b, background: C.card2 }}>
                    <div className={`${F.mono} text-[0.55rem] tracking-[1px] mb-1`} style={{ color: C.t4 }}>إجمالي المصاريف</div>
                    <div className={`${F.mono} text-[0.9rem] font-bold`} style={{ color: C.red }}>
                        {fmtMAD(totals.totalExpense)} <span className="text-[0.55rem]">MAD</span>
                    </div>
                </div>
                <div className="border p-2.5" style={{ borderColor: C.b, background: C.card2 }}>
                    <div className={`${F.mono} text-[0.55rem] tracking-[1px] mb-1`} style={{ color: C.t4 }}>صافي الفترة</div>
                    <div className={`${F.mono} text-[0.9rem] font-bold`} style={{ color: totals.totalNet >= 0 ? C.green : C.red }}>
                        {totals.totalNet >= 0 ? '+' : ''}{fmtMAD(totals.totalNet)} <span className="text-[0.55rem]">MAD</span>
                    </div>
                </div>
                <div className="border p-2.5" style={{ borderColor: C.b, background: C.card2 }}>
                    <div className={`${F.mono} text-[0.55rem] tracking-[1px] mb-1`} style={{ color: C.t4 }}>متوسط الادخار</div>
                    <div className={`${F.mono} text-[0.9rem] font-bold`} style={{ 
                        color: totals.avgSavingsRate !== null 
                            ? (totals.avgSavingsRate >= 20 ? C.green : totals.avgSavingsRate >= 0 ? C.amber : C.red) 
                            : C.t4 
                    }}>
                        {totals.avgSavingsRate !== null ? `${totals.avgSavingsRate.toFixed(1)}%` : '—'}
                    </div>
                </div>
            </div>

        
            <div className="w-full" style={{ height: 340 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                            domain={[minNet < 0 ? 'auto' : 0, 'auto']}
                        />
                        
                        <Tooltip content={<TrendTooltip />} cursor={{ fill: C.greenTrace }} />
                        
                      
                        <ReferenceLine y={0} stroke={C.t4} strokeDasharray="2 2" strokeWidth={1} />

                        <Bar 
                            dataKey="income" 
                            name="الدخل" 
                            fill={C.green} 
                            radius={[4, 4, 0, 0]} 
                            maxBarSize={32} 
                            opacity={0.85} 
                        />
                        <Bar 
                            dataKey="expense" 
                            name="المصاريف" 
                            fill={C.red} 
                            radius={[4, 4, 0, 0]} 
                            maxBarSize={32} 
                            opacity={0.85} 
                        />
                        
                        <Line 
                            type="monotone" 
                            dataKey="net" 
                            name="الصافي" 
                            stroke={C.cyan} 
                            strokeWidth={2.5} 
                            dot={{ r: 4, fill: C.cyan, stroke: C.card, strokeWidth: 2 }} 
                            activeDot={{ r: 6, stroke: C.cyan, strokeWidth: 2, fill: C.card }} 
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            
       
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 border-t" style={{ borderColor: C.b }}>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm" style={{ background: C.green, opacity: 0.85 }} />
                    <span className={`${F.ar} text-[0.7rem]`} style={{ color: C.t3 }}>الدخل</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm" style={{ background: C.red, opacity: 0.85 }} />
                    <span className={`${F.ar} text-[0.7rem]`} style={{ color: C.t3 }}>المصاريف</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5" style={{ background: C.cyan }} />
                    <span className="w-2 h-2 rounded-full border-2" style={{ borderColor: C.cyan, background: C.card }} />
                    <span className={`${F.ar} text-[0.7rem]`} style={{ color: C.t3 }}>الصافي</span>
                </span>
            </div>
        </div>
    );
}