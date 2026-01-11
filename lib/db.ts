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
        horizonDays: 60,
        firstDayOfWeek: 0,
        theme: 'pastel',
        language: 'en',
        homeDashboardMode: 'MINIMAL_KPI'
    };

    await db.settings.add(defaultSettings);
    return defaultSettings;
}

// Subscription CRUD operations
export async function addSubscription(sub: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const { v4: uuidv4 } = await import('uuid');
    const now = new Date().toISOString();
    const id = uuidv4();

    await db.subscriptions.add({
        ...sub,
        id,
        createdAt: now,
        updatedAt: now
    });

    return id;
}

export async function updateSubscription(id: string, updates: Partial<Omit<Subscription, 'id' | 'createdAt'>>): Promise<void> {
    await db.subscriptions.update(id, {
        ...updates,
        updatedAt: new Date().toISOString()
    });
}

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
        return { ...settings, homeDashboardMode: 'MINIMAL_KPI' };
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
