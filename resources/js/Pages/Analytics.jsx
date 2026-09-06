import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Panel from '@/Components/Dashboard/Panel';
import { COLORS as C, FONT as F } from '@/Components/Dashboard/theme';

function Placeholder({ title, ready = false, children = null }) {
    return (
        <Panel
            title={title}
            badge={ready ? 'READY' : 'PENDING'}
        >
            {children ? (
                children
            ) : (
                <div
                    className={`${F.mono} text-center py-10 text-[0.7rem] tracking-[2px]`}
                    style={{ color: C.t4 }}
                >
  
                </div>
            )}
        </Panel>
    );
}

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

                {/* OVERVIEW */}
                <Placeholder title="الصحة المالية" ready={overview !== null}>
                    <div
                        className={`${F.mono} text-center py-10 text-[0.7rem] tracking-[2px]`}
                        style={{ color: C.t4 }}
                    >
      
                    </div>
                </Placeholder>

                {/* CHANGE ANALYSIS */}
                <Placeholder title="لماذا تغيّر صرفك؟" ready={changeAnalysis !== null}>
                    <div
                        className={`${F.mono} text-center py-10 text-[0.7rem] tracking-[2px]`}
                        style={{ color: C.t4 }}
                    >
        
                    </div>
                </Placeholder>

                {/* TRENDS */}
                <Placeholder title="الاتجاهات الشهرية" ready={trends.length > 0}>
                    <div
                        className={`${F.mono} text-center py-10 text-[0.7rem] tracking-[2px]`}
                        style={{ color: C.t4 }}
                    >
 
                    </div>
                </Placeholder>

                <div className="grid lg:grid-cols-2 gap-5">
                    {/* CONCENTRATION */}
                    <Placeholder title="تركيز المصاريف" ready={concentration !== null}>
                        <div
                            className={`${F.mono} text-center py-10 text-[0.7rem] tracking-[2px]`}
                            style={{ color: C.t4 }}
                        >
                    
                        </div>
                    </Placeholder>

                    {/* INSIGHTS */}
                    <Placeholder title="التوصيات الذكية" ready={insights.length > 0}>
                        <div
                            className={`${F.mono} text-center py-10 text-[0.7rem] tracking-[2px]`}
                            style={{ color: C.t4 }}
                        >
     
                        </div>
                    </Placeholder>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}