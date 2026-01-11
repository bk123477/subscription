import { db, getFxRateCache, setFxRateCache, Currency } from './db';

// Frankfurter API for FX rates (free, no API key required)
const FRANKFURTER_API = 'https://api.frankfurter.app';

// Rate limit: at most 2 fetches per day (every 12 hours minimum)
const MIN_REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours

// Manual refresh cooldown
const MANUAL_REFRESH_COOLDOWN_MS = 30 * 1000; // 30 seconds

let lastManualRefreshTime = 0;

export interface FxRates {
    usdToKrw: number;
    krwToUsd: number;
    lastUpdated: Date;
    source: string;
    isStale: boolean;
    isFallback: boolean;
}

/**
 * Fetch latest FX rates from Frankfurter API
 */
async function fetchFxRatesFromAPI(): Promise<{ usdToKrw: number; krwToUsd: number } | null> {
    try {
        // Frankfurter doesn't directly support KRW, so we'll use a workaround
        // We'll fetch USD to common currencies and calculate
        // Actually, Frankfurter DOES support KRW
        const response = await fetch(`${FRANKFURTER_API}/latest?from=USD&to=KRW`);

        if (!response.ok) {
            console.error('FX API error:', response.status);
            return null;
        }

        const data = await response.json();
        const usdToKrw = data.rates?.KRW;

        if (!usdToKrw) {
            console.error('KRW rate not found in response');
            return null;
        }

        return {
            usdToKrw,
            krwToUsd: 1 / usdToKrw
        };
    } catch (error) {
        console.error('Failed to fetch FX rates:', error);
        return null;
    }
}

/**
 * Get FX rates, fetching from API if needed
 */
export async function getFxRates(forceRefresh = false): Promise<FxRates> {
    const cached = await getFxRateCache();
    const now = new Date();

    // Check if we have valid cached rates
    if (cached && !forceRefresh) {
        const lastUpdated = new Date(cached.lastUpdated);
        const age = now.getTime() - lastUpdated.getTime();

        // If cache is fresh enough, use it
        if (age < MIN_REFRESH_INTERVAL_MS) {
            return {
                usdToKrw: cached.usdToKrw,
                krwToUsd: cached.krwToUsd,
                lastUpdated,
                source: cached.source,
                isStale: false,
                isFallback: false
            };
        }
    }

    // Try to fetch new rates
    const freshRates = await fetchFxRatesFromAPI();

    if (freshRates) {
        // Save to cache
        const cacheData = {
            usdToKrw: freshRates.usdToKrw,
            krwToUsd: freshRates.krwToUsd,
            lastUpdated: now.toISOString(),
            source: 'Frankfurter API'
        };
        await setFxRateCache(cacheData);

        return {
            ...freshRates,
            lastUpdated: now,
            source: 'Frankfurter API',
            isStale: false,
            isFallback: false
        };
    }

    // If fetch failed but we have cached rates, use them (stale)
    if (cached) {
        return {
            usdToKrw: cached.usdToKrw,
            krwToUsd: cached.krwToUsd,
            lastUpdated: new Date(cached.lastUpdated),
            source: cached.source,
            isStale: true,
            isFallback: false
        };
    }

    // No cached rates, use fallback
    // Fallback rate: approximately 1300 KRW per USD (rough estimate)
    return {
        usdToKrw: 1300,
        krwToUsd: 1 / 1300,
        lastUpdated: now,
        source: 'Fallback',
        isStale: false,
        isFallback: true
    };
}

/**
 * Check if manual refresh is allowed (rate limited)
 */
export function canManualRefresh(): boolean {
    const now = Date.now();
    return now - lastManualRefreshTime > MANUAL_REFRESH_COOLDOWN_MS;
}

/**
 * Get remaining cooldown seconds for manual refresh
 */
export function getManualRefreshCooldown(): number {
    const now = Date.now();
    const elapsed = now - lastManualRefreshTime;
    const remaining = MANUAL_REFRESH_COOLDOWN_MS - elapsed;
    return Math.max(0, Math.ceil(remaining / 1000));
}

/**
 * Manually refresh FX rates
 */
export async function manualRefreshFxRates(): Promise<FxRates | null> {
    if (!canManualRefresh()) {
        return null;
    }

    lastManualRefreshTime = Date.now();
    return getFxRates(true);
}

/**
 * Convert amount between currencies
 */
export function convertCurrency(
    amount: number,
    fromCurrency: Currency,
    toCurrency: Currency,
    rates: FxRates
): number {
    if (fromCurrency === toCurrency) {
        return amount;
    }

    if (fromCurrency === 'USD' && toCurrency === 'KRW') {
        return amount * rates.usdToKrw;
    }

    if (fromCurrency === 'KRW' && toCurrency === 'USD') {
        return amount * rates.krwToUsd;
    }

    return amount;
}

/**
 * Get display currency based on language
 */
export function getDisplayCurrency(language: 'en' | 'ko'): Currency {
    return language === 'ko' ? 'KRW' : 'USD';
}
