'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getFxRates, manualRefreshFxRates, canManualRefresh, getManualRefreshCooldown, FxRates, getDisplayCurrency } from '@/lib/fx';
import { Currency } from '@/lib/db';
import { useTranslation } from '@/lib/i18n';

interface FxContextType {
    fxRates: FxRates;
    displayCurrency: Currency;
    isLoading: boolean;
    refresh: () => Promise<void>;
    canRefresh: boolean;
    cooldownSeconds: number;
}

const defaultFxRates: FxRates = {
    usdToKrw: 1300,
    krwToUsd: 1 / 1300,
    lastUpdated: new Date(),
    source: 'Fallback',
    isStale: false,
    isFallback: true
};

const FxContext = createContext<FxContextType>({
    fxRates: defaultFxRates,
    displayCurrency: 'USD',
    isLoading: true,
    refresh: async () => { },
    canRefresh: false,
    cooldownSeconds: 0
});

export function FxProvider({ children }: { children: ReactNode }) {
    const { language } = useTranslation();
    const [fxRates, setFxRates] = useState<FxRates>(defaultFxRates);
    const [isLoading, setIsLoading] = useState(true);
    const [canRefreshState, setCanRefreshState] = useState(true);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);

    // Display currency based on language
    const displayCurrency = getDisplayCurrency(language);

    // Load FX rates on mount
    useEffect(() => {
        let mounted = true;

        const loadRates = async () => {
            try {
                const rates = await getFxRates();
                if (mounted) {
                    setFxRates(rates);
                }
            } catch (error) {
                console.error('Failed to load FX rates:', error);
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        loadRates();

        return () => {
            mounted = false;
        };
    }, []);

    // Update cooldown timer
    useEffect(() => {
        const interval = setInterval(() => {
            setCanRefreshState(canManualRefresh());
            setCooldownSeconds(getManualRefreshCooldown());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const refresh = useCallback(async () => {
        if (!canManualRefresh()) return;

        setIsLoading(true);
        try {
            const rates = await manualRefreshFxRates();
            if (rates) {
                setFxRates(rates);
            }
        } catch (error) {
            console.error('Failed to refresh FX rates:', error);
        } finally {
            setIsLoading(false);
            setCanRefreshState(false);
            setCooldownSeconds(getManualRefreshCooldown());
        }
    }, []);

    return (
        <FxContext.Provider value={{
            fxRates,
            displayCurrency,
            isLoading,
            refresh,
            canRefresh: canRefreshState,
            cooldownSeconds
        }}>
            {children}
        </FxContext.Provider>
    );
}

export function useFx() {
    const context = useContext(FxContext);
    if (!context) {
        throw new Error('useFx must be used within FxProvider');
    }
    return context;
}
