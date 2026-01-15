import Dexie, { Table } from 'dexie';

export type Category = 'AI' | 'ENTERTAIN' | 'MEMBERSHIP' | 'OTHER';
export type BillingCycle = 'MONTHLY' | 'YEARLY';
export type Currency = 'USD' | 'KRW';
export type DashboardMode = 'LANDSCAPE' | 'TIME_WHEEL' | 'MINIMAL_KPI';

export interface Subscription {
    id: string;
    name: string;
    category: Category;
    amount: number;
    currency: Currency;
    billingCycle: BillingCycle;
    billingDay: number; // 1-31
    billingMonth?: number; // 1-12, only for YEARLY
    notes?: string;
    isActive: boolean;
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
    endedAt?: string | null; // ISO string, if ended
    freeUntil?: string | null; // ISO string, date until which payments are 0
    startedAt?: string | null; // ISO string, when subscription actually started (for historical tracking)
    serviceUrl?: string | null; // URL of the service for logo fetching
    paymentMethodId?: string | null; // Reference to payment method
    promoAmount?: number | null; // Discounted amount during promotion
    promoUntil?: string | null; // ISO string, date until which promo applies
    isPaid?: boolean; // Whether the current period is already paid
}

export interface PaymentMethod {
    id: string;
    name: string; // e.g., "My Visa Card", "Samsung Card"
    type: 'credit_card' | 'debit_card' | 'bank_account' | 'other';
    last4?: string; // Last 4 digits for display
    color?: string; // For visual distinction
    createdAt: string;
}

export interface Settings {
    id: number; // Always 1 (singleton)
    defaultCurrency: Currency;
    horizonDays: number;
    firstDayOfWeek: 0 | 1; // 0=Sunday, 1=Monday
    theme: 'pastel';
    language: 'en' | 'ko';
    homeDashboardMode: DashboardMode;
}

export interface FxRateCache {
    id: number; // Always 1 (singleton)
    usdToKrw: number;
    krwToUsd: number;
    lastUpdated: string; // ISO string
    source: string;
}

class SubscriptionDB extends Dexie {
    subscriptions!: Table<Subscription, string>;
    settings!: Table<Settings, number>;
    fxRateCache!: Table<FxRateCache, number>;
    paymentMethods!: Table<PaymentMethod, string>;

