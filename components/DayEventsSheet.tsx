'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Tv, CreditCard, MoreHorizontal } from 'lucide-react';
import { useEffect } from 'react';
import { PaymentEvent } from '@/lib/billing';
import { formatCurrencyCompact, formatDateMedium } from '@/lib/format';
import { categoryConfig } from '@/lib/theme';
import { useTranslation } from '@/lib/i18n';
import { useFx } from '@/lib/FxContext';
import { convertCurrency } from '@/lib/fx';
import { useScrollLock } from '@/lib/useScrollLock';

const iconComponents = {
    Sparkles,
    Tv,
    CreditCard,
    MoreHorizontal,
};

interface DayEventsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date | null;
    events: PaymentEvent[];
}

export function DayEventsSheet({ isOpen, onClose, date, events }: DayEventsSheetProps) {
    const { t, language } = useTranslation();
    const { displayCurrency, fxRates } = useFx();
    const { lockScroll, unlockScroll } = useScrollLock();

    useEffect(() => {
        if (isOpen) {
            lockScroll();
        } else {
            unlockScroll();
        }
    }, [isOpen, lockScroll, unlockScroll]);

    const totalAmount = events.reduce((sum, e) => {
        return sum + convertCurrency(e.amount, e.currency, displayCurrency, fxRates);
    }, 0);

    return (
        <AnimatePresence>
            {isOpen && date && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm"
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="w-full max-w-lg bg-white rounded-t-3xl max-h-[70vh] sheet-scroll"
                        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-100 bg-white">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {formatDateMedium(date, language)}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {events.length} {t('common.payments')} · {formatCurrencyCompact(totalAmount, displayCurrency)}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Events list */}
                        <div className="p-4 space-y-3">
                            {events.map((event, index) => {
                                const config = categoryConfig[event.category];
                                const Icon = iconComponents[config.icon as keyof typeof iconComponents];

                                const convertedAmount = convertCurrency(
                                    event.amount,
                                    event.currency,
                                    displayCurrency,
                                    fxRates
                                );
                                const isOriginalDifferent = event.currency !== displayCurrency;

                                return (
                                    <motion.div
                                        key={`${event.subscriptionId}-${index}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex items-center justify-between p-4 rounded-xl bg-gray-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="flex items-center justify-center w-12 h-12 rounded-xl"
                                                style={{ backgroundColor: config.colors.bg }}
                                            >
                                                <Icon size={22} style={{ color: config.colors.icon }} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{event.name}</p>
                                                <span
                                                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                                                    style={{
                                                        backgroundColor: config.colors.bg,
                                                        color: config.colors.text,
                                                    }}
                                                >
                                                    {t(categoryConfig[event.category].label as any)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-900">
                                                {event.amount === 0 ? 'Free' : formatCurrencyCompact(convertedAmount, displayCurrency)}
                                            </p>
                                            <div className="flex flex-col items-end">
                                                {isOriginalDifferent && (
                                                    <span className="text-xs text-gray-400">
                                                        {formatCurrencyCompact(event.amount, event.currency)}
                                                    </span>
                                                )}
                                                <p className="text-xs text-gray-500">
                                                    {event.billingCycle === 'MONTHLY' ? t('form.monthly') : t('form.yearly')}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
