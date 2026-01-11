'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { isSameDay, isToday, startOfWeek, endOfWeek, isThisWeek, isThisMonth } from 'date-fns';
import { PaymentEvent } from '@/lib/billing';
import { formatCurrencyCompact, formatDateShort, formatDayOfWeek } from '@/lib/format';
import { categoryConfig } from '@/lib/theme';
import { useTranslation } from '@/lib/i18n';
import { useFx } from '@/lib/FxContext';
import { convertCurrency } from '@/lib/fx';
import { Sparkles, Tv, CreditCard, MoreHorizontal } from 'lucide-react';

const iconComponents = {
    Sparkles,
    Tv,
    CreditCard,
    MoreHorizontal,
};

interface ScheduleListProps {
    events: PaymentEvent[];
}

interface GroupedEvents {
    label: string;
    events: PaymentEvent[];
}

export function ScheduleList({ events }: ScheduleListProps) {
    const { t, language } = useTranslation();
    const { displayCurrency, fxRates } = useFx();

    // Group events by period
    const groupEvents = (): GroupedEvents[] => {
        const today: PaymentEvent[] = [];
        const thisWeek: PaymentEvent[] = [];
        const thisMonth: PaymentEvent[] = [];
        const later: PaymentEvent[] = [];

        for (const event of events) {
            if (isToday(event.date)) {
                today.push(event);
            } else if (isThisWeek(event.date, { weekStartsOn: language === 'ko' ? 1 : 0 })) {
                thisWeek.push(event);
            } else if (isThisMonth(event.date)) {
                thisMonth.push(event);
            } else {
                later.push(event);
            }
        }

        const groups: GroupedEvents[] = [];
        if (today.length > 0) groups.push({ label: t('schedule.today'), events: today });
        if (thisWeek.length > 0) groups.push({ label: t('schedule.thisWeek'), events: thisWeek });
        if (thisMonth.length > 0) groups.push({ label: t('schedule.thisMonth'), events: thisMonth });
        if (later.length > 0) groups.push({ label: t('schedule.later'), events: later });

        return groups;
    };

    const groups = groupEvents();

    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <CreditCard className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">{t('schedule.noEvents')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {groups.map((group, groupIndex) => (
                <motion.div
                    key={group.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: groupIndex * 0.1 }}
                >
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
                        {group.label}
                    </h3>
                    <div className="space-y-2">
                        {group.events.map((event, index) => {
                            const config = categoryConfig[event.category];
                            const Icon = iconComponents[config.icon as keyof typeof iconComponents];
                            const isEventToday = isToday(event.date);

                            const convertedAmount = convertCurrency(
                                event.amount,
                                event.currency,
                                displayCurrency,
                                fxRates
                            );
                            const isOriginalDifferent = event.currency !== displayCurrency;

                            return (
                                <motion.div
                                    key={`${event.subscriptionId}-${event.date.getTime()}`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className={`flex items-center justify-between p-4 rounded-xl ${isEventToday ? 'bg-blue-50 border border-blue-100' : 'bg-white border border-gray-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="flex items-center justify-center w-10 h-10 rounded-xl"
                                            style={{ backgroundColor: config.colors.bg }}
                                        >
                                            <Icon size={18} style={{ color: config.colors.icon }} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{event.name}</p>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <span>{formatDateShort(event.date, language)}</span>
                                                <span className="text-gray-300">•</span>
                                                <span>{formatDayOfWeek(event.date, language)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">
                                            {formatCurrencyCompact(convertedAmount, displayCurrency)}
                                        </p>
                                        <div className="flex flex-col items-end">
                                            {isOriginalDifferent && (
                                                <span className="text-xs text-gray-400">
                                                    {formatCurrencyCompact(event.amount, event.currency)}
                                                </span>
                                            )}
                                            <span
                                                className="text-xs font-medium"
                                                style={{ color: config.colors.text }}
                                            >
                                                {event.billingCycle === 'MONTHLY' ? '/mo' : '/yr'}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
