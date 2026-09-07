import { COLORS as C, FONT as F } from '@/Components/Dashboard/theme';
import { fmtMAD } from '@/Components/Dashboard/format';
import { EmptyState } from '@/Components/Dashboard/Panel';

export default function ChangeAnalysisTable({ data = null }) {
    if (!data || !data.categories || data.categories.length === 0) {
        return (
            <EmptyState>
                // لا توجد مصاريف لمقارنتها في هاتين الفترتين //
            </EmptyState>
        );
    }

    const {
        currentTotal,
        previousTotal,
        totalChange,
        totalChangePct,
        direction,
        categories,
    } = data;

    const totalChangeColor = direction === 'up' ? C.red : (direction === 'down' ? C.green : C.t3);
    const totalChangeIcon = direction === 'up' ? '▲' : (direction === 'down' ? '▼' : '—');
    const maxAbsDiff = Math.max(...categories.map(c => Math.abs(c.diff)), 1);


    const showTotalPct = Math.abs(previousTotal) >= 100 && totalChangePct !== null;
    const showContribution = Math.abs(totalChange) >= 100;

    return (
        <div className="flex flex-col gap-5">
            {/* 1) بطاقات الملخص */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="border p-3" style={{ borderColor: C.b, background: C.card2 }}>
                    <div className={`${F.mono} text-[0.55rem] tracking-[2px] mb-1`} style={{ color: C.t4 }}>الفترة الحالية</div>
                    <div className={`${F.mono} text-[1.1rem] font-bold`} style={{ color: C.t1 }}>
                        {fmtMAD(currentTotal)} <span className="text-[0.6rem]" style={{ color: C.t4 }}>MAD</span>
                    </div>
                </div>
                <div className="border p-3" style={{ borderColor: C.b, background: C.card2 }}>
                    <div className={`${F.mono} text-[0.55rem] tracking-[2px] mb-1`} style={{ color: C.t4 }}>الفترة السابقة</div>
                    <div className={`${F.mono} text-[1.1rem] font-bold`} style={{ color: C.t1 }}>
                        {fmtMAD(previousTotal)} <span className="text-[0.6rem]" style={{ color: C.t4 }}>MAD</span>
                    </div>
                </div>
                <div
                    className="border p-3 col-span-2 flex flex-col justify-center"
                    style={{ borderColor: `${totalChangeColor}44`, background: `${totalChangeColor}08` }}
                >
                    <div className={`${F.mono} text-[0.55rem] tracking-[2px] mb-1`} style={{ color: C.t4 }}>إجمالي التغيير</div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <span className={`${F.mono} text-[1.3rem] font-bold`} style={{ color: totalChangeColor }}>
                            {totalChangeIcon} {fmtMAD(Math.abs(totalChange))}
                        </span>
                        <span className={`${F.mono} text-[0.6rem]`} style={{ color: C.t4 }}>MAD</span>

                        <span
                            className={`${F.mono} text-[0.85rem] font-bold px-1.5 py-0.5 border rounded`}
                            style={{ borderColor: `${totalChangeColor}44`, color: totalChangeColor, background: `${totalChangeColor}15` }}
                        >
                            {showTotalPct ? (
                                <span dir="ltr">{`${totalChange > 0 ? '+' : ''}${totalChangePct}%`}</span>
                            ) : (
                                <span dir="ltr">{`${totalChange > 0 ? '+' : '-'}${fmtMAD(Math.abs(totalChange))} MAD`}</span>
                            )}
                        </span>
                    </div>
                </div>
            </div>

            <div className="hidden md:grid grid-cols-12 gap-2 px-3 pb-2 border-b" style={{ borderColor: C.b }}>
                <div className={`${F.mono} text-[0.6rem] tracking-[1px] col-span-4`} style={{ color: C.t4 }}>التصنيف</div>
                <div className={`${F.mono} text-[0.6rem] tracking-[1px] col-span-2 text-left`} style={{ color: C.t4 }}>الحالية</div>
                <div className={`${F.mono} text-[0.6rem] tracking-[1px] col-span-2 text-left`} style={{ color: C.t4 }}>السابقة</div>
                <div className={`${F.mono} text-[0.6rem] tracking-[1px] col-span-2 text-left`} style={{ color: C.t4 }}>الفرق</div>
                <div className={`${F.mono} text-[0.6rem] tracking-[1px] col-span-2 text-left`} style={{ color: C.t4 }}>المساهمة</div>
            </div>

    
            <div className="flex flex-col gap-2">
                {categories.map((cat) => {
                    const isUp = cat.direction === 'up';
                    const isDown = cat.direction === 'down';
                    const isNew = cat.direction === 'new';
                    const isGone = cat.direction === 'gone';

                    const diffColor = (isUp || isNew) ? C.red : (isDown || isGone) ? C.green : C.t3;
                    const diffIcon = (isUp || isNew) ? '▲' : (isDown || isGone) ? '▼' : '—';

                    const absDiff = Math.abs(cat.diff);
                    const barWidth = (absDiff / maxAbsDiff) * 100;
                    const contribWidth = Math.min(Math.abs(cat.contribution || 0), 100);

                    return (
                        <div
                            key={cat.id || cat.name}
                            className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border rounded transition-colors hover:bg-[rgba(0,230,118,0.03)]"
                            style={{ borderColor: C.b, background: C.card }}
                        >
                           
                            <div className="md:col-span-4 flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color_hex }} />
                                    <span className={`${F.ar} text-[0.85rem] font-bold truncate`} style={{ color: C.t1 }}>
                                        {cat.name}
                                    </span>
                                    {isNew && (
                                        <span className={`${F.mono} text-[0.5rem] tracking-[1px] px-1.5 py-0.5 border rounded`} style={{ borderColor: C.amber, color: C.amber, background: `${C.amber}15` }}>
                                            جديد
                                        </span>
                                    )}
                                    {isGone && (
                                        <span className={`${F.mono} text-[0.5rem] tracking-[1px] px-1.5 py-0.5 border rounded`} style={{ borderColor: C.t4, color: C.t4 }}>
                                            اختفى
                                        </span>
                                    )}
                                </div>
                                <div className="md:hidden h-1.5 rounded-full overflow-hidden" style={{ background: `${diffColor}14` }}>
                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, background: diffColor }} />
                                </div>
                            </div>

                       
                            <div className="md:col-span-2 flex items-center justify-between md:justify-end">
                                <span className={`${F.ar} text-[0.7rem] md:hidden`} style={{ color: C.t4 }}>الحالية:</span>
                                <span className={`${F.mono} text-[0.85rem] font-bold`} style={{ color: C.t2 }}>
                                    {fmtMAD(cat.current)}
                                </span>
                            </div>

                           
                            <div className="md:col-span-2 flex items-center justify-between md:justify-end">
                                <span className={`${F.ar} text-[0.7rem] md:hidden`} style={{ color: C.t4 }}>السابقة:</span>
                                <span className={`${F.mono} text-[0.85rem]`} style={{ color: C.t3 }}>
                                    {fmtMAD(cat.previous)}
                                </span>
                            </div>

                            <div className="md:col-span-2 flex items-center justify-between md:justify-end">
                                <span className={`${F.ar} text-[0.7rem] md:hidden`} style={{ color: C.t4 }}>الفرق:</span>
                                <div className="flex items-baseline gap-1">
                                    <span className={`${F.mono} text-[0.85rem] font-bold`} style={{ color: diffColor }}>
                                        {diffIcon} {fmtMAD(absDiff)}
                                    </span>
            
                                    {cat.pct !== null && Math.abs(cat.previous) >= 100 && (
                                        <span className={`${F.mono} text-[0.65rem]`} style={{ color: diffColor }}>
                                            <span dir="ltr">({cat.pct > 0 ? '+' : ''}{cat.pct}%)</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                    
                            <div className="md:col-span-2 flex items-center justify-between md:justify-end">
                                <span className={`${F.ar} text-[0.7rem] md:hidden`} style={{ color: C.t4 }}>المساهمة:</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-12 h-1.5 rounded-full overflow-hidden hidden md:block" style={{ background: `${diffColor}14` }}>
                                        <div className="h-full rounded-full" style={{ width: `${contribWidth}%`, background: diffColor }} />
                                    </div>
                              
                                    <span className={`${F.mono} text-[0.75rem] font-bold w-12 text-left`} style={{ color: diffColor }}>
                                        {showContribution && cat.contribution !== null ? (
                                            <span dir="ltr">{`${cat.contribution > 0 ? '+' : ''}${cat.contribution}%`}</span>
                                        ) : '—'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

         
            {showContribution && (
                <div className={`${F.ar} text-[0.62rem]`} style={{ color: C.t3 }}>
                    المساهمة = فرق التصنيف ÷ إجمالي التغيير بين الفترتين (قد تتجاوز 100% عندما تعوّض التصنيفات بعضها).
                </div>
            )}
        </div>
    );
}