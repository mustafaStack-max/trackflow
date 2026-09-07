import { COLORS as C, FONT as F } from '@/Components/Dashboard/theme';
import { fmtMAD } from '@/Components/Dashboard/format';
import { EmptyState } from '@/Components/Dashboard/Panel';


function statusConfig(status) {
    const map = {
        high: {
            color: C.red,
            label: 'مرتفع',
            desc: 'مصاريفك مركزة جدًا — تنويعها سيقلل المخاطر المالية.',
        },
        medium: {
            color: C.amber,
            label: 'متوسط',
            desc: 'تركيز معتدل — راقب التصنيفات الأكبر بانتظام.',
        },
        healthy: {
            color: C.green,
            label: 'صحي',
            desc: 'توزيع متوازن للمصاريف عبر التصنيفات.',
        },
    };

    return map[status] || map.healthy;
}

export default function ConcentrationPanel({ data = null }) {
    if (!data || !data.top3 || data.top3.length === 0) {
        return <EmptyState>// لا توجد مصاريف لتحليل التركيز //</EmptyState>;
    }

    const { totalExpense, top3, top3Share, status, categoriesCount } = data;
    const cfg = statusConfig(status);
    const otherShare = Math.max(0, 100 - top3Share);

    return (
        <div className="flex flex-col gap-5">
        
            <div
                className="relative p-4 border overflow-hidden"
                style={{ borderColor: `${cfg.color}55`, background: `${cfg.color}08` }}
            >
                <div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }}
                />

                <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                        <div className={`${F.mono} text-[0.58rem] tracking-[2px] mb-1`} style={{ color: C.t4 }}>
                            STATUS · FOCUS LEVEL
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`${F.ar} text-[1rem] font-bold`} style={{ color: cfg.color }}>
                                تركيز {cfg.label}
                            </span>
                            <span
                                className={`${F.mono} text-[0.95rem] font-bold px-2 py-0.5 border rounded`}
                                style={{ borderColor: `${cfg.color}55`, color: cfg.color, background: `${cfg.color}15` }}
                            >
                                <span dir="ltr">{top3Share.toFixed(1)}%</span>
                            </span>
                        </div>
                    </div>

                    <div className={`${F.mono} text-[0.6rem] text-left shrink-0`} style={{ color: C.t3 }}>
                        <div>{categoriesCount} تصنيف</div>
                        <div>{fmtMAD(totalExpense)} MAD</div>
                    </div>
                </div>

            
                <div className="h-3 rounded-full overflow-hidden flex" style={{ background: `${C.t4}20` }}>
                    {top3.map((cat) => (
                        <div
                            key={cat.id || cat.name}
                            title={`${cat.name}: ${cat.pct.toFixed(1)}%`}
                            className="h-full transition-all duration-500"
                            style={{ width: `${cat.pct}%`, background: cat.color_hex }}
                        />
                    ))}
                    {otherShare > 0 && (
                        <div
                            className="h-full"
                            title={`التصنيفات الأخرى: ${otherShare.toFixed(1)}%`}
                            style={{ width: `${otherShare}%`, background: `${C.t4}35` }}
                        />
                    )}
                </div>

                <div className={`${F.ar} text-[0.72rem] mt-3 leading-relaxed`} style={{ color: C.t2 }}>
                    {cfg.desc}
                </div>
            </div>

        
            <div className="flex flex-col gap-2.5">
                <div className={`${F.mono} text-[0.6rem] tracking-[2px]`} style={{ color: C.t4 }}>
                    TOP 3 EXPENSE CATEGORIES
                </div>

                {top3.map((cat, idx) => (
                    <div
                        key={cat.id || cat.name}
                        className="relative flex items-center gap-3 p-3 border transition-colors"
                        style={{ borderColor: C.b, background: C.card }}
                    >
                 
                        <div
                            className={`${F.mono} text-[1.4rem] font-bold shrink-0 w-7 text-center`}
                            style={{ color: idx === 0 ? C.gold : C.t4 }}
                        >
                            {String(idx + 1).padStart(2, '0')}
                        </div>

                 
                        <div
                            className="w-1 h-10 rounded-full shrink-0"
                            style={{ background: cat.color_hex }}
                        />

             
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2 mb-1">
                                <span className={`${F.ar} text-[0.88rem] font-bold truncate`} style={{ color: C.t1 }}>
                                    {cat.name}
                                </span>
                                <span className={`${F.mono} text-[0.95rem] font-bold shrink-0`} style={{ color: C.t1 }}>
                                    {fmtMAD(cat.total)}
                                    <span className={`${F.mono} text-[0.55rem] ms-1`} style={{ color: C.t4 }}>MAD</span>
                                </span>
                            </div>

                        
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${cat.color_hex}14` }}>
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${cat.pct}%`,
                                        background: `linear-gradient(90deg, ${cat.color_hex}, ${cat.color_hex}bb)`,
                                    }}
                                />
                            </div>

                       
                            <div className={`${F.mono} text-[0.58rem] mt-1 flex items-center gap-3`} style={{ color: C.t3 }}>
                                <span><span dir="ltr">{cat.pct.toFixed(1)}%</span> من الإجمالي</span>
                                <span>·</span>
                                <span>{cat.count} عملية</span>
                            </div>
                        </div>
                    </div>
                ))}

              
                {otherShare > 0 && (
                    <div
                        className="flex items-center gap-3 p-3 border opacity-60"
                        style={{ borderColor: C.b, background: C.card2 }}
                    >
                        <div className={`${F.mono} text-[1.4rem] font-bold shrink-0 w-7 text-center`} style={{ color: C.t4 }}>
                            …
                        </div>
                        <div className="w-1 h-10 rounded-full shrink-0" style={{ background: `${C.t4}40` }} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2">
                                <span className={`${F.ar} text-[0.8rem] font-semibold truncate`} style={{ color: C.t3 }}>
                                    التصنيفات الأخرى ({categoriesCount - top3.length})
                                </span>
                                <span className={`${F.mono} text-[0.85rem] font-bold`} style={{ color: C.t3 }}>
                                    <span dir="ltr">{otherShare.toFixed(1)}%</span>
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}