import { Subscription, db, Category } from './db';
import { v4 as uuidv4 } from 'uuid';

// Demo subscriptions data with mixed currencies and distributed billing days
const demoSubscriptions: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>[] = [
    // AI Category (USD)
    {
        name: 'ChatGPT Plus',
        category: 'AI',
        amount: 20,
        currency: 'USD',
        billingCycle: 'MONTHLY',
        billingDay: 15,
        notes: 'GPT-4 access',
        isActive: true
    },
    {
        name: 'Claude Pro',
        category: 'AI',
        amount: 20,
        currency: 'USD',
        billingCycle: 'MONTHLY',
        billingDay: 15,
        notes: 'Anthropic AI assistant',
        isActive: true
    },
    {
        name: 'Midjourney',
        category: 'AI',
        amount: 10,
        currency: 'USD',
        billingCycle: 'MONTHLY',
        billingDay: 8,
        notes: 'Basic plan for image generation',
        isActive: true
    },

    // Entertainment Category (Mixed currencies)
    {
        name: 'Netflix',
        category: 'ENTERTAIN',
        amount: 15.99,
        currency: 'USD',
        billingCycle: 'MONTHLY',
        billingDay: 5,
        notes: 'Standard plan',
        isActive: true
    },
    {
        name: 'Spotify Premium',
        category: 'ENTERTAIN',
        amount: 10990,
        currency: 'KRW',
        billingCycle: 'MONTHLY',
        billingDay: 20,
        isActive: true
    },
    {
        name: 'YouTube Premium',
        category: 'ENTERTAIN',
        amount: 14900,
        currency: 'KRW',
        billingCycle: 'MONTHLY',
        billingDay: 12,
        notes: 'Includes YouTube Music',
        isActive: true
    },
    {
        name: 'Disney+',
        category: 'ENTERTAIN',
        amount: 109.99,
        currency: 'USD',
        billingCycle: 'YEARLY',
        billingDay: 1,
        billingMonth: 6,
        notes: 'Annual subscription',
        isActive: true
    },

    // Membership Category (Mixed)
    {
        name: 'Amazon Prime',
        category: 'MEMBERSHIP',
        amount: 139,
        currency: 'USD',
        billingCycle: 'YEARLY',
        billingDay: 15,
        billingMonth: 3,
        notes: 'Includes Prime Video',
        isActive: true
    },
    {
        name: 'Costco',
        category: 'MEMBERSHIP',
        amount: 48000,
        currency: 'KRW',
        billingCycle: 'YEARLY',
        billingDay: 10,
        billingMonth: 9,
        isActive: true
    },
    {
        name: 'Gym Membership',
        category: 'MEMBERSHIP',
        amount: 99000,
        currency: 'KRW',
        billingCycle: 'MONTHLY',
        billingDay: 1,
        isActive: true
    },

    // Other Category (Mixed)
    {
        name: 'iCloud+',
        category: 'OTHER',
        amount: 2.99,
        currency: 'USD',
        billingCycle: 'MONTHLY',
        billingDay: 18,
        notes: '200GB storage',
        isActive: true
    },
    {
        name: 'Notion',
        category: 'OTHER',
        amount: 96,
        currency: 'USD',
        billingCycle: 'YEARLY',
        billingDay: 22,
        billingMonth: 1,
        notes: 'Personal Pro',
        isActive: true
    },
    {
        name: 'Naver Cloud',
        category: 'OTHER',
        amount: 4400,
        currency: 'KRW',
        billingCycle: 'MONTHLY',
        billingDay: 5,
        notes: '100GB storage',
        isActive: true
    }
];

/**
 * Seed the database with demo data
 */
export async function seedDemoData(): Promise<void> {
    const now = new Date().toISOString();

    const subscriptionsToAdd: Subscription[] = demoSubscriptions.map(sub => ({
        ...sub,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now
    }));

    await db.subscriptions.bulkAdd(subscriptionsToAdd);
}

/**
 * Check if demo data should be shown
 */
export async function hasDemoData(): Promise<boolean> {
    const count = await db.subscriptions.count();
    return count > 0;
}