    constructor() {
        super('SubscriptionTrackerDB');

        // Version 1: Original schema
        this.version(1).stores({
            subscriptions: 'id, name, category, billingCycle, isActive, createdAt',
            settings: 'id'
        });

        // Version 2: Add FxRateCache table, migrate subscriptions to have currency
        this.version(2).stores({
            subscriptions: 'id, name, category, billingCycle, isActive, createdAt',
            settings: 'id',
            fxRateCache: 'id'
        }).upgrade(tx => {
            return tx.table('subscriptions').toCollection().modify(sub => {
                if (!sub.currency) {
                    sub.currency = 'USD';
                }
            });
        });

        // Version 3: Add homeDashboardMode to settings
        this.version(3).stores({
            subscriptions: 'id, name, category, billingCycle, isActive, createdAt',
            settings: 'id',
            fxRateCache: 'id'
        }).upgrade(tx => {
            return tx.table('settings').toCollection().modify(settings => {
                if (!settings.homeDashboardMode) {
                    settings.homeDashboardMode = 'MINIMAL_KPI';
                }
            });
        });

        // Version 4: Add endedAt to subscriptions
        this.version(4).stores({
            subscriptions: 'id, name, category, billingCycle, isActive, createdAt, endedAt',
            settings: 'id',
            fxRateCache: 'id'
        }).upgrade(tx => {
            return tx.table('subscriptions').toCollection().modify(sub => {
                // Ensure createdAt exists (migration default: now)
                if (!sub.createdAt) {
                    sub.createdAt = new Date().toISOString();
                }
                // Initialize endedAt
                if (sub.endedAt === undefined) {
                    sub.endedAt = null;
                }
                // If isActive is false but no endedAt, assume ended now? 
                // Or keep as is? User prompt says "endedAt = null" for migration.
                // We'll stick to endedAt = null.
            });
        });

        // Version 5: Add freeUntil to subscriptions
        this.version(5).stores({
            subscriptions: 'id, name, category, billingCycle, isActive, createdAt, endedAt, freeUntil',
            settings: 'id',
            fxRateCache: 'id'
        }).upgrade(tx => {
            return tx.table('subscriptions').toCollection().modify(sub => {
                if (sub.freeUntil === undefined) {
                    sub.freeUntil = null;
                }
            });
        });

        // Version 6: Add startedAt to subscriptions
        this.version(6).stores({
            subscriptions: 'id, name, category, billingCycle, isActive, createdAt, endedAt, freeUntil, startedAt',
            settings: 'id',
            fxRateCache: 'id'
        }).upgrade(tx => {
            // Set startedAt to Jan 1 of current year for existing subscriptions
            const jan1CurrentYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
            return tx.table('subscriptions').toCollection().modify(sub => {
                if (sub.startedAt === undefined || sub.startedAt === null) {
                    sub.startedAt = jan1CurrentYear;
                }
            });
        });

        // Version 7: Fix startedAt for existing subscriptions that have null
        // (This handles users who already ran Version 6 with the old migration)
        this.version(7).stores({
            subscriptions: 'id, name, category, billingCycle, isActive, createdAt, endedAt, freeUntil, startedAt',
            settings: 'id',
            fxRateCache: 'id'
        }).upgrade(tx => {
            const jan1CurrentYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
            return tx.table('subscriptions').toCollection().modify(sub => {
                if (!sub.startedAt) {
                    sub.startedAt = jan1CurrentYear;
                }
            });
        });

        // Version 8: Add serviceUrl to subscriptions
        this.version(8).stores({
            subscriptions: 'id, name, category, billingCycle, isActive, createdAt, endedAt, freeUntil, startedAt, serviceUrl',
            settings: 'id',
            fxRateCache: 'id'
        }).upgrade(tx => {
            return tx.table('subscriptions').toCollection().modify(sub => {
                if (sub.serviceUrl === undefined) {
                    sub.serviceUrl = null;
                }
            });
        });

        // Version 9: Add paymentMethods table and paymentMethodId to subscriptions
        this.version(9).stores({
            subscriptions: 'id, name, category, billingCycle, isActive, createdAt, endedAt, freeUntil, startedAt, serviceUrl, paymentMethodId',
            settings: 'id',
            fxRateCache: 'id',
            paymentMethods: 'id, name, type, createdAt'
        }).upgrade(tx => {
            return tx.table('subscriptions').toCollection().modify(sub => {
                if (sub.paymentMethodId === undefined) {
                    sub.paymentMethodId = null;
                }
            });
        });

        // Version 10: Add promoAmount, promoUntil, and isPaid to subscriptions
        this.version(10).stores({
            subscriptions: 'id, name, category, billingCycle, isActive, createdAt, endedAt, freeUntil, startedAt, serviceUrl, paymentMethodId, promoAmount, promoUntil, isPaid',
            settings: 'id',
            fxRateCache: 'id',
            paymentMethods: 'id, name, type, createdAt'
        }).upgrade(tx => {
            return tx.table('subscriptions').toCollection().modify(sub => {
                if (sub.promoAmount === undefined) sub.promoAmount = null;
                if (sub.promoUntil === undefined) sub.promoUntil = null;
                if (sub.isPaid === undefined) sub.isPaid = false;
            });
        });
    }
}

export const db = new SubscriptionDB();

// Initialize default settings if not exists
export async function initializeSettings(): Promise<Settings> {
    const existing = await db.settings.get(1);
    if (existing) {
        // Ensure new fields exist
        if (!existing.homeDashboardMode) {
            await db.settings.update(1, { homeDashboardMode: 'MINIMAL_KPI' });
            return { ...existing, homeDashboardMode: 'MINIMAL_KPI' };
        }
        return existing;
    }

    const defaultSettings: Settings = {
        id: 1,
        defaultCurrency: 'USD',
        horizonDays: 365,
        firstDayOfWeek: 0,
        theme: 'pastel',
        language: 'en',
        homeDashboardMode: 'MINIMAL_KPI'
    };

    await db.settings.add(defaultSettings);
    return defaultSettings;
}

