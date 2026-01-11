'use client';

import { BottomNav } from '@/components/BottomNav';
import { useEffect } from 'react';

export default function TabsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Set CSS variable for actual viewport height (iOS Safari fix)
    useEffect(() => {
        const setAppHeight = () => {
            const vh = window.innerHeight;
            document.documentElement.style.setProperty('--app-height', `${vh}px`);
        };

        setAppHeight();
        window.addEventListener('resize', setAppHeight);
        window.addEventListener('orientationchange', setAppHeight);

        return () => {
            window.removeEventListener('resize', setAppHeight);
            window.removeEventListener('orientationchange', setAppHeight);
        };
    }, []);

    return (
        <div
            className="min-h-[100dvh] bg-gray-50 flex flex-col"
            style={{
                minHeight: 'var(--app-height, 100dvh)',
                paddingTop: 'env(safe-area-inset-top)',
            }}
        >
            <main
                className="flex-1"
                style={{
                    /* Bottom nav height (4rem) + safe area */
                    paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
                }}
            >
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
