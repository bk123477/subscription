'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { PaymentEvent } from '@/lib/billing';
import { formatCurrency, formatDateMedium, formatDayOfWeek } from '@/lib/format';
import { categoryConfig } from '@/lib/theme';
import { useTranslation } from '@/lib/i18n';
import { Sparkles, Tv, CreditCard, MoreHorizontal } from 'lucide-react';

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

    const totalAmount = events.reduce((sum, e) => sum + e.amount, 0);

    return (
        <AnimatePresence>
            {isOpen && date && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="w-full max-w-lg bg-white rounded-t-3xl max-h-[70vh] overflow-auto"
                        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-100 bg-white">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {formatDateMedium(date, language)}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {events.length} {t('common.payments')} · {formatCurrency(totalAmount)}
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
                                                {formatCurrency(event.amount)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {event.billingCycle === 'MONTHLY' ? t('form.monthly') : t('form.yearly')}
                                            </p>
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
