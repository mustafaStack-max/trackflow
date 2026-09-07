import { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Panel from '@/Components/Dashboard/Panel';
import { COLORS as C, FONT as F } from '@/Components/Dashboard/theme';
import { fmtMAD } from '@/Components/Dashboard/format';

import AnalyticsHeader from '@/Components/Analytics/AnalyticsHeader';
import AnalyticsKpis from '@/Components/Analytics/AnalyticsKpis';
import ChangeAnalysisTable from '@/Components/Analytics/ChangeAnalysisTable';
import ConcentrationPanel from '@/Components/Analytics/ConcentrationPane';
import InsightsList from '@/Components/Analytics/InsightsList';
import AnalyticsTrendsPanel from '@/Components/Analytics/Atp';

/* ★ ألوان شريط الحالة تُقرأ لحظة الرسم (تدعم الثيمين) */
const BANNER = {
    danger: { color: C.red, border: `${C.red}66`, bg: `${C.red}0d`, icon: '⚠' },
    warning: { color: C.amber, border: `${C.amber}66`, bg: `${C.amber}0d`, icon: '△' },
};

export default function Analytics({
    range = '90d',
    customFrom = null,
    customTo = null,
    periodLabel = 'آخر 3 أشهر',
    previousPeriodLabel = 'الفترة السابقة',
    period = {},
    overview = null,
    changeAnalysis = null,
    flow = [],
    concentration = null,
    wealth = null,
    insights = [],
}) {
    /* ★ مؤشر تحميل خفيف عند تغيير الفترة */
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const onStart = () => setLoading(true);
        const onFinish = () => setLoading(false);

        router.on('start', onStart);
        router.on('finish', onFinish);

        return () => {
            router.off('start', onStart);
            router.off('finish', onFinish);
        };
    }, []);

    const handleRangeChange = (newRange, newCustom = null) => {
        router.get(
            route('analytics.index'),
            {
                range: newRange,
                from: newCustom?.from || undefined,
                to: newCustom?.to || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: [
                    'range',
                    'customFrom',
                    'customTo',
                    'periodLabel',
                    'previousPeriodLabel',
                    'period',
                    'overview',
                    'changeAnalysis',
                    'flow',
                    'concentration',
                    'wealth',
                    'insights',
                ],
            }
        );
    };

    /* ★ أخطر إشارة تظهر أولًا في شريط الحالة */
    const topInsight =
        insights.find((i) => i.type === 'danger') ||
        insights.find((i) => i.type === 'warning') ||
        null;

    const cfg = topInsight ? BANNER[topInsight.type] : null;

    return (
        <AuthenticatedLayout>
            <Head title="التحليلات" />

            <div
                dir="rtl"
                className="flex flex-col gap-5 transition-opacity duration-200"
                style={{ opacity: loading ? 0.55 : 1, pointerEvents: loading ? 'none' : 'auto' }}
            >
                {/* HEADER + FILTERS */}
                <AnalyticsHeader
                    range={range}
                    customFrom={customFrom}
                    customTo={customTo}
                    periodLabel={periodLabel}
                    previousPeriodLabel={previousPeriodLabel}
                    period={period}
                    onRangeChange={handleRangeChange}
                />

                {/* ★ شريط الحالة: أخطر توصية في أعلى الصفحة */}
                {topInsight && cfg && (
                    <div
                        className="flex items-start gap-3 px-4 py-2.5 border"
                        style={{ borderColor: cfg.border, background: cfg.bg }}
                    >
                        <span className={`${F.mono} text-[0.85rem] font-bold shrink-0`} style={{ color: cfg.color }}>
                            {cfg.icon}
                        </span>
                        <div className="min-w-0">
                            <span className={`${F.ar} text-[0.78rem] font-bold`} style={{ color: cfg.color }}>
                                {topInsight.title}:
                            </span>{' '}
                            <span className={`${F.ar} text-[0.72rem]`} style={{ color: C.t2 }}>
                                {topInsight.message}
                            </span>
                        </div>
                    </div>
                )}

                {/* KPI CARDS */}
                <AnalyticsKpis
                    overview={overview}
                    period={period}
                    periodLabel={periodLabel}
                />

                {/* T10: لماذا تغيّر صرفك؟ */}
                <Panel
                    title="لماذا تغيّر صرفك؟"
                    badge={
                        changeAnalysis
                            ? (
                                changeAnalysis.direction === 'up'
                                    ? 'ارتفاع'
                                    : changeAnalysis.direction === 'down'
                                        ? 'انخفاض'
                                        : 'مستقر'
                            )
                            : 'PENDING'
                    }
                    right={
                        changeAnalysis ? (
                            <span
                                className={`${F.mono} text-[0.75rem] font-bold px-2 py-0.5 border rounded`}
                                style={{
                                    borderColor: `${changeAnalysis.direction === 'up' ? C.red : C.green}44`,
                                    color: changeAnalysis.direction === 'up' ? C.red : C.green,
                                    background: `${changeAnalysis.direction === 'up' ? C.red : C.green}10`,
                                }}
                            >
                                {/* ★ نسبة فقط إذا كان الأساس كبيرًا، وإلا فرق مطلق */}
                                {Math.abs(changeAnalysis.previousTotal) >= 100 && changeAnalysis.totalChangePct !== null ? (
                                    <span dir="ltr">{`${changeAnalysis.totalChange > 0 ? '+' : ''}${changeAnalysis.totalChangePct}%`}</span>
                                ) : (
                                    <span dir="ltr">{`${changeAnalysis.totalChange > 0 ? '+' : '-'}${fmtMAD(Math.abs(changeAnalysis.totalChange))} MAD`}</span>
                                )}
                            </span>
                        ) : null
                    }
                >
                    <ChangeAnalysisTable data={changeAnalysis} />
                </Panel>

                {/* T11 + الثروة: تبويبات التدفقات وتطور الثروة */}
                <AnalyticsTrendsPanel
                    flow={flow}
                    wealth={wealth}
                    periodLabel={periodLabel}
                />

                {/* T12: تركيز المصاريف + التوصيات الذكية */}
                <div className="grid lg:grid-cols-2 gap-5">
                    <Panel
                        title="تركيز المصاريف"
                        badge={
                            concentration
                                ? (
                                    concentration.status === 'high'
                                        ? 'خطر'
                                        : concentration.status === 'medium'
                                            ? 'متوسط'
                                            : 'صحي'
                                )
                                : 'PENDING'
                        }
                        right={
                            concentration ? (
                                <span className={`${F.mono} text-[0.6rem] tracking-[1px]`} style={{ color: C.t4 }}>
                                    {concentration.categoriesCount} تصنيف
                                </span>
                            ) : null
                        }
                    >
                        <ConcentrationPanel data={concentration} />
                    </Panel>

                    <Panel
                        title="التوصيات الذكية"
                        badge={insights.length > 0 ? `${insights.length} توصية` : 'PENDING'}
                        right={
                            insights.length > 0 && insights.some((i) => i.type === 'danger') ? (
                                <span
                                    className={`${F.mono} text-[0.6rem] font-bold tracking-[1px] px-2 py-0.5 border rounded`}
                                    style={{
                                        borderColor: `${C.red}66`,
                                        color: C.red,
                                        background: `${C.red}1a`,
                                    }}
                                >
                                    انتبه
                                </span>
                            ) : null
                        }
                    >
                        <InsightsList insights={insights} />
                    </Panel>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}