'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for safely locking/unlocking body scroll.
 * Correctly restores scroll position on iOS Safari and PWA.
 */
export function useScrollLock() {
    const scrollPositionRef = useRef(0);
    const isLockedRef = useRef(false);

    const lockScroll = useCallback(() => {
        if (isLockedRef.current) return;

        // Save current scroll position
        scrollPositionRef.current = window.scrollY;

        // Apply scroll lock
        document.body.classList.add('scroll-locked');
        document.body.style.top = `-${scrollPositionRef.current}px`;

        isLockedRef.current = true;
    }, []);

    const unlockScroll = useCallback(() => {
        if (!isLockedRef.current) return;

        // Remove scroll lock
        document.body.classList.remove('scroll-locked');
        document.body.style.top = '';

        // Restore scroll position
        window.scrollTo(0, scrollPositionRef.current);

        isLockedRef.current = false;
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isLockedRef.current) {
                document.body.classList.remove('scroll-locked');
                document.body.style.top = '';
                // Don't restore scroll on unmount (might cause jumps)
            }
        };
    }, []);

    return { lockScroll, unlockScroll, isLocked: isLockedRef.current };
}
