'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { List, CalendarDays } from 'lucide-react';
import { db } from '@/lib/db';
import { generateUpcomingEvents, PaymentEvent } from '@/lib/billing';
import { useTranslation } from '@/lib/i18n';
import { ScheduleList } from '@/components/ScheduleList';
import { CalendarView } from '@/components/CalendarView';
import { DayEventsSheet } from '@/components/DayEventsSheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ViewMode = 'list' | 'calendar';

export default function SchedulePage() {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [dayEvents, setDayEvents] = useState<PaymentEvent[]>([]);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Live query for subscriptions
    const subscriptions = useLiveQuery(
        () => db.subscriptions.toArray(),
        [],
        []
    );

    // Live query for settings
    const settings = useLiveQuery(
        () => db.settings.get(1),
        [],
        { horizonDays: 60 }
    );

    // Generate upcoming events
    const events = useMemo(() => {
        if (!subscriptions || subscriptions.length === 0) return [];
        const activeSubscriptions = subscriptions.filter(s => s.isActive);
        return generateUpcomingEvents(
            activeSubscriptions,
            settings?.horizonDays || 60,
            new Date()
        );
    }, [subscriptions, settings?.horizonDays]);

    const handleDayClick = (date: Date, events: PaymentEvent[]) => {
        setSelectedDay(date);
        setDayEvents(events);
        setIsSheetOpen(true);
    };

    const handleCloseSheet = () => {
        setIsSheetOpen(false);
        setSelectedDay(null);
        setDayEvents([]);
    };

    return (
        <div className="px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">
                    {t('schedule.upcomingPayments')}
                </h1>
            </div>

            {/* View Toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-gray-100 rounded-xl">
                    <TabsTrigger
                        value="list"
                        className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                        <List size={16} />
                        {t('schedule.listView')}
                    </TabsTrigger>
                    <TabsTrigger
                        value="calendar"
                        className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                        <CalendarDays size={16} />
                        {t('schedule.calendarView')}
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Content */}
            <motion.div
                key={viewMode}
                initial={{ opacity: 0, x: viewMode === 'list' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
            >
                {viewMode === 'list' ? (
                    <ScheduleList events={events} />
                ) : (
                    <CalendarView events={events} onDayClick={handleDayClick} />
                )}
            </motion.div>

            {/* Day Events Sheet */}
            <DayEventsSheet
                isOpen={isSheetOpen}
                onClose={handleCloseSheet}
                date={selectedDay}
                events={dayEvents}
            />
        </div>
    );
}
