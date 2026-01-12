import {
    addDays,
    setDate,
    setMonth,
    getDate,
    getMonth,
    getYear,
    getDaysInMonth,
    isAfter,
    isBefore,
    isSameDay,
    startOfDay,
    addMonths,
    addYears,
    parseISO
} from 'date-fns';
import { Subscription, Category } from './db';

export interface PaymentEvent {
    subscriptionId: string;
    name: string;
    category: Category;
    date: Date;
    amount: number;
    currency: 'USD' | 'KRW';
    billingCycle: 'MONTHLY' | 'YEARLY';
}

/**
 * Clamps a day to the valid range for a given month
 * E.g., day 31 in February becomes 28 or 29
 */
function clampDayToMonth(year: number, month: number, day: number): number {
    const daysInMonth = getDaysInMonth(new Date(year, month));
    return Math.min(day, daysInMonth);
}

/**
 * Get the next payment date for a subscription
 */
export function getNextPaymentDate(sub: Subscription, today: Date = new Date()): Date {
    const todayStart = startOfDay(today);

    if (sub.billingCycle === 'MONTHLY') {
        // Monthly: find next occurrence of billingDay
        let targetDate = setDate(todayStart, sub.billingDay);

        // Clamp to valid day in current month
        const currentYear = getYear(todayStart);
        const currentMonth = getMonth(todayStart);
        const clampedDay = clampDayToMonth(currentYear, currentMonth, sub.billingDay);
        targetDate = setDate(todayStart, clampedDay);

        // If target date is before or same as today, move to next month
        if (isBefore(targetDate, todayStart) || isSameDay(targetDate, todayStart)) {
            const nextMonth = addMonths(todayStart, 1);
            const nextMonthYear = getYear(nextMonth);
            const nextMonthMonth = getMonth(nextMonth);
            const nextClampedDay = clampDayToMonth(nextMonthYear, nextMonthMonth, sub.billingDay);
            targetDate = setDate(nextMonth, nextClampedDay);
        }

        return startOfDay(targetDate);
    } else {
        // Yearly: find next occurrence of billingMonth + billingDay
        const billingMonth = (sub.billingMonth ?? 1) - 1; // Convert 1-12 to 0-11
        let targetYear = getYear(todayStart);

        // Calculate the clamped day for the target month
        let clampedDay = clampDayToMonth(targetYear, billingMonth, sub.billingDay);
        let targetDate = new Date(targetYear, billingMonth, clampedDay);

        // If target date is before today, move to next year
        if (isBefore(targetDate, todayStart) || isSameDay(targetDate, todayStart)) {
            targetYear += 1;
            clampedDay = clampDayToMonth(targetYear, billingMonth, sub.billingDay);
            targetDate = new Date(targetYear, billingMonth, clampedDay);
        }

        return startOfDay(targetDate);
    }
}

/**
 * Generate all payment events for a subscription within a date range
 */
export function generatePaymentEvents(
    sub: Subscription,
    startDate: Date,
    endDate: Date
): PaymentEvent[] {
    const events: PaymentEvent[] = [];
    let currentDate = getNextPaymentDate(sub, addDays(startDate, -1));

    while (isBefore(currentDate, endDate) || isSameDay(currentDate, endDate)) {
        if (isAfter(currentDate, startDate) || isSameDay(currentDate, startDate)) {
            let amount = sub.amount;
            // If there's a free trial, skip events during the trial period entirely
            // (User requested to only show payments starting from the first paid date)
            if (sub.freeUntil) {
                const freeUntilDate = startOfDay(parseISO(sub.freeUntil));
                if (isBefore(currentDate, freeUntilDate) || isSameDay(currentDate, freeUntilDate)) {
                    // Check if it's the SAME day as freeUntil?
                    // Usually freeUntil is the date it ends. The payment ON that day is usually the first payment?
                    // Or "Free UNTIL X". Does X count as free?
                    // If Free Until Feb 15.
                    // Payment Feb 1. (Free).
                    // Payment Mar 1. (Paid).
                    // If Free Until Feb 1.
                    // Payment Feb 1?
                    // My previous logic: `isBefore(currentDate, freeUntilDate)`.
                    // If currentDate == freeUntilDate, it was NOT free (amount not 0).
                    // So if currentDate < freeUntil, we SKIP it.
                    if (isBefore(currentDate, freeUntilDate)) {
                        // Skip this event
                        if (sub.billingCycle === 'MONTHLY') {
                            currentDate = getNextPaymentDate(sub, addDays(currentDate, 1));
                        } else {
                            currentDate = addYears(currentDate, 1);
                        }
                        continue;
                    }
                }
            }

            events.push({
                subscriptionId: sub.id,
                name: sub.name,
                category: sub.category,
                date: currentDate,
                amount: amount,
                currency: sub.currency,
                billingCycle: sub.billingCycle
            });
        }

        // Move to next payment date
        if (sub.billingCycle === 'MONTHLY') {
            currentDate = getNextPaymentDate(sub, addDays(currentDate, 1));
        } else {
            currentDate = addYears(currentDate, 1);
        }
    }

    return events;
}

/**
 * Generate all upcoming payment events for multiple subscriptions
 */
export function generateUpcomingEvents(
    subscriptions: Subscription[],
    horizonDays: number,
    today: Date = new Date()
): PaymentEvent[] {
    const startDate = startOfDay(today);
    const endDate = addDays(startDate, horizonDays);

    const allEvents: PaymentEvent[] = [];

    for (const sub of subscriptions) {
        if (sub.isActive) {
            const events = generatePaymentEvents(sub, startDate, endDate);
            allEvents.push(...events);
        }
    }

    // Sort by date
    allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

    return allEvents;
}

/**
 * Get the number of days until next payment
 */
export function getDaysUntilPayment(sub: Subscription, today: Date = new Date()): number {
    const nextPayment = getNextPaymentDate(sub, today);
    const diffTime = nextPayment.getTime() - startOfDay(today).getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Alias for backward compatibility
export const getUpcomingEvents = generateUpcomingEvents;

