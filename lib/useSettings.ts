'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import { db, Settings, DashboardMode, updateSettings, initializeSettings } from './db';

// Default settings for SSR/initial render
const defaultSettings: Settings = {
    id: 1,
    defaultCurrency: 'USD',
    horizonDays: 60,
    firstDayOfWeek: 0,
    theme: 'pastel',
    language: 'en',
    homeDashboardMode: 'MINIMAL_KPI'
};

export function useSettings() {
    // Live query for reactive settings updates
    const settings = useLiveQuery(
        async () => {
            const s = await db.settings.get(1);
            if (!s) {
                return initializeSettings();
            }
            // Ensure homeDashboardMode exists
            if (!s.homeDashboardMode) {
                return { ...s, homeDashboardMode: 'MINIMAL_KPI' as DashboardMode };
            }
            return s;
        },
        [],
        defaultSettings
    );

    const updateSetting = useCallback(async <K extends keyof Omit<Settings, 'id'>>(
        key: K,
        value: Settings[K]
    ) => {
        await updateSettings({ [key]: value });
    }, []);

    const setDashboardMode = useCallback(async (mode: DashboardMode) => {
        await updateSettings({ homeDashboardMode: mode });
    }, []);

    return {
        settings,
        updateSetting,
        setDashboardMode,
        dashboardMode: settings.homeDashboardMode
    };
}
