'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    format,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaymentEvent } from '@/lib/billing';
import { useTranslation } from '@/lib/i18n';
import { categoryConfig } from '@/lib/theme';
import { formatCurrencyCompact, getDateLocale } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { useFx } from '@/lib/FxContext';
import { convertCurrency } from '@/lib/fx';
import { MonthPickerModal } from '@/components/MonthPickerModal';

interface CalendarViewProps {
    events: PaymentEvent[];
    onDayClick: (date: Date, events: PaymentEvent[]) => void;
}

export function CalendarView({ events, onDayClick }: CalendarViewProps) {
    const { t, language } = useTranslation();
    const { displayCurrency, fxRates } = useFx();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

    const weekStartsOn = language === 'ko' ? 1 : 0;

    // Get days to display
    const days = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });

        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }, [currentMonth, weekStartsOn]);

    // Create a map of events by date
    const eventsByDate = useMemo(() => {
        const map = new Map<string, PaymentEvent[]>();
        for (const event of events) {
            const key = format(event.date, 'yyyy-MM-dd');
            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key)!.push(event);
        }
        return map;
    }, [events]);

    const getEventsForDay = (date: Date): PaymentEvent[] => {
        return eventsByDate.get(format(date, 'yyyy-MM-dd')) || [];
    };

    const weekDays = useMemo(() => {
        if (language === 'ko') {
            return ['월', '화', '수', '목', '금', '토', '일'];
        }
        return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    }, [language]);

    // Adjust weekDays based on weekStartsOn
    const adjustedWeekDays = language === 'ko' ? weekDays : weekDays;

    return (
        <div className="space-y-4">
            {/* Month navigation */}
            <div className="flex items-center justify-between px-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                    <ChevronLeft size={20} />
                </Button>

                <h2
                    onClick={() => setIsMonthPickerOpen(true)}
                    className="text-lg font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 px-3 py-1 rounded-full transition-colors active:scale-95"
                >
                    {format(currentMonth, 'MMMM yyyy', { locale: getDateLocale(language) })}
                </h2>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                    <ChevronRight size={20} />
                </Button>
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1">
                {adjustedWeekDays.map((day, index) => (
                    <div
                        key={index}
                        className="text-center text-xs font-medium text-gray-500 py-2"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                    const dayEvents = getEventsForDay(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isCurrentDay = isToday(day);
                    const hasEvents = dayEvents.length > 0;

                    // Get unique categories for this day
                    const categories = [...new Set(dayEvents.map((e) => e.category))];
                    const totalAmount = dayEvents.reduce((sum, e) => {
                        return sum + convertCurrency(e.amount, e.currency, displayCurrency, fxRates);
                    }, 0);

                    return (
                        <motion.button
                            key={index}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => hasEvents && onDayClick(day, dayEvents)}
                            className={`
                relative min-h-[72px] p-1 rounded-xl transition-colors
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                ${hasEvents ? 'hover:bg-gray-100 cursor-pointer' : 'cursor-default'}
                ${isCurrentDay ? 'ring-2 ring-blue-400' : ''}
              `}
                        >
                            <span
                                className={`
                  text-sm font-medium
                  ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                  ${isCurrentDay ? 'text-blue-600' : ''}
                `}
                            >
                                {format(day, 'd')}
                            </span>

                            {hasEvents && (
                                <div className="mt-1 space-y-0.5">
                                    {/* Category dots */}
                                    <div className="flex justify-center gap-0.5">
                                        {categories.slice(0, 3).map((cat, i) => (
                                            <div
                                                key={i}
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{ backgroundColor: categoryConfig[cat].colors.icon }}
                                            />
                                        ))}
                                    </div>
                                    {/* Event count or amount */}
                                    <div className="text-[10px] text-center text-gray-600 font-medium truncate px-0.5">
                                        {dayEvents.length > 1
                                            ? `${dayEvents.length}`
                                            : formatCurrencyCompact(totalAmount, displayCurrency)}
                                    </div>
                                </div>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            <MonthPickerModal
                isOpen={isMonthPickerOpen}
                onClose={() => setIsMonthPickerOpen(false)}
                currentDate={currentMonth}
                onSelect={setCurrentMonth}
            />
        </div>
    );
}

