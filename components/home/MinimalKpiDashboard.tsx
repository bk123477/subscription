'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Category, Subscription } from '@/lib/db';
import { categoryConfig } from '@/lib/theme';
import { formatCurrencyCompact } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';
import { useFx } from '@/lib/FxContext';
import { monthlyEquivalentAmountConverted } from '@/lib/calc';

interface MinimalKpiDashboardProps {
    subscriptions: Subscription[];
    totalMonthly: number;
    onCategoryClick?: (category: Category) => void;
}

export function MinimalKpiDashboard({
    subscriptions,
    totalMonthly,
    onCategoryClick
}: MinimalKpiDashboardProps) {
    const { t } = useTranslation();
    const { displayCurrency, fxRates } = useFx();

    // Calculate category breakdowns
    const categories = useMemo(() => {
        const totals: Record<Category, number> = {
            'AI': 0,
            'ENTERTAIN': 0,
            'MEMBERSHIP': 0,
            'OTHER': 0,
        };

        subscriptions
            .filter(s => s.isActive)
            .forEach(sub => {
                const converted = monthlyEquivalentAmountConverted(sub, displayCurrency, fxRates);
                totals[sub.category] += converted;
            });

        return (['AI', 'ENTERTAIN', 'MEMBERSHIP', 'OTHER'] as Category[]).map(cat => ({
            category: cat,
            amount: totals[cat],
            percent: totalMonthly > 0 ? (totals[cat] / totalMonthly) * 100 : 0,
            config: categoryConfig[cat],
        }));
    }, [subscriptions, totalMonthly, displayCurrency, fxRates]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="px-4"
        >
            {/* Category Progress Bars */}
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
                {categories.map(({ category, amount, percent, config }, index) => (
                    <motion.div
                        key={category}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="cursor-pointer"
                        onClick={() => onCategoryClick?.(category)}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: config.colors.icon }}
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    {t(config.label as any)}
                                </span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                                {formatCurrencyCompact(amount, displayCurrency)}
                            </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: config.colors.icon }}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(percent, 2)}%` }}
                                transition={{ duration: 0.5, delay: index * 0.05 + 0.1 }}
                            />
                        </div>

                        <p className="text-xs text-gray-400 mt-0.5 text-right">
                            {percent.toFixed(0)}%
                        </p>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
