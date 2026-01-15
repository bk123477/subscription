import { db } from './db';

export async function exportDataToJson() {
    const subscriptions = await db.subscriptions.toArray();
    const paymentMethods = await db.paymentMethods.toArray();
    const settings = await db.settings.get(1);

    const data = {
        subscriptions,
        paymentMethods,
        settings,
        exportDate: new Date().toISOString(),
        version: 1
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscription-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

export async function importDataFromJson(jsonString: string) {
    try {
        const data = JSON.parse(jsonString);

        // Basic validation
        if (!data.subscriptions || !Array.isArray(data.subscriptions)) {
            throw new Error('Invalid backup format');
        }

        await db.transaction('rw', db.subscriptions, db.paymentMethods, db.settings, async () => {
            // Clear existing data
            await db.subscriptions.clear();
            await db.paymentMethods.clear();

            // Import subscriptions
            await db.subscriptions.bulkAdd(data.subscriptions);

            // Import payment methods
            if (data.paymentMethods && Array.isArray(data.paymentMethods)) {
                await db.paymentMethods.bulkAdd(data.paymentMethods);
            }

            // Import settings (optional/merge)
            if (data.settings) {
                await db.settings.put({ ...data.settings, id: 1 });
            }
        });

        return true;
    } catch (error) {
        console.error('Failed to import data:', error);
        throw error;
    }
}
