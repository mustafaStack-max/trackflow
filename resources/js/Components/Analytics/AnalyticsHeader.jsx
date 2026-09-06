import { useEffect, useState } from 'react';
import { COLORS as C, FONT as F } from '@/Components/Dashboard/theme';
import { RANGE_DEFS } from '@/Components/Dashboard/aggregate';

export default function AnalyticsHeader({
    range = '90d',
    customFrom = null,
    customTo = null,
    periodLabel = 'آخر 3 أشهر',
    previousPeriodLabel = 'الفترة السابقة',
    period = {},
    onRangeChange,
}) {
    const [customOpen, setCustomOpen] = useState(range === 'custom');

    const [custom, setCustom] = useState({
        from: customFrom || period.from || '',
        to: customTo || period.to || '',
    });

    useEffect(() => {
        setCustom({
            from: customFrom || period.from || '',
            to: customTo || period.to || '',
        });
    }, [customFrom, customTo, period.from, period.to]);

    useEffect(() => {
        setCustomOpen(range === 'custom');
    }, [range]);

    const canApply = Boolean(custom.from && custom.to);

    const handleClick = (key) => {
        if (key === 'custom') {
            setCustomOpen(true);
            return;
        }

        setCustomOpen(false);
        onRangeChange?.(key, null);
    };

    const applyCustom = () => {
        if (!canApply) return;

        onRangeChange?.('custom', custom);
    };

    return (
        <div className="border overflow-hidden" style={{ background: C.card, borderColor: C.b }}>
          
            <div
                className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 border-b"
                style={{ borderColor: C.b }}
            >
                <div>
                    <div
                        className={`${F.head} text-[1.3rem] font-bold tracking-[3px] uppercase`}
                        style={{ color: C.t1 }}
                    >
                        لوحة <em className="not-italic" style={{ color: C.green }}>التحليلات</em>
                    </div>

                    <div
                        className={`${F.mono} text-[0.72rem] tracking-[2px] mt-1`}
                        style={{ color: C.t4 }}
                    >
                        // FINANCIAL ANALYTICS // <span style={{ color: C.green }}>{periodLabel}</span>
                    </div>

                    <div
                        className={`${F.mono} text-[0.62rem] tracking-[1px] mt-1`}
                        style={{ color: C.t3 }}
                    >
                        الفترة: {period.from || '—'} ← {period.to || '—'}
                    </div>

                    <div
                        className={`${F.mono} text-[0.62rem] tracking-[1px] mt-0.5`}
                        style={{ color: C.t4 }}
                    >
                        المقارنة: {period.prevFrom || '—'} ← {period.prevTo || '—'}
                    </div>
                </div>

                <div className="text-left">
                    <div
                        className={`${F.mono} text-[0.6rem] tracking-[1.5px] px-2 py-1 border inline-block`}
                        style={{ borderColor: C.b, color: C.t3, background: C.greenTrace }}
                    >
                        {previousPeriodLabel}
                    </div>
                </div>
            </div>

         
            <div
                className="flex flex-wrap items-center gap-1.5 px-4 py-2.5 border-b"
                style={{ borderColor: C.b }}
            >
                {Object.entries(RANGE_DEFS).map(([key, def]) => {
                    const isActive = range === key || (key === 'custom' && customOpen);

                    if (key === 'custom') {
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleClick(key)}
                                className={`${F.head} text-[0.72rem] font-semibold px-2.5 py-1 border transition-colors`}
                                style={
                                    isActive
                                        ? { borderColor: C.amber, color: C.void, background: C.amber }
                                        : { borderColor: C.amber, color: C.amber }
                                }
                            >
                                {def.label}
                            </button>
                        );
                    }

                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => handleClick(key)}
                            className={`${F.head} text-[0.72rem] font-semibold px-2.5 py-1 border transition-colors`}
                            style={
                                isActive
                                    ? { borderColor: C.green, color: C.void, background: C.green }
                                    : { borderColor: C.b, color: C.t2 }
                            }
                        >
                            {def.label}
                        </button>
                    );
                })}

                {customOpen && (
                    <div className="w-full flex flex-wrap items-center gap-2 mt-2">
                        <input
                            type="date"
                            value={custom.from}
                            max={custom.to || undefined}
                            onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
                            className={`${F.mono} text-[0.65rem] px-2 py-1 border outline-none`}
                            style={{
                                background: C.card2,
                                borderColor: C.b,
                                color: C.t2,
                                colorScheme: 'dark',
                            }}
                        />

                        <span className={`${F.mono} text-[0.6rem]`} style={{ color: C.t4 }}>
                            ←
                        </span>

                        <input
                            type="date"
                            value={custom.to}
                            min={custom.from || undefined}
                            onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
                            className={`${F.mono} text-[0.65rem] px-2 py-1 border outline-none`}
                            style={{
                                background: C.card2,
                                borderColor: C.b,
                                color: C.t2,
                                colorScheme: 'dark',
                            }}
                        />

                        <button
                            type="button"
                            onClick={applyCustom}
                            disabled={!canApply}
                            className={`${F.head} text-[0.65rem] font-bold px-3 py-1 border transition-opacity`}
                            style={{
                                borderColor: C.green,
                                color: canApply ? C.green : C.t4,
                                opacity: canApply ? 1 : 0.5,
                                cursor: canApply ? 'pointer' : 'not-allowed',
                            }}
                        >
                            تطبيق الفترة المخصصة
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}