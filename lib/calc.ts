import {
    isAfter,
    isBefore,
    isSameDay,
    startOfDay,
    startOfMonth,
    endOfMonth,
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
 * Excludes subscriptions currently in free trial
 */
export function totalMonthlyAmount(
    subscriptions: Subscription[],
    displayCurrency: Currency,
    fxRates: FxRates
): number {
    const now = startOfDay(new Date());

    return subscriptions
        .filter(sub => sub.isActive)
        .reduce((total, sub) => {
            // Check if currently in free trial
            if (sub.freeUntil) {
                const freeUntil = startOfDay(parseISO(sub.freeUntil));
                // If now is before or same as freeUntil, it's free
                if (!isAfter(now, freeUntil)) {
                    return total;
                }
            }
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
    // Note: This is an annualized run rate, so we typically include all active subs
    // regardless of temporary free trial status, or we could apply the same logic.
    // Given the user asked for "Monthly Average" specifically, we'll keep this as run-rate for now
    // unless requested otherwise, but to be consistent with "Current Spending", let's apply the rule.

    // Actually, Annualized Run Rate usually implies "What is the value of my subscriptions".
    // "Monthly Average" implies "What is my cash outflow".
    // I will leave this alone for now as the user only asked about Home Screen Monthly Average.
    return subscriptions
        .filter(sub => sub.isActive)
        .reduce((total, sub) => {
            return total + yearlyEquivalentAmountConverted(sub, displayCurrency, fxRates);
        }, 0);
}

/**
 * Get monthly totals grouped by category in display currency
 * Excludes subscriptions currently in free trial
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

    const now = startOfDay(new Date());

    for (const sub of subscriptions) {
        if (sub.isActive) {
            // Check if currently in free trial
            if (sub.freeUntil) {
                const freeUntil = startOfDay(parseISO(sub.freeUntil));
                if (!isAfter(now, freeUntil)) {
                    continue;
                }
            }
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
 * Respects startedAt (or createdAt as fallback) and endedAt
 */
export function computeOccurrences(
    sub: Subscription,
    startRange: Date,
    endRange: Date
): Date[] {
    // Use startedAt if set, otherwise fall back to createdAt
    const subscriptionStart = sub.startedAt ? parseISO(sub.startedAt) : parseISO(sub.createdAt);
    const endedAt = sub.endedAt ? parseISO(sub.endedAt) : null;

    // Effective Start: Max(startRange, subscriptionStart)
    const effectiveStart = isAfter(subscriptionStart, startRange) ? startOfDay(subscriptionStart) : startOfDay(startRange);

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

        // Calculate total for this sub, accounting for free trial
        let subTotal = 0;
        const convertedMonthly = convertCurrency(sub.amount, sub.currency, displayCurrency, fxRates);
        const freeUntilDate = sub.freeUntil ? startOfDay(parseISO(sub.freeUntil)) : null;

        for (const date of occurrences) {
            if (freeUntilDate && isBefore(date, freeUntilDate)) {
                continue; // It's free
            }
            subTotal += convertedMonthly;
        }

        total += subTotal;
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
        const convertedMonthly = convertCurrency(sub.amount, sub.currency, displayCurrency, fxRates);
        const freeUntilDate = sub.freeUntil ? startOfDay(parseISO(sub.freeUntil)) : null;

        let subTotal = 0;
        for (const date of occurrences) {
            if (freeUntilDate && isBefore(date, freeUntilDate)) {
                continue; // It's free
            }
            subTotal += convertedMonthly;
        }

        totals[sub.category] += subTotal;
    }

    return totals;
}

/**
 * Calculate the total payment amount scheduled for the current calendar month
 * Includes past and future payments within this month.
 * Excludes free trial periods.
 */
export function calculateCurrentMonthTotal(
    subscriptions: Subscription[],
    displayCurrency: Currency,
    fxRates: FxRates
): number {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    return subscriptions
        .filter(sub => sub.isActive)
        .reduce((total, sub) => {
            const occurrences = computeOccurrences(sub, start, end);
            const convertedAmount = convertCurrency(sub.amount, sub.currency, displayCurrency, fxRates);
            const freeUntilDate = sub.freeUntil ? startOfDay(parseISO(sub.freeUntil)) : null;

            let subTotal = 0;
            for (const date of occurrences) {
                if (freeUntilDate && !isAfter(date, freeUntilDate)) {
                    continue; // It's free
                }
                subTotal += convertedAmount;
            }
            return total + subTotal;
        }, 0);
}

/**
 * Calculate the total payment amount for the current month, grouped by category
 */
export function calculateCurrentMonthCategoryTotals(
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
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    for (const sub of subscriptions) {
        if (!sub.isActive) continue;

        const occurrences = computeOccurrences(sub, start, end);
        const convertedAmount = convertCurrency(sub.amount, sub.currency, displayCurrency, fxRates);
        const freeUntilDate = sub.freeUntil ? startOfDay(parseISO(sub.freeUntil)) : null;

        let subTotal = 0;
        for (const date of occurrences) {
            if (freeUntilDate && !isAfter(date, freeUntilDate)) {
                continue; // It's free
            }
            subTotal += convertedAmount;
        }
        totals[sub.category] += subTotal;
    }

    return totals;
}

export interface MonthlyBreakdownItem {
    month: number; // 1-12
    total: number;
    categories: Record<Category, number>;
}

/**
 * Calculate monthly breakdown for a given year
 * Returns an array of 12 months with total and category breakdown
 */
export function calculateMonthlyBreakdown(
    subscriptions: Subscription[],
    year: number,
    displayCurrency: Currency,
    fxRates: FxRates
): MonthlyBreakdownItem[] {
    const result: MonthlyBreakdownItem[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    for (let month = 0; month < 12; month++) {
        // For future months we still calculate projected values
        // For current year, limit to current month
        const start = new Date(year, month, 1);
        const end = endOfMonth(start);

        const categories: Record<Category, number> = {
            AI: 0,
            ENTERTAIN: 0,
            MEMBERSHIP: 0,
            OTHER: 0
        };
        let total = 0;

        for (const sub of subscriptions) {
            if (!sub.isActive && !sub.endedAt) continue;

            const occurrences = computeOccurrences(sub, start, end);
            const convertedAmount = convertCurrency(sub.amount, sub.currency, displayCurrency, fxRates);
            const freeUntilDate = sub.freeUntil ? startOfDay(parseISO(sub.freeUntil)) : null;

            for (const date of occurrences) {
                if (freeUntilDate && !isAfter(date, freeUntilDate)) {
                    continue; // It's free
                }
                categories[sub.category] += convertedAmount;
                total += convertedAmount;
            }
        }

        result.push({
            month: month + 1, // 1-indexed
            total,
            categories
        });
    }

    return result;
}
