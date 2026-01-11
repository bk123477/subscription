'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { db, Subscription, Category, initializeSettings } from '@/lib/db';
import { totalMonthlyAmount, categoryMonthlyTotals, groupByCategory, countActiveSubscriptions } from '@/lib/calc';
import { useTranslation } from '@/lib/i18n';
import { useFx } from '@/lib/FxContext';
import { CategorySection } from '@/components/CategorySection';
import { EmptyState } from '@/components/EmptyState';
import { LanguageToggle } from '@/components/LanguageToggle';
import { SubscriptionFormModal } from '@/components/SubscriptionFormModal';
import { DashboardModeSwitcher } from '@/components/home/DashboardModeSwitcher';
import { HomeDashboardSwitcher } from '@/components/home/HomeDashboardSwitcher';
import { HomeHeaderSummary } from '@/components/home/HomeHeaderSummary';
import { useState } from 'react';

const categoryOrder: Category[] = ['AI', 'ENTERTAIN', 'MEMBERSHIP', 'OTHER'];

export default function HomePage() {
    const { t } = useTranslation();
    const { fxRates, displayCurrency } = useFx();
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const categorySectionRefs = useRef<Record<Category, HTMLDivElement | null>>({
        AI: null,
        ENTERTAIN: null,
        MEMBERSHIP: null,
        OTHER: null
    });

    // Initialize settings on mount
    useEffect(() => {
        initializeSettings();
    }, []);

    // Live query for subscriptions
    const subscriptions = useLiveQuery(
        () => db.subscriptions.toArray(),
        [],
        []
    );

    const activeSubscriptions = subscriptions?.filter(s => s.isActive) || [];
    const monthlyTotal = totalMonthlyAmount(activeSubscriptions, displayCurrency, fxRates);
    const categoryTotals = categoryMonthlyTotals(activeSubscriptions, displayCurrency, fxRates);
    const groupedSubs = groupByCategory(activeSubscriptions);

    const handleSubscriptionClick = useCallback((sub: Subscription) => {
        setSelectedSubscription(sub);
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedSubscription(null);
    }, []);

    const handleSave = useCallback(() => {
        // The useLiveQuery will automatically update
    }, []);

    const handleCategoryClick = useCallback((category: Category) => {
        const ref = categorySectionRefs.current[category];
        if (ref) {
            ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    return (
        <div className="py-6 space-y-4">
            {/* Header Row */}
            <div className="flex items-center justify-between gap-2 px-4">
                <h1 className="text-xl font-bold text-gray-900 truncate flex-1 min-w-0">
                    {t('app.title')}
                </h1>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <DashboardModeSwitcher />
                    <LanguageToggle />
                </div>
            </div>

            {activeSubscriptions.length > 0 ? (
                <>
                    {/* Unified Header: Monthly Total + Next Payment */}
                    <HomeHeaderSummary
                        subscriptions={subscriptions || []}
                        totalMonthly={monthlyTotal}
                    />

                    {/* Dashboard Visualization (mode-dependent) */}
                    <HomeDashboardSwitcher
                        subscriptions={subscriptions || []}
                        totalMonthly={monthlyTotal}
                        categoryTotals={categoryTotals}
                        onCategoryClick={handleCategoryClick}
                    />

                    {/* Category Sections */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-4 px-4"
                    >
                        {categoryOrder.map((category, index) => (
                            <motion.div
                                key={category}
                                ref={(el) => { categorySectionRefs.current[category] = el; }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * (index + 1) }}
                            >
                                <CategorySection
                                    category={category}
                                    subscriptions={groupedSubs[category]}
                                    monthlyTotal={categoryTotals[category]}
                                    onSubscriptionClick={handleSubscriptionClick}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                </>
            ) : (
                <div className="px-4">
                    <EmptyState />
                </div>
            )}

            {/* Edit Modal */}
            <SubscriptionFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                subscription={selectedSubscription}
            />
        </div>
    );
}
