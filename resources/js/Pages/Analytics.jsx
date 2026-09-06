import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Panel from '@/Components/Dashboard/Panel';
import { COLORS as C, FONT as F } from '@/Components/Dashboard/theme';

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
    return (
        <AuthenticatedLayout>
            <Head title="التحليلات" />

            <div dir="rtl" className="flex flex-col gap-5">
                {/* HEADER */}
                <div className="flex flex-wrap items-start justify-between gap-2">
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
                            الفترة السابقة: {period.prevFrom || '—'} ← {period.prevTo || '—'}
                        </div>
                    </div>
                </div>

                {/* MAIN PANEL */}
                <Panel title="التحليلات" badge={periodLabel}>
                    <div
                        className={`${F.mono} text-center py-16 text-[0.7rem] tracking-[2px]`}
                        style={{ color: C.t4 }}
                    >
                        // منطق الفترات جاهز — الخطوة التالية هي بناء AnalyticsService //
                    </div>
                </Panel>
            </div>
        </AuthenticatedLayout>
    );
}