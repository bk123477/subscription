import { Subscription, Category, Currency } from './db';
import { FxRates, convertCurrency } from './fx';

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
