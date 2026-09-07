import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { COLORS as C, FONT as F } from '@/Components/Dashboard/theme';

/* ★★ NAV_GROUPS: قلّل العناصر "الميتة" — دمجها في قسم واحد بدل 5 عناصر مفرقة ★★ */
const NAV_GROUPS = [
    {
        title: 'الرئيسية',
        items: [
            { key: 'dashboard', label: 'لوحة التحكم', routeName: 'dashboard', icon: 'grid' },
            { key: 'transactions', label: 'المعاملات', routeName: 'transactions.index', icon: 'receipt', countKey: 'transactions' },
            { key: 'accounts', label: 'الحسابات', routeName: 'accounts.index', icon: 'wallet', countKey: 'accounts' },
        ],
    },
    {
        title: 'الإدارة المالية',
        items: [
            /* ★★ مفعّلة الآن — الصفحات موجودة ★★ */
            { key: 'analytics', label: 'التحليلات', routeName: 'analytics.index', icon: 'chart' },
            { key: 'budgets', label: 'الميزانيات', routeName: 'budgets.index', icon: 'card' },
            { key: 'categories', label: 'التصنيفات', routeName: 'categories.index', icon: 'tag' },
            
            /* باقي العناصر تبقى قريبًا */
            { key: 'goals', label: 'الأهداف المالية', routeName: 'goals.index', icon: 'target', soon: true },
            { key: 'audit', label: 'سجل العمليات', routeName: 'audit.index', icon: 'clock', soon: true },
        ],
    },
];

