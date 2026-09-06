import { COLORS as C, FONT as F } from '@/Components/Dashboard/theme';
import { fmtMAD } from '@/Components/Dashboard/format';

const CONFIG = {
    danger: {
        color: '#ff5c5c',
        bg: 'rgba(255, 92, 92, 0.06)',
        border: 'rgba(255, 92, 92, 0.35)',
        label: 'خطر',
        icon: (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 3l8 13H2L10 3z" strokeLinejoin="round" />
                <path d="M10 9v3M10 14.5v.5" strokeLinecap="round" />
            </svg>
        ),
    },
    warning: {
        color: '#ffb74d',
        bg: 'rgba(255, 183, 77, 0.06)',
        border: 'rgba(255, 183, 77, 0.35)',
        label: 'تحذير',
        icon: (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="10" cy="10" r="7" />
                <path d="M10 7v4M10 13.5v.5" strokeLinecap="round" />
            </svg>
        ),
    },
    success: {
        color: '#00e676',
        bg: 'rgba(0, 230, 118, 0.06)',
        border: 'rgba(0, 230, 118, 0.35)',
        label: 'إيجابي',
        icon: (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="10" cy="10" r="7" />
                <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    info: {
        color: '#00d4ff',
        bg: 'rgba(0, 212, 255, 0.06)',
        border: 'rgba(0, 212, 255, 0.35)',
        label: 'معلومة',
        icon: (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="10" cy="10" r="7" />
                <path d="M10 9v4M10 7v.5" strokeLinecap="round" />
            </svg>
        ),
    },
};

export default function InsightCard({ insight }) {
    const cfg = CONFIG[insight.type] || CONFIG.info;

    return (
        <div
            className="relative p-3.5 border overflow-hidden transition-transform duration-150 hover:-translate-y-px"
            style={{ borderColor: cfg.border, background: cfg.bg }}
        >
            {/* خط علوي ملوّن */}
            <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }}
            />

            <div className="flex items-start gap-3">
                {/* الأيقونة */}
                <div
                    className="shrink-0 flex items-center justify-center w-9 h-9 rounded border"
                    style={{ color: cfg.color, borderColor: `${cfg.color}55`, background: `${cfg.color}15` }}
                >
                    {cfg.icon}
                </div>

                {/* المحتوى */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`${F.ar} text-[0.88rem] font-bold`} style={{ color: C.t1 }}>
                            {insight.title}
                        </span>
                        <span
                            className={`${F.mono} text-[0.52rem] tracking-[1px] px-1.5 py-0.5 border rounded`}
                            style={{ borderColor: `${cfg.color}55`, color: cfg.color, background: `${cfg.color}20` }}
                        >
                            {cfg.label}
                        </span>
                    </div>

                    <p className={`${F.ar} text-[0.75rem] leading-relaxed`} style={{ color: C.t2 }}>
                        {insight.message}
                    </p>

                    {/* الأثر المالي إن وجد */}
                    {insight.impact > 0 && (
                        <div className={`${F.mono} text-[0.62rem] mt-2 flex items-center gap-1.5`} style={{ color: C.t4 }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                            أثر مالي: <span className="font-bold" style={{ color: C.t3 }}>{fmtMAD(insight.impact)} MAD</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}