import KpiBox, { MomBadge } from '@/Components/Dashboard/KpiBox';
import { COLORS as C, FONT as F } from '@/Components/Dashboard/theme';
import { fmtMAD } from '@/Components/Dashboard/format';

/* ── أيقونات صغيرة ── */

const IcoIncome = (p) => (
    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" {...p}>
        <path d="M12 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 10H4" strokeLinecap="round" />
    </svg>
);

const IcoExpense = (p) => (
    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" {...p}>
        <path d="M8 14l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 10h12" strokeLinecap="round" />
    </svg>
);

const IcoNet = (p) => (
    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" {...p}>
        <rect x="3" y="4" width="14" height="13" rx="1" />
        <path d="M7 2v4M13 2v4M3 9h14" strokeLinecap="round" />
    </svg>
);

const IcoSaving = (p) => (
    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" {...p}>
        <path d="M4.5 15.5l11-11" strokeLinecap="round" />
        <circle cx="6.5" cy="6.5" r="2.2" />
        <circle cx="13.5" cy="13.5" r="2.2" />
    </svg>
);

const IcoDaily = (p) => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" {...p}>
        <rect x="3" y="4" width="14" height="13" rx="1.5" />
        <path d="M7 2v4M13 2v4M3 9h14" strokeLinecap="round" />
    </svg>
);

const IcoTx = (p) => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" {...p}>
        <path d="M4 16V8M8 16V10M12 16V5M16 16V11" strokeLinecap="round" />
    </svg>
);

const IcoForecast = (p) => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" {...p}>
        <path d="M3 15l5-5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 6h4v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const IcoCategory = (p) => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" {...p}>
        <circle cx="10" cy="10" r="7" />
        <path d="M10 3v7l5 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

/* ── مكونات مساعدة ── */

function AmountBadge({ amount, label = 'عن الفترة السابقة' }) {
    if (amount === null || amount === undefined || amount === 0) {
        return null;
    }

    const good = amount > 0;
    const color = good ? C.green : C.red;

    return (
        <span className={`${F.mono} text-[0.62rem]`} style={{ color }}>
            {good ? '+' : '-'}{fmtMAD(Math.abs(amount))} MAD {label}
        </span>
    );
}

function SavingsSub({ current, previous }) {
    if (current === null || current === undefined) {
        return (
            <span className={`${F.mono} text-[0.62rem]`} style={{ color: C.t4 }}>
                لا يمكن حسابه بدون دخل
            </span>
        );
    }

    if (previous === null || previous === undefined) {
        return (
            <span className={`${F.mono} text-[0.62rem]`} style={{ color: C.t4 }}>
                الفترة السابقة: —
            </span>
        );
    }

    const diff = Math.round((current - previous) * 10) / 10;
    const color = diff >= 0 ? C.green : C.red;

    return (
        <span className={`${F.mono} text-[0.62rem]`} style={{ color }}>
            {diff >= 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(1)} نقطة عن الفترة السابقة
        </span>
    );
}

function MiniStat({ icon: Icon, label, value, sub, color = C.t1 }) {
    return (
        <div
            className="relative p-3 border overflow-hidden transition-transform duration-150 hover:-translate-y-px"
            style={{ background: C.card, borderColor: C.b }}
        >
            <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
            />

            <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`${F.ar} text-[0.68rem] font-medium`} style={{ color: C.t3 }}>
                    {label}
                </span>

                {Icon && <Icon style={{ color }} />}
            </div>

            <div
                className={`${F.mono} text-[1.05rem] font-bold truncate`}
                style={{ color }}
            >
                {value}
            </div>

            {sub && (
                <div
                    className={`${F.mono} text-[0.6rem] mt-1`}
                    style={{ color: C.t4 }}
                >
                    {sub}
                </div>
            )}
        </div>
    );
}

function KpiSkeleton() {
    return (
        <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-36 border animate-pulse"
                        style={{ background: C.card, borderColor: C.b }}
                    />
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-24 border animate-pulse"
                        style={{ background: C.card, borderColor: C.b }}
                    />
                ))}
            </div>
        </div>
    );
}