const ICONS = {
    grid: (p) => (<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><rect x="3" y="3" width="6" height="8" rx="0.5" /><rect x="11" y="3" width="6" height="4" rx="0.5" /><rect x="11" y="9" width="6" height="8" rx="0.5" /><rect x="3" y="13" width="6" height="4" rx="0.5" /></svg>),
    receipt: (p) => (<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M5 2v16l2.5-1.5L10 18l2.5-1.5L15 18V2l-2.5 1.5L10 2 7.5 3.5 5 2z" strokeLinejoin="round" /><path d="M8 7h4M8 10.5h4" strokeLinecap="round" /></svg>),
    wallet: (p) => (<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><rect x="2" y="5" width="16" height="11" rx="1" /><path d="M2 8.5h16" /><circle cx="14.5" cy="12" r="1" fill="currentColor" stroke="none" /></svg>),
    chart: (p) => (<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M3 17V9M8 17V4M13 17v-6M18 17V7" strokeLinecap="round" /></svg>),
    card: (p) => (<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><rect x="2" y="4" width="16" height="12" rx="1" /><path d="M2 8h16M5 12.5h4" strokeLinecap="round" /></svg>),
    target: (p) => (<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><circle cx="10" cy="10" r="7.5" /><circle cx="10" cy="10" r="4" /><circle cx="10" cy="10" r="1" fill="currentColor" stroke="none" /></svg>),
    tag: (p) => (<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M17.5 10.5l-7 7L3 10V3h7l7.5 7.5z" strokeLinejoin="round" /><circle cx="7" cy="7" r="1.2" fill="currentColor" stroke="none" /></svg>),
    clock: (p) => (<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><circle cx="10" cy="10" r="7.5" /><path d="M10 6v4l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>),
    help: (p) => (<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><circle cx="10" cy="10" r="7.5" /><path d="M8 8a2 2 0 1 1 2.8 1.8c-.6.3-.8.7-.8 1.4" strokeLinecap="round" /><circle cx="10" cy="13.8" r="0.9" fill="currentColor" stroke="none" /></svg>),
    gear: (p) => (<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><circle cx="10" cy="10" r="2.4" /><path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1L4.7 4.7" strokeLinecap="round" /></svg>),
    collapse: (p) => (<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>),
    expand: (p) => (<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M8 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>),
    x: (p) => (<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" /></svg>),
    user: (p) => (<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><circle cx="10" cy="7" r="3.5" /><path d="M3.5 17c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" strokeLinecap="round" /></svg>),
    logout: (p) => (<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M12 3H4v14h8M8 10h9M14 6.5L17.5 10 14 13.5" strokeLinecap="round" strokeLinejoin="round" /></svg>),
    coin: (p) => (<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><circle cx="10" cy="10" r="7.5" /><path d="M10 5v10M7.5 7.5h4a1.5 1.5 0 0 1 0 3H8a1.5 1.5 0 0 0 0 3h4" strokeLinecap="round" /></svg>),
    stack: (p) => (<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M10 3l7 3.5L10 10 3 6.5 10 3zM3 10l7 3.5L17 10M3 13.5l7 3.5 7-3.5" strokeLinejoin="round" /></svg>),
};

/* ★★ تنسيق رقم آمن ضد RTL/LTR ★★ */
const SafeNum = ({ value, color = C.t1, size = 'text-[0.82rem]' }) => (
    <span
        dir="ltr"
        className={`${F.mono} ${size} font-bold inline-block`}
        style={{ color, fontVariantNumeric: 'tabular-nums' }}
    >
        {value}
    </span>
);

function BrandMark({ collapsed }) {
    return (
        <div className="flex items-center gap-2.5 min-w-0">
            {/* ★ الشعار الجديد — C.green يلوّن الـ currentColor */}
            <img
                src="/logo.svg"
                alt="TrackFlow"
                width="28"
                height="28"
                className="shrink-0"
                style={{ color: C.green }}
            />
            {!collapsed && (
                <div className="min-w-0">
                    <div className={`${F.head} text-[1rem] font-bold tracking-[1.5px]`} style={{ color: C.t1 }}>
                        TRACK<span style={{ color: C.green }}>FLOW</span>
                    </div>
                    <div className={`${F.mono} text-[0.52rem] tracking-[2.5px]`} style={{ color: C.t4 }}>
                        FINANCIAL OS
                    </div>
                </div>
            )}
        </div>
    );
}

function SidebarItem({ item, count, collapsed, onNavigate }) {
    const Icon = ICONS[item.icon] || ICONS.grid;
    const exists = !item.soon && route().has(item.routeName);
    const active = exists && route().current(item.routeName);

    /* ★★ العناصر "قريبًا": opacity-55 بدل 35 + بدون SOON متكرر ★★ */
    if (item.soon) {
        return (
            <div title={collapsed ? item.label : undefined}
                className={`flex h-10 items-center gap-3 px-3 opacity-55 ${collapsed ? 'justify-center' : ''}`}>
                <span style={{ color: C.t4 }}><Icon /></span>
                {!collapsed && (
                    <>
                        <span className={`${F.ar} text-[0.78rem] flex-1 truncate`} style={{ color: C.t3 }}>{item.label}</span>
                    </>
                )}
            </div>
        );
    }

    if (!exists) {
        return (
            <div title={collapsed ? item.label : undefined}
                className={`flex h-10 items-center gap-3 px-3 opacity-55 ${collapsed ? 'justify-center' : ''}`}>
                <span style={{ color: C.t4 }}><Icon /></span>
                {!collapsed && <span className={`${F.ar} text-[0.78rem] flex-1 truncate`} style={{ color: C.t3 }}>{item.label}</span>}
            </div>
        );
    }

    return (
        <Link href={route(item.routeName)} onClick={onNavigate} title={collapsed ? item.label : undefined}
            className={`relative flex h-10 items-center gap-3 border-r-2 transition-colors duration-150 ${collapsed ? 'justify-center px-0' : 'px-3'} ${!active ? 'hover:bg-white/[0.04]' : ''} focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset`}
            style={{
                color: active ? C.green : C.t3,
                background: active ? C.greenTrace : undefined,
                borderRightColor: active ? C.green : 'transparent',
                '--tw-ring-color': C.green,
            }}>
            <span className="shrink-0"><Icon /></span>
            {!collapsed && <span className={`${F.ar} text-[0.8rem] font-medium flex-1 truncate`}>{item.label}</span>}
            {!collapsed && count !== undefined && (
                <span className={`${F.mono} text-[0.6rem] px-1.5 py-0.5 border`}
                    style={{ borderColor: active ? `${C.green}55` : C.b, color: active ? C.green : C.t4 }}>
                    {count}
                </span>
            )}
            {collapsed && count > 0 && (
                <span className="absolute top-1.5 left-1.5 w-1.5 h-1.5" style={{ background: C.green }} />
            )}
        </Link>
    );
}

/* ★★ قسم الملف الشخصي — بدون عرض الدور نهائيًا ★★ */
function ProfileSection({ collapsed, user, navSummary, onNavigated }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const down = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', down);
        return () => document.removeEventListener('mousedown', down);
    }, []);

    const close = () => setOpen(false);
    const displayName = user?.username ?? user?.name ?? 'حسابي';
    const initials = String(displayName).trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join('').toUpperCase() || 'U';
    const profileExists = route().has('profile.edit');
    const avatarUrl = user?.avatar_url ?? null;

    const AvatarBadge = ({ size = 'h-8 w-8', textSize = 'text-[0.65rem]' }) =>
        avatarUrl ? (
            <img src={avatarUrl} alt={displayName}
                className={`${size} shrink-0 rounded-full object-cover border`}
                style={{ borderColor: `${C.green}55` }} />
        ) : (
            <span className={`${size} flex shrink-0 items-center justify-center border`}
                style={{ borderColor: `${C.green}55`, color: C.green, background: C.greenTrace }}>
                <span className={`${F.mono} ${textSize} font-bold`}>{initials}</span>
            </span>
        );

    const doLogout = () => {
        close();
        router.post(route('logout'));
    };

    return (
        <div className="relative" ref={ref}>
            {/* زر البطاقة */}
            <button type="button" onClick={() => setOpen(v => !v)}
                className={`flex w-full items-center gap-2.5 border p-2 transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset ${collapsed ? 'justify-center' : ''}`}
                style={{ borderColor: open ? `${C.green}55` : C.b, background: open ? C.greenTrace : C.card2, '--tw-ring-color': C.green }}>

                <AvatarBadge />

                {!collapsed && (
                    <>
                        <span className="min-w-0 flex-1 text-start">
                            <span className={`${F.ar} block text-[0.72rem] font-semibold truncate`} style={{ color: C.t1 }}>
                                {displayName}
                            </span>
                            <span className={`${F.mono} block text-[0.55rem] truncate mt-0.5`} style={{ color: C.t4 }}>
                                {user?.email ?? '—'}
                            </span>
                        </span>
                        <span style={{ color: open ? C.green : C.t4 }}><ICONS.gear /></span>
                    </>
                )}
            </button>

            {/* القائمة المنبثقة — بدون دور */}
            {open && (
                <div className={`absolute z-[400] w-[280px] border shadow-2xl origin-bottom ${collapsed ? 'bottom-0 right-full mr-2' : 'bottom-full mb-2 right-0'}`}
                    style={{ background: C.card, borderColor: C.bHot, animation: 'tf_popIn 150ms ease-out' }}>

                    {navSummary && (
                        <div className="border-b p-3" style={{ borderColor: C.b }}>
                            <div className={`${F.mono} text-[0.55rem] tracking-[2px] mb-2.5`} style={{ color: C.t4 }}>
                                // FINANCIAL SNAPSHOT
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="border p-2" style={{ borderColor: C.b, background: C.card2 }}>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span style={{ color: C.green }}><ICONS.coin /></span>
                                        <span className={`${F.ar} text-[0.6rem]`} style={{ color: C.t3 }}>الثروة</span>
                                    </div>
                                    <SafeNum
                                        value={`${Number(navSummary.totalNetWorth || 0).toLocaleString('ar-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`}
                                        color={C.green}
                                        size="text-[0.78rem]"
                                    />
                                </div>
                                <div className="border p-2" style={{ borderColor: C.b, background: C.card2 }}>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span style={{ color: C.cyan }}><ICONS.stack /></span>
                                        <span className={`${F.ar} text-[0.6rem]`} style={{ color: C.t3 }}>الحسابات</span>
                                    </div>
                                    <SafeNum value={navSummary.accountsCount} color={C.t1} size="text-[0.95rem]" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-1.5 space-y-0.5">
                        {profileExists && (
                            <Link href={route('profile.edit')}
                                onClick={() => { close(); onNavigated?.(); }}
                                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-start transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset"
                                style={{ '--tw-ring-color': C.green }}>
                                <span style={{ color: C.t3 }}><ICONS.user /></span>
                                <span className={`${F.ar} text-[0.72rem] flex-1`} style={{ color: C.t2 }}>الملف الشخصي</span>
                            </Link>
                        )}

                        <button type="button" disabled
                            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-start opacity-40 cursor-not-allowed">
                            <span style={{ color: C.t3 }}><ICONS.gear /></span>
                            <span className={`${F.ar} text-[0.72rem] flex-1`} style={{ color: C.t2 }}>الإعدادات</span>
                            <span className={`${F.mono} text-[0.52rem] tracking-[1px] px-1.5 py-0.5 border`}
                                style={{ borderColor: `${C.gold}55`, color: C.gold, background: `${C.gold}15` }}>
                                قريبًا
                            </span>
                        </button>

                        <div className="my-1 border-t" style={{ borderColor: C.b }} />

                        <button type="button" onClick={doLogout}
                            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-start transition-colors hover:bg-[rgba(255,92,92,0.08)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset"
                            style={{ '--tw-ring-color': C.red }}>
                            <span style={{ color: C.red }}><ICONS.logout /></span>
                            <span className={`${F.ar} text-[0.72rem] flex-1`} style={{ color: C.red }}>تسجيل الخروج</span>
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes tf_popIn {
                    from { opacity: 0; transform: translateY(4px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}

export default function Sidebar({ auth, mobileOpen = false, onMobileClose }) {
    const { props } = usePage();
    const navCounts = props.navCounts ?? {};
    const navSummary = props.navSummary ?? null;
    const user = auth?.user ?? props.auth?.user ?? null;
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('tf_sidebar_collapsed') === '1') setCollapsed(true);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('sidebar-collapsed', collapsed);
    }, [collapsed]);

    const Nav = ({ isCollapsed }) => (
        <nav className="flex-1 overflow-y-auto px-2 pb-4">
            {NAV_GROUPS.map((group, gi) => (
                <div key={group.title} className={gi > 0 ? 'mt-6' : 'mt-5'}>
                    {!isCollapsed && (
                        <div className={`${F.mono} text-[0.58rem] tracking-[2px] px-3 mb-1.5 flex items-center justify-between`} style={{ color: C.t4 }}>
                            <span>// {group.title}</span>
                            {group.title === 'قريبًا' && (
                                <span className="text-[0.5rem] px-1 py-0.5 border"
                                    style={{ borderColor: `${C.amber}44`, color: C.amber, background: `${C.amber}0d` }}>
                                    {group.items.length}
                                </span>
                            )}
                        </div>
                    )}
                    <div className="space-y-0.5">
                        {group.items.map((item) => (
                            <SidebarItem key={item.key} item={item}
                                count={item.countKey ? navCounts[item.countKey] : undefined}
                                collapsed={isCollapsed} onNavigate={onMobileClose} />
                        ))}
                    </div>
                </div>
            ))}
        </nav>
    );

    return (
        <>
            {/* DESKTOP */}
            <aside dir="rtl" className={`fixed right-0 top-0 z-[200] hidden h-screen lg:flex flex-col border-l transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[240px]'}`}
                style={{ background: C.card, borderColor: C.b }}>
                <div className={`flex h-14 shrink-0 items-center border-b ${collapsed ? 'justify-center px-0' : 'justify-between px-4'}`} style={{ borderColor: C.b }}>
                    <BrandMark collapsed={collapsed} />
                </div>

                <Nav isCollapsed={collapsed} />

                <div className="border-t p-2 space-y-1" style={{ borderColor: C.b }}>
                    <button type="button" title="المساعدة والدعم"
                        className={`flex h-9 w-full items-center gap-3 transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset ${collapsed ? 'justify-center' : 'px-3'}`}
                        style={{ color: C.t3, '--tw-ring-color': C.green }}>
                        <ICONS.help />
                        {!collapsed && <span className={`${F.ar} text-[0.75rem]`}>المساعدة والدعم</span>}
                    </button>

                    <ProfileSection collapsed={collapsed} user={user} navSummary={navSummary} onNavigated={onMobileClose} />

                    <button type="button"
                        onClick={() => setCollapsed((c) => { localStorage.setItem('tf_sidebar_collapsed', c ? '0' : '1'); return !c; })}
                        className={`flex h-9 w-full items-center gap-3 transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset ${collapsed ? 'justify-center' : 'px-3'}`}
                        style={{ color: C.t4, '--tw-ring-color': C.green }}>
                        {collapsed ? <ICONS.expand /> : <ICONS.collapse />}
                        {!collapsed && <span className={`${F.mono} text-[0.6rem] tracking-[1px]`}>طي القائمة</span>}
                    </button>
                </div>
            </aside>

            {/* MOBILE */}
            <aside dir="rtl" className={`fixed right-0 top-0 z-[250] flex h-screen w-[260px] flex-col border-l shadow-2xl transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ background: C.card, borderColor: C.b }}>
                <div className="flex h-14 items-center justify-between border-b px-4" style={{ borderColor: C.b }}>
                    <BrandMark collapsed={false} />
                    <button type="button" onClick={onMobileClose} aria-label="إغلاق" className="p-1" style={{ color: C.t3 }}>
                        <ICONS.x />
                    </button>
                </div>
                <Nav isCollapsed={false} />
                <div className="border-t p-2 space-y-1" style={{ borderColor: C.b }}>
                    <ProfileSection collapsed={false} user={user} navSummary={navSummary} onNavigated={onMobileClose} />
                </div>
            </aside>
        </>
    );
}