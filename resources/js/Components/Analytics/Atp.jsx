import { useMemo, useState } from 'react';
import Panel from '@/Components/Dashboard/Panel';
import { COLORS as C, FONT as F } from '@/Components/Dashboard/theme';
import { GRANULARITY_DEFS, autoGranularity } from '@/Components/Dashboard/aggregate';
import TrendChart from './TrendChart';
import WealthChart from './WealthChart';

export default function AnalyticsTrendsPanel({ flow = [], wealth = null, periodLabel }) {
    const [view, setView] = useState('trends');
    const [granularity, setGranularity] = useState('auto');


    const effGranularity = useMemo(() => {
        if (granularity !== 'auto') return granularity;
        const count = view === 'trends'
            ? flow.length
            : (wealth?.points?.length ?? 0);
        return autoGranularity(count);
    }, [granularity, view, flow.length, wealth]);

    return (
        <Panel
            title={view === 'trends' ? 'التدفقات والاتجاهات' : 'تطور الثروة'}
            badge={periodLabel}
            right={
                <div className="flex border" style={{ borderColor: C.b }}>
                    {[
                        { k: 'trends', l: 'التدفقات' },
                        { k: 'wealth', l: 'تطور الثروة' },
                    ].map((v) => (
                        <button
                            key={v.k}
                            type="button"
                            onClick={() => setView(v.k)}
                            className={`${F.ar} text-[0.65rem] font-semibold px-2.5 py-1 transition-colors`}
                            style={view === v.k ? { background: C.gold, color: C.void } : { color: C.t3 }}
                        >
                            {v.l}
                        </button>
                    ))}
                </div>
            }
        >
            <div className="flex flex-col gap-4">
           
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`${F.mono} text-[0.58rem] tracking-[2px]`} style={{ color: C.t4 }}>
                        دقة العرض:
                    </span>

                    {Object.entries(GRANULARITY_DEFS).map(([key, def]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setGranularity(key)}
                            className={`${F.head} text-[0.7rem] font-semibold px-2.5 py-1 border transition-colors`}
                            style={granularity === key
                                ? { borderColor: C.cyan, color: C.void, background: C.cyan }
                                : { borderColor: C.b, color: C.t3 }}
                        >
                            {def.label}
                        </button>
                    ))}

                    {granularity === 'auto' && (
                        <span className={`${F.mono} text-[0.55rem] ms-1`} style={{ color: C.t4 }}>
                            ({GRANULARITY_DEFS[effGranularity].label})
                        </span>
                    )}
                </div>

                {view === 'trends' ? (
                    <TrendChart flow={flow} granularity={effGranularity} />
                ) : (
                    <WealthChart data={wealth} granularity={effGranularity} />
                )}
            </div>
        </Panel>
    );
}