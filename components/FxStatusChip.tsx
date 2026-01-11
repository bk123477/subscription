'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useFx } from '@/lib/FxContext';
import { formatFxUpdateTime } from '@/lib/format';
import { Button } from '@/components/ui/button';

export function FxStatusChip() {
    const { t, language } = useTranslation();
    const { fxRates, isLoading, refresh, canRefresh, cooldownSeconds } = useFx();
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const rateDisplay = Math.round(fxRates.usdToKrw).toLocaleString();
    const updatedTime = formatFxUpdateTime(fxRates.lastUpdated, language);

    if (fxRates.isFallback) {
        return (
            <button
                onClick={() => setIsSheetOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium"
            >
                <TrendingUp size={12} />
                {t('fx.unavailable')}
            </button>
        );
    }

    return (
        <>
            <button
                onClick={() => setIsSheetOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
            >
                <TrendingUp size={12} />
                <span>1$ = ₩{rateDisplay}</span>
            </button>

            {/* FX Details Sheet */}
            <AnimatePresence>
                {isSheetOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
                        onClick={(e) => e.target === e.currentTarget && setIsSheetOpen(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="w-full max-w-lg bg-white rounded-t-3xl"
                            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {t('fx.status')}
                                </h2>
                                <button
                                    onClick={() => setIsSheetOpen(false)}
                                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {/* Current Rate */}
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-gray-900">
                                        1 USD = ₩{rateDisplay}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-2">
                                        {fxRates.isStale ? '⚠️ ' : ''}
                                        {t('fx.updated').replace('{date}', updatedTime)}
                                    </p>
                                </div>

                                {/* Source */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-sm text-gray-600">
                                        {t('fx.source').replace('{source}', fxRates.source)}
                                    </p>
                                    {fxRates.isFallback && (
                                        <p className="text-xs text-amber-600 mt-1">
                                            {t('fx.showingOriginal')}
                                        </p>
                                    )}
                                </div>

                                {/* Refresh Button */}
                                <Button
                                    onClick={() => {
                                        refresh();
                                    }}
                                    disabled={!canRefresh || isLoading}
                                    className="w-full gap-2"
                                    variant={canRefresh ? 'default' : 'secondary'}
                                >
                                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                                    {isLoading
                                        ? t('fx.refreshing')
                                        : canRefresh
                                            ? t('fx.refresh')
                                            : t('fx.cooldown').replace('{seconds}', cooldownSeconds.toString())
                                    }
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
