'use client';

import { useMemo } from 'react';
import { Subscription } from '@/lib/db';
import { useTranslation } from '@/lib/i18n';
import { useFx } from '@/lib/FxContext';
import { formatCurrencyCompact, formatDateShort } from '@/lib/format';
import { generateUpcomingEvents } from '@/lib/billing';
import { monthlyEquivalentAmountConverted } from '@/lib/calc';
import { TodayDate } from '@/components/TodayDate';
import { FxStatusChip } from '@/components/FxStatusChip';

interface HomeHeaderSummaryProps {
    subscriptions: Subscription[];
    totalMonthly: number;
}

interface NextPaymentItem {
    subscription: Subscription;
    date: Date;
    convertedAmount: number;
}

export function HomeHeaderSummary({ subscriptions, totalMonthly }: HomeHeaderSummaryProps) {
    const { t, language } = useTranslation();
    const { displayCurrency, fxRates } = useFx();

    // Find all payments on the next payment date
    const nextPayments = useMemo(() => {
        const today = new Date();
        const activeSubscriptions = subscriptions.filter(s => s.isActive);
        const events = generateUpcomingEvents(activeSubscriptions, 30, today);

        if (events.length === 0) return [];

        // Get the first payment date
        const firstDate = events[0].date;
        const firstDateStr = firstDate.toDateString();

        // Find all payments on the same day
        const sameDayEvents = events.filter(e => e.date.toDateString() === firstDateStr);

        return sameDayEvents.map(event => {
            const sub = subscriptions.find(s => s.id === event.subscriptionId);
            if (!sub) return null;

            return {
                subscription: sub,
                date: event.date,
                convertedAmount: monthlyEquivalentAmountConverted(sub, displayCurrency, fxRates),
            };
        }).filter((item): item is NextPaymentItem => item !== null);
    }, [subscriptions, displayCurrency, fxRates]);

    // Calculate total for same-day payments
    const totalNextPayments = useMemo(() => {
        return nextPayments.reduce((sum, p) => sum + p.convertedAmount, 0);
    }, [nextPayments]);

    return (
        <div className="space-y-3 px-4">
            {/* Row 1: Today + Monthly Total */}
            <div
                className="rounded-2xl p-4 shadow-sm"
                style={{
                    background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
                }}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600">{t('home.monthlyTotal')}</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {formatCurrencyCompact(totalMonthly, displayCurrency)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {subscriptions.filter(s => s.isActive).length} {t('home.activeSubscriptions')}
                        </p>
                    </div>
                    <FxStatusChip />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                    <TodayDate />
                </div>
            </div>

            {/* Row 2: Next Payment(s) */}
            <div
                className="rounded-2xl p-4 shadow-sm"
                style={{
                    background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                }}
            >
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">{t('home.nextPayment')}</p>
                    {nextPayments.length > 0 && (
                        <p className="text-xs text-gray-500">
                            {formatDateShort(nextPayments[0].date, language)}
                        </p>
                    )}
                </div>

                {nextPayments.length > 0 ? (
                    <div className="space-y-2">
                        {/* List of payments */}
                        {nextPayments.map((payment, index) => (
                            <div key={payment.subscription.id} className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate text-sm">
                                        {payment.subscription.name}
                                    </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="font-semibold text-gray-900 text-sm">
                                        {formatCurrencyCompact(payment.convertedAmount, displayCurrency)}
                                    </p>
                                    {payment.subscription.currency !== displayCurrency && (
                                        <p className="text-xs text-gray-500">
                                            {formatCurrencyCompact(payment.subscription.amount, payment.subscription.currency)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Total if multiple payments */}
                        {nextPayments.length > 1 && (
                            <div className="flex items-center justify-between gap-3 pt-2 border-t border-amber-300/50">
                                <p className="text-sm font-medium text-gray-700">
                                    {t('common.total')} ({nextPayments.length})
                                </p>
                                <p className="font-bold text-gray-900">
                                    {formatCurrencyCompact(totalNextPayments, displayCurrency)}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-gray-500">{t('home.noUpcomingPayments')}</p>
                )}
            </div>
        </div>
    );
}
