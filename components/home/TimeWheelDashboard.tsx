'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Category, Subscription } from '@/lib/db';
import { categoryConfig } from '@/lib/theme';
import { formatCurrencyCompact, formatDateShort } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';
import { useFx } from '@/lib/FxContext';
import { generateUpcomingEvents } from '@/lib/billing';
import { monthlyEquivalentAmountConverted } from '@/lib/calc';
import { Modal } from '@/components/ui/Modal';

// Extended payment event with full subscription
interface ExtendedPaymentEvent {
    subscription: Subscription;
    date: Date;
}

interface TimeWheelDashboardProps {
    subscriptions: Subscription[];
    totalMonthly: number;
    onCategoryClick?: (category: Category) => void;
}

export function TimeWheelDashboard({
    subscriptions,
    totalMonthly,
    onCategoryClick
}: TimeWheelDashboardProps) {
    const { t, language } = useTranslation();
    const { displayCurrency, fxRates } = useFx();
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    // Get upcoming events for next 30 days with full subscription data
    const events = useMemo(() => {
        const today = new Date();
        const activeSubscriptions = subscriptions.filter(s => s.isActive);
        const rawEvents = generateUpcomingEvents(activeSubscriptions, 30, today);

        // Join with subscription data
        const subMap = new Map(subscriptions.map(s => [s.id, s]));
        return rawEvents
            .map(event => {
                const sub = subMap.get(event.subscriptionId);
                if (!sub) return null;
                return {
                    subscription: sub,
                    date: event.date
                } as ExtendedPaymentEvent;
            })
            .filter((e): e is ExtendedPaymentEvent => e !== null);
    }, [subscriptions]);

    // Group events by day of month
    const eventsByDay = useMemo(() => {
        const byDay: Record<number, ExtendedPaymentEvent[]> = {};
        events.forEach(event => {
            const day = event.date.getDate();
            if (!byDay[day]) byDay[day] = [];
            byDay[day].push(event);
        });
        return byDay;
    }, [events]);

    // Wheel parameters
    const size = 240;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 90;

    // Generate day markers (1-31)
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const today = new Date().getDate();

    const selectedEvents = selectedDay ? eventsByDay[selectedDay] || [] : [];
    const modalTitle = selectedDay
        ? (language === 'ko' ? `${selectedDay}일` : `Day ${selectedDay}`)
        : '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="px-4"
        >
            {/* Time Wheel */}
            <div
                className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center"
                style={{ touchAction: 'pan-y' }}
            >
                <svg width={size} height={size} className="overflow-visible">
                    {/* Outer ring */}
                    <circle
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill="none"
                        stroke="#F3F4F6"
                        strokeWidth="20"
                    />

                    {/* Day tick marks and dots */}
                    {days.map((day) => {
                        const angle = ((day - 1) / 31) * 360 - 90;
                        const rad = (angle * Math.PI) / 180;
                        const labelX = cx + (radius + 18) * Math.cos(rad);
                        const labelY = cy + (radius + 18) * Math.sin(rad);

                        const dayEvents = eventsByDay[day] || [];
                        const hasEvents = dayEvents.length > 0;
                        const isToday = day === today;

                        // Get primary category color for this day
                        const primaryCategory = dayEvents[0]?.subscription.category;
                        const dotColor = primaryCategory
                            ? categoryConfig[primaryCategory].colors.icon
                            : '#D1D5DB';

                        return (
                            <g key={day}>
                                {/* Tick mark */}
                                <line
                                    x1={cx + (radius - 10) * Math.cos(rad)}
                                    y1={cy + (radius - 10) * Math.sin(rad)}
                                    x2={cx + radius * Math.cos(rad)}
                                    y2={cy + radius * Math.sin(rad)}
                                    stroke={isToday ? '#3B82F6' : '#E5E7EB'}
                                    strokeWidth={isToday ? 2 : 1}
                                />

                                {/* Day label (every 5th day + 1) */}
                                {(day === 1 || day % 5 === 0) && (
                                    <text
                                        x={labelX}
                                        y={labelY}
                                        fontSize="9"
                                        fill={isToday ? '#3B82F6' : '#9CA3AF'}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                    >
                                        {day}
                                    </text>
                                )}

                                {/* Event dot */}
                                {hasEvents && (
                                    <motion.circle
                                        cx={cx + radius * Math.cos(rad)}
                                        cy={cy + radius * Math.sin(rad)}
                                        r={3 + Math.min(dayEvents.length, 3) * 1.5}
                                        fill={dotColor}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: day * 0.015 }}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setSelectedDay(day)}
                                    />
                                )}
                            </g>
                        );
                    })}

                    {/* Center */}
                    <circle cx={cx} cy={cy} r={45} fill="#F9FAFB" />
                    <text
                        x={cx}
                        y={cy - 6}
                        fontSize="11"
                        fill="#6B7280"
                        textAnchor="middle"
                    >
                        {t('home.monthlyTotal')}
                    </text>
                    <text
                        x={cx}
                        y={cy + 10}
                        fontSize="16"
                        fontWeight="bold"
                        fill="#111827"
                        textAnchor="middle"
                    >
                        {formatCurrencyCompact(totalMonthly, displayCurrency)}
                    </text>
                </svg>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                    {(['AI', 'ENTERTAIN', 'MEMBERSHIP', 'OTHER'] as Category[]).map((cat) => {
                        const config = categoryConfig[cat];
                        return (
                            <div key={cat} className="flex items-center gap-1">
                                <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: config.colors.icon }}
                                />
                                <span className="text-xs text-gray-500">{t(config.label as any)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Day Events Modal */}
            <Modal
                isOpen={selectedDay !== null}
                onClose={() => setSelectedDay(null)}
                title={modalTitle}
            >
                <div className="p-4 space-y-3">
                    {selectedEvents.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">{t('schedule.noEvents')}</p>
                    ) : (
                        selectedEvents.map((event, i) => {
                            const config = categoryConfig[event.subscription.category];
                            const convertedAmount = monthlyEquivalentAmountConverted(
                                event.subscription,
                                displayCurrency,
                                fxRates
                            );
                            const needsConversion = event.subscription.currency !== displayCurrency;

                            return (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 p-3 rounded-xl"
                                    style={{ backgroundColor: config.colors.bg }}
                                >
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: config.colors.icon }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">
                                            {event.subscription.name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {t(config.label as any)}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-semibold text-gray-900">
                                            {formatCurrencyCompact(convertedAmount, displayCurrency)}
                                        </p>
                                        {needsConversion && (
                                            <p className="text-xs text-gray-400">
                                                {formatCurrencyCompact(event.subscription.amount, event.subscription.currency)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </Modal>
        </motion.div>
    );
}
