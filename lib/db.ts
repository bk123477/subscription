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
        startedAt: sub.startedAt || null
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
    await initializeSettings();
}
