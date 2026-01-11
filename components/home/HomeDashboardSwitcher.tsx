'use client';

import { AnimatePresence } from 'framer-motion';
import { Category, Subscription } from '@/lib/db';
import { useSettings } from '@/lib/useSettings';
import { MinimalKpiDashboard } from './MinimalKpiDashboard';
import { LandscapeDashboard } from './LandscapeDashboard';
import { TimeWheelDashboard } from './TimeWheelDashboard';

interface HomeDashboardSwitcherProps {
    subscriptions: Subscription[];
    totalMonthly: number;
    categoryTotals: Record<Category, number>;
    onCategoryClick?: (category: Category) => void;
}

export function HomeDashboardSwitcher({
    subscriptions,
    totalMonthly,
    categoryTotals,
    onCategoryClick
}: HomeDashboardSwitcherProps) {
    const { dashboardMode } = useSettings();

    return (
        <AnimatePresence mode="wait">
            {dashboardMode === 'MINIMAL_KPI' && (
                <MinimalKpiDashboard
                    key="minimal"
                    subscriptions={subscriptions}
                    totalMonthly={totalMonthly}
                    onCategoryClick={onCategoryClick}
                />
            )}
            {dashboardMode === 'LANDSCAPE' && (
                <LandscapeDashboard
                    key="landscape"
                    subscriptions={subscriptions}
                    totalMonthly={totalMonthly}
                    onCategoryClick={onCategoryClick}
                />
            )}
            {dashboardMode === 'TIME_WHEEL' && (
                <TimeWheelDashboard
                    key="timewheel"
                    subscriptions={subscriptions}
                    totalMonthly={totalMonthly}
                    onCategoryClick={onCategoryClick}
                />
            )}
        </AnimatePresence>
    );
}
