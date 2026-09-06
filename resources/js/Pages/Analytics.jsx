import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Panel, { EmptyState } from '@/Components/Dashboard/Panel';
import { COLORS as C, FONT as F } from '@/Components/Dashboard/theme';

// المكونات الجديدة
import AnalyticsHeader from '@/Components/Analytics/AnalyticsHeader';
import AnalyticsKpis from '@/Components/Analytics/AnalyticsKpis';
import ChangeAnalysisTable from '@/Components/Analytics/ChangeAnalysisTable';

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

    // الأقسام المتبقية (T11, T12)
    const nextSections = [
        {
            title: 'الاتجاهات الشهرية',
            ready: trends.length > 0,
            task: 'T11',
            message: '// مخطط الاتجاهات الشهرية سيُبنى هنا //',
        },
        {
            title: 'تركيز المصاريف',
            ready: Boolean(concentration),
            task: 'T12',
            message: '// لوحة تركيز المصاريف ستُبنى هنا //',
        },
        {
            title: 'التوصيات الذكية',
            ready: insights.length > 0,
            task: 'T12',
            message: '// التوصيات الذكية ستُبنى هنا //',
        },
    ];

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

                {/* 🔥 القسم الجديد: لماذا تغيّر صرفك؟ (T10) */}
                <Panel 
                    title="لماذا تغيّر صرفك؟" 
                    badge={
                        changeAnalysis 
                            ? (changeAnalysis.direction === 'up' ? 'ارتفاع' : changeAnalysis.direction === 'down' ? 'انخفاض' : 'مستقر') 
                            : 'PENDING'
                    }
                    right={
                        changeAnalysis && changeAnalysis.totalChangePct !== null ? (
                            <span 
                                className={`${F.mono} text-[0.75rem] font-bold px-2 py-0.5 border rounded`} 
                                style={{ 
                                    borderColor: `${changeAnalysis.direction === 'up' ? C.red : C.green}44`, 
                                    color: changeAnalysis.direction === 'up' ? C.red : C.green,
                                    background: `${changeAnalysis.direction === 'up' ? C.red : C.green}10`
                                }}
                            >
                                {changeAnalysis.totalChange > 0 ? '+' : ''}{changeAnalysis.totalChangePct}%
                            </span>
                        ) : null
                    }
                >
                    <ChangeAnalysisTable data={changeAnalysis} />
                </Panel>

                {/* الأقسام المتبقية (T11, T12) */}
                <div className="grid lg:grid-cols-2 gap-5">
                    {nextSections.map((section) => (
                        <Panel
                            key={section.title}
                            title={section.title}
                            badge={section.ready ? 'READY' : 'PENDING'}
                        >
                            <EmptyState>
                                {section.message}
                            </EmptyState>
                        </Panel>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}