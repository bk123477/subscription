'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { enUS, ko } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n';

const locales = { en: enUS, ko };

export function TodayDate() {
    const { t, language } = useTranslation();
    const [currentDate, setCurrentDate] = useState(new Date());

    // Update date at midnight
    useEffect(() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const msUntilMidnight = tomorrow.getTime() - now.getTime();

        const timeout = setTimeout(() => {
            setCurrentDate(new Date());
        }, msUntilMidnight);

        return () => clearTimeout(timeout);
    }, [currentDate]);

    const formattedDate = language === 'ko'
        ? format(currentDate, 'yyyy년 M월 d일', { locale: locales[language] })
        : format(currentDate, 'MMM d, yyyy', { locale: locales[language] });

    return (
        <span className="text-xs text-gray-500">
            {t('home.todayLabel')}: {formattedDate}
        </span>
    );
}