// Subscription CRUD operations
export async function addSubscription(sub: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt' | 'endedAt'>): Promise<string> {
    const { v4: uuidv4 } = await import('uuid');
    const now = new Date().toISOString();
    const id = uuidv4();

    await db.subscriptions.add({
        ...sub,
        id,
        isActive: true, // Default to true
        createdAt: now,
        updatedAt: now,
        endedAt: null,
        freeUntil: sub.freeUntil || null,
        startedAt: sub.startedAt || null,
        serviceUrl: sub.serviceUrl || null
    });

    return id;
}

export async function updateSubscription(id: string, updates: Partial<Omit<Subscription, 'id' | 'createdAt'>>): Promise<void> {
    await db.subscriptions.update(id, {
        ...updates,
        updatedAt: new Date().toISOString()
    });
}

/**
 * End a subscription (Soft Delete)
 * Sets endedAt and marks as inactive
 */
export async function endSubscription(id: string): Promise<void> {
    const now = new Date().toISOString();
    await db.subscriptions.update(id, {
        isActive: false,
        endedAt: now,
        updatedAt: now
    });
}

/**
 * Reactivate a subscription
 * Clears endedAt and marks as active
 */
export async function reactivateSubscription(id: string): Promise<void> {
    const now = new Date().toISOString();
    await db.subscriptions.update(id, {
        isActive: true,
        endedAt: null,
        updatedAt: now
    });
}

/**
 * Permanently delete a subscription (Hard Delete)
 * Removes record from database
 */
export async function deleteSubscription(id: string): Promise<void> {
    await db.subscriptions.delete(id);
}

export async function getSubscription(id: string): Promise<Subscription | undefined> {
    return db.subscriptions.get(id);
}

export async function getAllSubscriptions(): Promise<Subscription[]> {
    return db.subscriptions.toArray();
}

export async function getActiveSubscriptions(): Promise<Subscription[]> {
    return db.subscriptions.where('isActive').equals(1).toArray();
}

// Settings operations
export async function getSettings(): Promise<Settings> {
    const settings = await db.settings.get(1);
    if (!settings) {
        return initializeSettings();
    }
    // Ensure homeDashboardMode exists
    if (!settings.homeDashboardMode) {
        // Also check horizonDays while we are here
        if (settings.horizonDays < 365) {
            await db.settings.update(1, { homeDashboardMode: 'MINIMAL_KPI', horizonDays: 365 });
            return { ...settings, homeDashboardMode: 'MINIMAL_KPI', horizonDays: 365 };
        }
        return { ...settings, homeDashboardMode: 'MINIMAL_KPI' };
    }

    // Ensure horizonDays is 365 (Migration for existing users)
    if (settings.horizonDays < 365) {
        await db.settings.update(1, { horizonDays: 365 });
        return { ...settings, horizonDays: 365 };
    }

    return settings;
}

export async function updateSettings(updates: Partial<Omit<Settings, 'id'>>): Promise<void> {
    await db.settings.update(1, updates);
}

// FX Rate Cache operations
export async function getFxRateCache(): Promise<FxRateCache | undefined> {
    return db.fxRateCache.get(1);
}

export async function setFxRateCache(cache: Omit<FxRateCache, 'id'>): Promise<void> {
    const existing = await db.fxRateCache.get(1);
    if (existing) {
        await db.fxRateCache.update(1, cache);
    } else {
        await db.fxRateCache.add({ id: 1, ...cache });
    }
}

// Reset all data
export async function resetAllData(): Promise<void> {
    await db.subscriptions.clear();
    await db.settings.clear();
    await db.fxRateCache.clear();
    await db.paymentMethods.clear();
    await initializeSettings();
}

// PaymentMethod CRUD operations
export async function addPaymentMethod(pm: Omit<PaymentMethod, 'id' | 'createdAt'>): Promise<string> {
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();

    await db.paymentMethods.add({
        ...pm,
        id,
        createdAt: new Date().toISOString()
    });

    return id;
}

export async function updatePaymentMethod(id: string, updates: Partial<Omit<PaymentMethod, 'id' | 'createdAt'>>): Promise<void> {
    await db.paymentMethods.update(id, updates);
}

export async function deletePaymentMethod(id: string): Promise<void> {
    // Also clear the paymentMethodId from any subscriptions using this method
    await db.subscriptions.where('paymentMethodId').equals(id).modify({ paymentMethodId: null });
    await db.paymentMethods.delete(id);
}

export async function getAllPaymentMethods(): Promise<PaymentMethod[]> {
    return db.paymentMethods.toArray();
}
