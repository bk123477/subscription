'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { db } from '@/lib/db';
import { useTranslation } from '@/lib/i18n';
import { useFx } from '@/lib/FxContext';
import { calculateYTD, calculateYTDBreakdown } from '@/lib/calc';
import { categoryConfig } from '@/lib/theme';
import { Category } from '@/lib/db';
import { formatCurrencyCompact } from '@/lib/format';
import { LanguageToggle } from '@/components/LanguageToggle';

export default function YTDPage() {
    const { t } = useTranslation();
    const { fxRates, displayCurrency } = useFx();

    const subscriptions = useLiveQuery(
        () => db.subscriptions.toArray(),
        [],
        []
    );

    const ytdTotal = calculateYTD(subscriptions || [], displayCurrency, fxRates);
    const categoryTotals = calculateYTDBreakdown(subscriptions || [], displayCurrency, fxRates);
    const categories: Category[] = ['AI', 'ENTERTAIN', 'MEMBERSHIP', 'OTHER'];

    // Find max value for bar scaling
    const maxCategoryTotal = Math.max(...Object.values(categoryTotals), 1);

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: displayCurrency,
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="py-6 space-y-6 px-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('ytd.title')}</h1>
                    <p className="text-gray-500 text-sm">{t('ytd.range')}</p>
                </div>
                <LanguageToggle />
            </div>

            {/* Total Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
            >
                <div className="text-center space-y-2">
                    <p className="text-gray-500 font-medium">{t('ytd.total')}</p>
                    <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
                        {formatAmount(ytdTotal)}
                    </h2>
                    <p className="text-xs text-gray-400">{t('ytd.note')}</p>
                </div>
            </motion.div>

            {/* Category Breakdown */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">{t('ytd.byCategory')}</h3>
                <div className="space-y-3">
                    {categories.map((cat, index) => {
                        const amount = categoryTotals[cat];
                        const config = categoryConfig[cat];
                        const Icon = config.icon as any;
                        const percentage = ytdTotal > 0 ? (amount / ytdTotal) * 100 : 0; // Relative to Total
                        // Or relative to Max for bar visualization? Usually bar visualizes relative to max or 100%?
                        // "Percent bar" usually implies part of whole. 

                        return (
                            <motion.div
                                key={cat}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4"
                            >
                                <div
                                    className="p-3 rounded-xl flex-shrink-0"
                                    style={{ backgroundColor: config.colors.bg, color: config.colors.icon }}
                                >
                                    <Icon size={20} />
                                </div>
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-medium text-gray-900">{t(config.label as any)}</span>
                                        <span className="font-bold text-gray-900">{formatAmount(amount)}</span>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: config.colors.icon }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 text-right">
                                        {percentage.toFixed(1)}%
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
