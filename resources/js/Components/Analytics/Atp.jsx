import { useState } from 'react';
import Panel from '@/Components/Dashboard/Panel';
import { COLORS as C, FONT as F } from '@/Components/Dashboard/theme';
import TrendChart from './TrendChart';
import WealthChart from './WealthChart';

export default function AnalyticsTrendsPanel({ trends = [], wealth = null, periodLabel }) {
    const [view, setView] = useState('trends');

    return (
        <Panel
            title={view === 'trends' ? 'الاتجاهات الشهرية' : 'تطور الثروة'}
            badge={periodLabel}
            right={
                <div className="flex border" style={{ borderColor: C.b }}>
                    {[
                        { k: 'trends', l: 'الاتجاهات الشهرية' },
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
            {view === 'trends' ? (
                <TrendChart data={trends} />
            ) : (
                <WealthChart data={wealth} />
            )}
        </Panel>
    );
}