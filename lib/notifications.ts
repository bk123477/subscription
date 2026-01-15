export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

export async function scheduleNotification(title: string, options: NotificationOptions) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }

    // In a real PWA, this would be handled by a Service Worker to work in background.
    // For now, we use the simple Notification API.
    try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && 'showNotification' in registration) {
            await registration.showNotification(title, options);
        } else {
            new Notification(title, options);
        }
    } catch (error) {
        console.error('Failed to show notification:', error);
        new Notification(title, options);
    }
}