export default function AnalyticsKpis({
    overview = null,
    period = {},
    periodLabel = 'آخر 3 أشهر',
}) {
    if (!overview) {
        return <KpiSkeleton />;
    }

    const {
        income = 0,
        expense = 0,
        net = 0,
        txCount = 0,
        savingsRate = null,
        avgDailyExpense = 0,
        projectedExpense = null,
        topCategory = null,
        previous = {},
        changes = {},
    } = overview;

    const savingsColor =
        savingsRate === null
            ? C.t4
            : savingsRate < 0
                ? C.red
                : savingsRate < 10
                    ? C.amber
                    : savingsRate >= 20
                        ? C.green
                        : C.cyan;

    let projectedColor = C.t4;
    let projectedSub = 'يظهر فقط في فترة الشهر الحالي';

    if (projectedExpense !== null && projectedExpense !== undefined) {
        if (income <= 0) {
            projectedColor = C.amber;
            projectedSub = 'لا يوجد دخل مسجل للمقارنة';
        } else if (projectedExpense > income) {
            projectedColor = C.red;
            projectedSub = 'من المتوقع تجاوز الدخل';
        } else if (projectedExpense > income * 0.9) {
            projectedColor = C.amber;
            projectedSub = 'اقتراب من حدود الدخل';
        } else {
            projectedColor = C.green;
            projectedSub = 'ضمن حدود الدخل';
        }
    }

    return (
        <div className="flex flex-col gap-3">
            {/* MAIN KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <KpiBox
                    icon={IcoIncome}
                    color={C.green}
                    tag={periodLabel}
                    value={`${fmtMAD(income)} MAD`}
                    label="الدخل"
                    sub={<MomBadge pct={changes.incomePct} label="عن الفترة السابقة" />}
                />

                <KpiBox
                    icon={IcoExpense}
                    color={C.red}
                    tag={periodLabel}
                    value={`${fmtMAD(expense)} MAD`}
                    label="المصاريف"
                    sub={<MomBadge pct={changes.expensePct} invert label="عن الفترة السابقة" />}
                />

                <KpiBox
                    icon={IcoNet}
                    color={net >= 0 ? C.green : C.red}
                    tag="NET"
                    value={`${net >= 0 ? '+' : '-'}${fmtMAD(Math.abs(net))} MAD`}
                    label="صافي الفترة"
                    sub={<AmountBadge amount={changes.netDiff} />}
                />

                <KpiBox
                    icon={IcoSaving}
                    color={savingsColor}
                    tag="SAVING"
                    value={savingsRate === null ? '—' : `${savingsRate}%`}
                    label="معدل الادخار"
                    sub={<SavingsSub current={savingsRate} previous={previous.savingsRate} />}
                />
            </div>

            {/* SECONDARY METRICS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MiniStat
                    icon={IcoDaily}
                    color={C.amber}
                    label="متوسط الإنفاق اليومي"
                    value={`${fmtMAD(avgDailyExpense)} MAD`}
                    sub={`محسوب على ${period.days || 0} يوم`}
                />

                <MiniStat
                    icon={IcoTx}
                    color={C.cyan}
                    label="عدد العمليات"
                    value={fmtMAD(txCount)}
                    sub={`الفترة السابقة: ${previous.txCount ?? 0}`}
                />

                <MiniStat
                    icon={IcoForecast}
                    color={projectedColor}
                    label="توقع نهاية الشهر"
                    value={
                        projectedExpense === null || projectedExpense === undefined
                            ? '—'
                            : `${fmtMAD(projectedExpense)} MAD`
                    }
                    sub={projectedSub}
                />

                <MiniStat
                    icon={IcoCategory}
                    color={topCategory?.color_hex || C.cyan}
                    label="أكثر تصنيف إنفاقًا"
                    value={topCategory?.name || '—'}
                    sub={
                        topCategory
                            ? `${fmtMAD(topCategory.total)} MAD · ${topCategory.count} عملية`
                            : 'لا توجد مصاريف في هذه الفترة'
                    }
                />
            </div>
        </div>
    );
}