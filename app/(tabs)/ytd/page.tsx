'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/db';
import { useTranslation } from '@/lib/i18n';
import { useFx } from '@/lib/FxContext';
import { calculateYTD, calculateYTDBreakdown, calculateMonthlyBreakdown } from '@/lib/calc';
import { categoryConfig } from '@/lib/theme';
import { Category } from '@/lib/db';
import { formatCurrencyCompact } from '@/lib/format';
import { LanguageToggle } from '@/components/LanguageToggle';

type ViewMode = 'summary' | 'monthly';

export default function YTDPage() {
    const { t, language } = useTranslation();
    const { fxRates, displayCurrency } = useFx();
    const [viewMode, setViewMode] = useState<ViewMode>('summary');

    const subscriptions = useLiveQuery(
        () => db.subscriptions.toArray(),
        [],
        []
    );

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-indexed

    const ytdTotal = calculateYTD(subscriptions || [], displayCurrency, fxRates);
    const categoryTotals = calculateYTDBreakdown(subscriptions || [], displayCurrency, fxRates);
    const monthlyBreakdown = useMemo(
        () => calculateMonthlyBreakdown(subscriptions || [], currentYear, displayCurrency, fxRates),
        [subscriptions, currentYear, displayCurrency, fxRates]
    );

    const categories: Category[] = ['AI', 'ENTERTAIN', 'MEMBERSHIP', 'OTHER'];

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: displayCurrency,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getMonthName = (monthNum: number) => {
        return t(`month.${monthNum}` as any);
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

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                    onClick={() => setViewMode('summary')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${viewMode === 'summary'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    {t('ytd.summary')}
                </button>
                <button
                    onClick={() => setViewMode('monthly')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${viewMode === 'monthly'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    {t('ytd.monthly')}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {viewMode === 'summary' ? (
                    <motion.div
                        key="summary"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Total Card */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <div className="text-center space-y-2">
                                <p className="text-gray-500 font-medium">{t('ytd.total')}</p>
                                <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
                                    {formatAmount(ytdTotal)}
                                </h2>
                                <p className="text-xs text-gray-400">{t('ytd.note')}</p>
                            </div>
                        </div>

                        {/* Category Breakdown */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">{t('ytd.byCategory')}</h3>
                            <div className="space-y-3">
                                {categories.map((cat, index) => {
                                    const amount = categoryTotals[cat];
                                    const config = categoryConfig[cat];
                                    const Icon = config.icon as any;
                                    const percentage = ytdTotal > 0 ? (amount / ytdTotal) * 100 : 0;

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
                    </motion.div>
                ) : (
                    <motion.div
                        key="monthly"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* Monthly Breakdown */}
                        <h3 className="text-lg font-semibold text-gray-900">{t('ytd.monthlyBreakdown')}</h3>
                        <div className="space-y-3">
                            {monthlyBreakdown.map((item, index) => {
                                const isCurrentMonth = item.month - 1 === currentMonth;
                                const isPastMonth = item.month - 1 < currentMonth;
                                const maxMonthTotal = Math.max(...monthlyBreakdown.map(m => m.total), 1);
                                const barWidth = item.total > 0 ? (item.total / maxMonthTotal) * 100 : 0;

                                return (
                                    <motion.div
                                        key={item.month}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`bg-white rounded-2xl p-4 border transition-all ${isCurrentMonth
                                                ? 'border-blue-200 bg-blue-50/30'
                                                : 'border-gray-100'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900">
                                                    {getMonthName(item.month)}
                                                </span>
                                                {isCurrentMonth && (
                                                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                                                        {t('schedule.thisMonth')}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="font-bold text-gray-900">
                                                {formatAmount(item.total)}
                                            </span>
                                        </div>

                                        {/* Total Bar */}
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${barWidth}%` }}
                                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500"
                                            />
                                        </div>

                                        {/* Category Mini-Breakdown */}
                                        <div className="flex gap-2 flex-wrap">
                                            {categories.map(cat => {
                                                const catAmount = item.categories[cat];
                                                if (catAmount === 0) return null;
                                                const config = categoryConfig[cat];
                                                return (
                                                    <span
                                                        key={cat}
                                                        className="text-xs px-2 py-1 rounded-full"
                                                        style={{
                                                            backgroundColor: config.colors.bg,
                                                            color: config.colors.text
                                                        }}
                                                    >
                                                        {t(config.label as any)}: {formatAmount(catAmount)}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
