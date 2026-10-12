'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
    BarChart3,
    CalendarDays,
    ClipboardCheck,
    LayoutDashboard,
    LogOut,
    Medal,
    Route,
    ScrollText,
    UserRound,
    type LucideIcon,
} from 'lucide-react';
import Pingu from '@/components/pingu/Pingu';
import { motion } from 'framer-motion';

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    color: string;
}

export const STUDENT_NAV: NavItem[] = [
    { href: '/', label: 'Journey', icon: Route, color: '#1877C9' },
    { href: '/events', label: 'Events', icon: CalendarDays, color: '#0B7268' },
    { href: '/stats', label: 'Stats', icon: BarChart3, color: '#17803F' },
    { href: '/leaderboard', label: 'Leagues', icon: Medal, color: '#B35500' },
    { href: '/submissions-history', label: 'Log', icon: ScrollText, color: '#6236C9' },
    { href: '/profile', label: 'Profile', icon: UserRound, color: '#D43D6F' },
];

const ADMIN_NAV: NavItem[] = [
    { href: '/', label: 'Overview', icon: LayoutDashboard, color: '#1877C9' },
    { href: '/admin/queue', label: 'Review', icon: ClipboardCheck, color: '#6236C9' },
    { href: '/admin/events', label: 'Events', icon: CalendarDays, color: '#0B7268' },
    { href: '/profile', label: 'Profile', icon: UserRound, color: '#D43D6F' },
];

export default function Navigation() {
    const pathname = usePathname();
    const { logout, user } = useAuth();

    if (pathname === '/login' || pathname.startsWith('/auth/') || pathname === '/register') {
        return null;
    }

    const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
    const items = user?.role === 'admin' ? ADMIN_NAV : STUDENT_NAV;

    return (
        <>
            <MobileTabBar items={items} isActive={isActive} />

            {/* Desktop sidebar */}
            <nav
                aria-label="Main"
                className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r-2 border-line bg-white px-4 py-6 md:flex"
            >
                <Link href="/" className="mb-8 flex items-center gap-2 px-3">
                    <Pingu size={40} animate={false} title="SPARK home" />
                    <span className="font-display text-[28px] font-bold tracking-tight text-glacier">spark</span>
                </Link>

                <ul className="flex flex-1 flex-col gap-1.5">
                    {items.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    aria-current={active ? 'page' : undefined}
                                    className={`group relative flex items-center gap-4 rounded-2xl px-4 py-3 font-display text-[15px] font-semibold uppercase tracking-wide transition-colors ${
                                        active ? '' : 'text-ink-soft hover:bg-snow'
                                    }`}
                                    style={active ? { color: item.color } : undefined}
                                >
                                    {active && (
                                        <motion.span
                                            layoutId="nav-pill-desktop"
                                            className="absolute inset-0 rounded-2xl border-2"
                                            style={{ borderColor: `${item.color}55`, background: `${item.color}12` }}
                                            transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                                        />
                                    )}
                                    <Icon
                                        size={26}
                                        strokeWidth={2.5}
                                        color={active ? item.color : '#7A8AA2'}
                                        className="relative transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110"
                                    />
                                    <span className="relative">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-4 rounded-2xl border-2 border-transparent px-4 py-2.5 font-display text-[15px] font-semibold uppercase tracking-wide text-ink-soft transition-colors hover:bg-berry-soft hover:text-berry-shade"
                >
                    <LogOut size={24} strokeWidth={2.5} />
                    Log out
                </button>
            </nav>
        </>
    );
}

// Bottom tab bar for phones. Also used on the public demo, where every tab
// except Journey leads to login.
export function MobileTabBar({
    items,
    isActive,
    demo = false,
}: {
    items: NavItem[];
    isActive: (href: string) => boolean;
    demo?: boolean;
}) {
    return (
        <nav
            aria-label="Main"
            className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
        >
            <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1">
                {items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    const href = demo && item.href !== '/' ? '/login' : demo ? '/demo' : item.href;
                    return (
                        <li key={item.href} className="flex-1">
                            <Link
                                href={href}
                                aria-current={active ? 'page' : undefined}
                                className="flex flex-col items-center gap-0.5 py-2 active:scale-95 transition-transform"
                            >
                                <span className="relative flex h-10 w-14 items-center justify-center">
                                    {active && (
                                        <motion.span
                                            layoutId="nav-pill-mobile"
                                            className="absolute inset-0 rounded-2xl border-2"
                                            style={{ borderColor: `${item.color}55`, background: `${item.color}14` }}
                                            transition={{ type: 'spring', stiffness: 480, damping: 34 }}
                                        />
                                    )}
                                    <motion.span
                                        className="relative inline-flex"
                                        animate={active ? { y: [0, -5, 0], scale: [1, 1.12, 1] } : { y: 0, scale: 1 }}
                                        transition={{ duration: 0.4, ease: 'easeOut' }}
                                    >
                                        <Icon size={24} strokeWidth={2.6} color={active ? item.color : '#7A8AA2'} />
                                    </motion.span>
                                </span>
                                <span
                                    className="font-display text-[11px] font-semibold uppercase tracking-wide"
                                    style={{ color: active ? item.color : '#7A8AA2' }}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
