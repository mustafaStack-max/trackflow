import InsightCard from './InsightCard';
import { COLORS as C, FONT as F } from '@/Components/Dashboard/theme';
import { EmptyState } from '@/Components/Dashboard/Panel';

export default function InsightsList({ insights = [] }) {
    if (!insights || insights.length === 0) {
        return <EmptyState>// لا توجد توصيات ذكية //</EmptyState>;
    }


    const counts = insights.reduce((acc, i) => {
        acc[i.type] = (acc[i.type] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="flex flex-col gap-4">
   
            <div className="flex flex-wrap items-center gap-2 pb-2 border-b" style={{ borderColor: C.b }}>
                <span className={`${F.mono} text-[0.58rem] tracking-[2px]`} style={{ color: C.t4 }}>
                    ANALYTICS SUMMARY
                </span>

                {counts.danger > 0 && (
                    <span
                        className={`${F.mono} text-[0.6rem] font-bold px-2 py-0.5 border rounded`}
                        style={{ borderColor: 'rgba(255,92,92,0.4)', color: '#ff5c5c', background: 'rgba(255,92,92,0.1)' }}
                    >
                        {counts.danger} خطر
                    </span>
                )}

                {counts.warning > 0 && (
                    <span
                        className={`${F.mono} text-[0.6rem] font-bold px-2 py-0.5 border rounded`}
                        style={{ borderColor: 'rgba(255,183,77,0.4)', color: '#ffb74d', background: 'rgba(255,183,77,0.1)' }}
                    >
                        {counts.warning} تحذير
                    </span>
                )}

                {counts.success > 0 && (
                    <span
                        className={`${F.mono} text-[0.6rem] font-bold px-2 py-0.5 border rounded`}
                        style={{ borderColor: 'rgba(0,230,118,0.4)', color: '#00e676', background: 'rgba(0,230,118,0.1)' }}
                    >
                        {counts.success} إيجابي
                    </span>
                )}

                {counts.info > 0 && (
                    <span
                        className={`${F.mono} text-[0.6rem] font-bold px-2 py-0.5 border rounded`}
                        style={{ borderColor: 'rgba(0,212,255,0.4)', color: '#00d4ff', background: 'rgba(0,212,255,0.1)' }}
                    >
                        {counts.info} معلومة
                    </span>
                )}
            </div>

            
            <div className="flex flex-col gap-3">
                {insights.map((insight, idx) => (
                    <InsightCard key={idx} insight={insight} />
                ))}
            </div>

            <div className={`${F.mono} text-[0.58rem] tracking-[1px] pt-2 text-center`} style={{ color: C.t4 }}>
                // التوصيات تعتمد على بيانات الفترة المختارة وتحديث كل تغيير فترة //
            </div>
        </div>
    );
}