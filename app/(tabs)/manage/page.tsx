'use client';

import { useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings, Database, Trash2, Globe } from 'lucide-react';
import { db, Subscription, resetAllData } from '@/lib/db';
import { monthlyEquivalentAmountConverted } from '@/lib/calc';
import { getNextPaymentDate } from '@/lib/billing';
import { useFx } from '@/lib/FxContext';
import { useTranslation, useLanguage } from '@/lib/i18n';
import { seedDemoData } from '@/lib/seed';
import { categoryConfig } from '@/lib/theme';
import { SearchBar } from '@/components/SearchBar';
import { SortMenu, SortOption } from '@/components/SortMenu';
import { SubscriptionRow } from '@/components/SubscriptionRow';
import { SubscriptionFormModal } from '@/components/SubscriptionFormModal';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export default function ManagePage() {
    const { t } = useTranslation();
    const { language, setLanguage } = useLanguage();
    const { displayCurrency, fxRates } = useFx();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState<SortOption>('amount-desc');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Live query for subscriptions
    const subscriptions = useLiveQuery(
        () => db.subscriptions.toArray(),
        [],
        []
    );

    // Filter and sort subscriptions
    const filteredAndSorted = useMemo(() => {
        if (!subscriptions) return [];

        let filtered = subscriptions;

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (s) =>
                    s.name.toLowerCase().includes(query) ||
                    s.notes?.toLowerCase().includes(query)
            );
        }

        // Sort (with currency conversion for amount sorting)
        return [...filtered].sort((a, b) => {
            switch (sortOption) {
                case 'amount-desc':
                    return monthlyEquivalentAmountConverted(b, displayCurrency, fxRates) - monthlyEquivalentAmountConverted(a, displayCurrency, fxRates);
                case 'amount-asc':
                    return monthlyEquivalentAmountConverted(a, displayCurrency, fxRates) - monthlyEquivalentAmountConverted(b, displayCurrency, fxRates);
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'next-payment':
                    return getNextPaymentDate(a).getTime() - getNextPaymentDate(b).getTime();
                case 'category':
                    return a.category.localeCompare(b.category);
                default:
                    return 0;
            }
        });
    }, [subscriptions, searchQuery, sortOption, displayCurrency, fxRates]);

    const handleAddClick = useCallback(() => {
        setSelectedSubscription(null);
        setIsModalOpen(true);
    }, []);

    const handleSubscriptionClick = useCallback((sub: Subscription) => {
        setSelectedSubscription(sub);
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedSubscription(null);
    }, []);

    const handleSeedData = async () => {
        setIsLoading(true);
        try {
            await seedDemoData();
        } catch (error) {
            console.error('Failed to seed data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetData = async () => {
        setIsLoading(true);
        try {
            await resetAllData();
            setShowResetConfirm(false);
        } catch (error) {
            console.error('Failed to reset data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">{t('nav.manage')}</h1>
            </div>

            {/* Search and Sort */}
            <div className="flex gap-3">
                <div className="flex-1">
                    <SearchBar value={searchQuery} onChange={setSearchQuery} />
                </div>
                <SortMenu value={sortOption} onChange={setSortOption} />
            </div>

            {/* Subscriptions List */}
            {subscriptions?.length === 0 ? (
                <EmptyState onAddClick={handleAddClick} />
            ) : filteredAndSorted.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">{t('empty.noResults')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {filteredAndSorted.map((sub, index) => (
                            <motion.div
                                key={sub.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <SubscriptionRow
                                    subscription={sub}
                                    onClick={() => handleSubscriptionClick(sub)}
                                    category={sub.category}
                                    showCategory
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Settings Section */}
            <div className="pt-6">
                <Separator className="mb-6" />
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('settings.title')}
                </h2>

                <div className="space-y-3">
                    {/* Language Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Globe size={20} className="text-blue-500" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{t('settings.language')}</p>
                                <p className="text-sm text-gray-500">
                                    {language === 'en' ? 'English' : '한국어'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={language === 'en' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setLanguage('en')}
                                className={language === 'en' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                            >
                                EN
                            </Button>
                            <Button
                                variant={language === 'ko' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setLanguage('ko')}
                                className={language === 'ko' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                            >
                                한국어
                            </Button>
                        </div>
                    </div>

                    {/* Seed Demo Data */}
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-3 h-14"
                        onClick={handleSeedData}
                        disabled={isLoading}
                    >
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                            <Database size={20} className="text-green-500" />
                        </div>
                        <span className="font-medium">{t('settings.seedDemo')}</span>
                    </Button>

                    {/* Reset All Data */}
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-3 h-14 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setShowResetConfirm(true)}
                        disabled={isLoading}
                    >
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                            <Trash2 size={20} className="text-red-500" />
                        </div>
                        <span className="font-medium">{t('settings.resetData')}</span>
                    </Button>
                </div>
            </div>

            {/* FAB */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddClick}
                className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center z-40"
                style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
            >
                <Plus size={24} />
            </motion.button>

            {/* Form Modal */}
            <SubscriptionFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleCloseModal}
                subscription={selectedSubscription}
            />

            {/* Reset Confirmation Dialog */}
            <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('settings.resetData')}</DialogTitle>
                        <DialogDescription>{t('settings.resetConfirm')}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
                            {t('form.cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleResetData}
                            disabled={isLoading}
                        >
                            {t('common.confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
