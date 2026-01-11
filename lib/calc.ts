import {
    isAfter,
    isBefore,
    isSameDay,
    startOfDay,
    parseISO,
    addDays
} from 'date-fns';
import { Subscription, Category, Currency } from './db';
import { FxRates, convertCurrency } from './fx';
import { getNextPaymentDate } from './billing';

/**
 * Calculate the monthly equivalent amount for a subscription
 * Yearly subscriptions are divided by 12
 */
export function monthlyEquivalentAmount(sub: Subscription): number {
    if (sub.billingCycle === 'YEARLY') {
        return sub.amount / 12;
    }
    return sub.amount;
}

/**
 * Calculate the monthly equivalent amount converted to display currency
 */
export function monthlyEquivalentAmountConverted(
    sub: Subscription,
    displayCurrency: Currency,
    fxRates: FxRates
): number {
    const monthlyAmount = monthlyEquivalentAmount(sub);
    return convertCurrency(monthlyAmount, sub.currency, displayCurrency, fxRates);
}

/**
 * Calculate the total monthly amount for all active subscriptions in display currency
 */
export function totalMonthlyAmount(
    subscriptions: Subscription[],
    displayCurrency: Currency,
    fxRates: FxRates
): number {
    return subscriptions
        .filter(sub => sub.isActive)
        .reduce((total, sub) => {
            return total + monthlyEquivalentAmountConverted(sub, displayCurrency, fxRates);
        }, 0);
}

/**
 * Calculate the yearly equivalent amount for a subscription
 */
export function yearlyEquivalentAmount(sub: Subscription): number {
    if (sub.billingCycle === 'MONTHLY') {
        return sub.amount * 12;
    }
    return sub.amount;
}

/**
 * Calculate the yearly equivalent amount converted to display currency
 */
export function yearlyEquivalentAmountConverted(
    sub: Subscription,
    displayCurrency: Currency,
    fxRates: FxRates
): number {
    const yearlyAmount = yearlyEquivalentAmount(sub);
    return convertCurrency(yearlyAmount, sub.currency, displayCurrency, fxRates);
}

/**
 * Calculate the total yearly amount for all active subscriptions in display currency
 */
export function totalYearlyAmount(
    subscriptions: Subscription[],
    displayCurrency: Currency,
    fxRates: FxRates
): number {
    return subscriptions
        .filter(sub => sub.isActive)
        .reduce((total, sub) => {
            return total + yearlyEquivalentAmountConverted(sub, displayCurrency, fxRates);
        }, 0);
}

/**
 * Get monthly totals grouped by category in display currency
 */
export function categoryMonthlyTotals(
    subscriptions: Subscription[],
    displayCurrency: Currency,
    fxRates: FxRates
): Record<Category, number> {
    const totals: Record<Category, number> = {
        AI: 0,
        ENTERTAIN: 0,
        MEMBERSHIP: 0,
        OTHER: 0
    };

    for (const sub of subscriptions) {
        if (sub.isActive) {
            totals[sub.category] += monthlyEquivalentAmountConverted(sub, displayCurrency, fxRates);
        }
    }

    return totals;
}

/**
 * Group subscriptions by category
 */
export function groupByCategory(subscriptions: Subscription[]): Record<Category, Subscription[]> {
    const groups: Record<Category, Subscription[]> = {
        AI: [],
        ENTERTAIN: [],
        MEMBERSHIP: [],
        OTHER: []
    };

    for (const sub of subscriptions) {
        groups[sub.category].push(sub);
    }

    return groups;
}

/**
 * Count active subscriptions
 */
export function countActiveSubscriptions(subscriptions: Subscription[]): number {
    return subscriptions.filter(sub => sub.isActive).length;
}

/**
 * Get category percentages of total spending
 */
export function categoryPercentages(
    subscriptions: Subscription[],
    displayCurrency: Currency,
    fxRates: FxRates
): Record<Category, number> {
    const totals = categoryMonthlyTotals(subscriptions, displayCurrency, fxRates);
    const total = totalMonthlyAmount(subscriptions, displayCurrency, fxRates);

    if (total === 0) {
        return { AI: 0, ENTERTAIN: 0, MEMBERSHIP: 0, OTHER: 0 };
    }

    return {
        AI: (totals.AI / total) * 100,
        ENTERTAIN: (totals.ENTERTAIN / total) * 100,
        MEMBERSHIP: (totals.MEMBERSHIP / total) * 100,
        OTHER: (totals.OTHER / total) * 100
    };
}

/**
 * Compute historical payment occurrences for a subscription within a date range
 * Respects createdAt and endedAt
 */
export function computeOccurrences(
    sub: Subscription,
    startRange: Date,
    endRange: Date
): Date[] {
    const createdAt = parseISO(sub.createdAt);
    const endedAt = sub.endedAt ? parseISO(sub.endedAt) : null;

    // Effective Start: Max(startRange, createdAt)
    const effectiveStart = isAfter(createdAt, startRange) ? startOfDay(createdAt) : startOfDay(startRange);

    // Effective End: Min(endRange, endedAt)
    let effectiveEnd = startOfDay(endRange);
    if (endedAt) {
        const endedAtStart = startOfDay(endedAt);
        if (isBefore(endedAtStart, effectiveEnd)) {
            effectiveEnd = endedAtStart;
        }
    }

    if (isAfter(effectiveStart, effectiveEnd)) {
        return [];
    }

    const occurrences: Date[] = [];

    // Find first payment date >= effectiveStart
    // We look for payment after (effectiveStart - 1 day)
    let currentDate = getNextPaymentDate(sub, addDays(effectiveStart, -1));

    // While current date is within range
    while (isBefore(currentDate, effectiveEnd) || isSameDay(currentDate, effectiveEnd)) {
        occurrences.push(currentDate);
        // Move to next payment
        currentDate = getNextPaymentDate(sub, currentDate);
    }

    return occurrences;
}

/**
 * Calculate Year-To-Date (YTD) total spend
 */
export function calculateYTD(
    subscriptions: Subscription[],
    displayCurrency: Currency,
    fxRates: FxRates
): number {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let total = 0;

    for (const sub of subscriptions) {
        const occurrences = computeOccurrences(sub, startOfYear, now);
        const convertedAmount = convertCurrency(sub.amount, sub.currency, displayCurrency, fxRates);
        total += occurrences.length * convertedAmount;
    }

    return total;
}

/**
 * Calculate YTD breakdown by category
 */
export function calculateYTDBreakdown(
    subscriptions: Subscription[],
    displayCurrency: Currency,
    fxRates: FxRates
): Record<Category, number> {
    const totals: Record<Category, number> = {
        AI: 0,
        ENTERTAIN: 0,
        MEMBERSHIP: 0,
        OTHER: 0
    };

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    for (const sub of subscriptions) {
        const occurrences = computeOccurrences(sub, startOfYear, now);
        const convertedAmount = convertCurrency(sub.amount, sub.currency, displayCurrency, fxRates);
        totals[sub.category] += occurrences.length * convertedAmount;
    }

    return totals;
}
