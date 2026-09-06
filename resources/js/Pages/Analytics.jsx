import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Panel from '@/Components/Dashboard/Panel';
import { COLORS as C, FONT as F } from '@/Components/Dashboard/theme';

import AnalyticsHeader from '@/Components/Analytics/AnalyticsHeader';
import AnalyticsKpis from '@/Components/Analytics/AnalyticsKpis';
import ChangeAnalysisTable from '@/Components/Analytics/ChangeAnalysisTable';
import TrendChart from '@/Components/Analytics/TrendChart';
import ConcentrationPanel from '@/Components/Analytics/ConcentrationPane';
import InsightsList from '@/Components/Analytics/InsightsList';

export default function Analytics({
    range = '90d',
    customFrom = null,
    customTo = null,
    periodLabel = 'آخر 3 أشهر',
    previousPeriodLabel = 'الفترة السابقة',
    period = {},
    overview = null,
    changeAnalysis = null,
    trends = [],
    concentration = null,
    insights = [],
}) {
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
                    'trends',
                    'concentration',
                    'insights',
                ],
            }
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="التحليلات" />

            <div dir="rtl" className="flex flex-col gap-5">
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
                        changeAnalysis && changeAnalysis.totalChangePct !== null ? (
                            <span
                                className={`${F.mono} text-[0.75rem] font-bold px-2 py-0.5 border rounded`}
                                style={{
                                    borderColor: `${changeAnalysis.direction === 'up' ? C.red : C.green}44`,
                                    color: changeAnalysis.direction === 'up' ? C.red : C.green,
                                    background: `${changeAnalysis.direction === 'up' ? C.red : C.green}10`,
                                }}
                            >
                                {changeAnalysis.totalChange > 0 ? '+' : ''}
                                {changeAnalysis.totalChangePct}%
                            </span>
                        ) : null
                    }
                >
                    <ChangeAnalysisTable data={changeAnalysis} />
                </Panel>

                {/* T11: الاتجاهات الشهرية */}
                <Panel
                    title="الاتجاهات الشهرية"
                    badge={periodLabel}
                    right={
                        <span
                            className={`${F.mono} text-[0.6rem] tracking-[1px]`}
                            style={{ color: C.t4 }}
                        >
                            {trends.length} شهر
                        </span>
                    }
                >
                    <TrendChart data={trends} />
                </Panel>

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
                                <span
                                    className={`${F.mono} text-[0.6rem] tracking-[1px]`}
                                    style={{ color: C.t4 }}
                                >
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
                                        borderColor: 'rgba(255,92,92,0.4)',
                                        color: '#ff5c5c',
                                        background: 'rgba(255,92,92,0.1)',
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