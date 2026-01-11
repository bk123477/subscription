'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Calendar, Settings, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/theme';

const tabs = [
    { path: '/home', icon: Home, labelKey: 'nav.home' as const },
    { path: '/schedule', icon: Calendar, labelKey: 'nav.schedule' as const },
    { path: '/ytd', icon: TrendingUp, labelKey: 'nav.ytd' as const },
    { path: '/manage', icon: Settings, labelKey: 'nav.manage' as const },
];

export function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useTranslation();

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-100"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.path || pathname.startsWith(tab.path + '/');
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.path}
                            onClick={() => router.push(tab.path)}
                            className="relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors"
                        >
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: isActive ? 1.1 : 1,
                                    color: isActive ? colors.nav.active : colors.nav.inactive,
                                }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            >
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            </motion.div>
                            <motion.span
                                initial={false}
                                animate={{
                                    color: isActive ? colors.nav.active : colors.nav.inactive,
                                    fontWeight: isActive ? 600 : 400,
                                }}
                                className="nav-label"
                            >
                                {t(tab.labelKey)}
                            </motion.span>
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute -top-px left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full"
                                    style={{ backgroundColor: colors.nav.active }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
