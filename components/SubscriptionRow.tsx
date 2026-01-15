'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ChevronRight, Trash2, Pause, Play } from 'lucide-react';
import { Category, Subscription, endSubscription, reactivateSubscription, deleteSubscription } from '@/lib/db';
import { monthlyEquivalentAmount, monthlyEquivalentAmountConverted } from '@/lib/calc';
import { formatCurrency } from '@/lib/format';
import { categoryConfig } from '@/lib/theme';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/lib/i18n';
import { useFx } from '@/lib/FxContext';

interface SubscriptionRowProps {
    subscription: Subscription;
    onClick: () => void;
    category: Category;
    showCategory?: boolean;
}

export function SubscriptionRow({
    subscription,
    onClick,
    category,
    showCategory = false,
}: SubscriptionRowProps) {
    const { t } = useTranslation();
    const { displayCurrency, fxRates } = useFx();
    const config = categoryConfig[category];
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPausing, setIsPausing] = useState(false);

    // Get converted monthly amount
    const convertedMonthly = monthlyEquivalentAmountConverted(subscription, displayCurrency, fxRates);
    const originalMonthly = monthlyEquivalentAmount(subscription);
    const needsConversion = subscription.currency !== displayCurrency;

    // Swipe gesture
    const x = useMotionValue(0);
    const deleteOpacity = useTransform(x, [-100, -50], [1, 0]);
    const pauseOpacity = useTransform(x, [50, 100], [0, 1]);
    const deleteScale = useTransform(x, [-100, -50], [1, 0.8]);
    const pauseScale = useTransform(x, [50, 100], [0.8, 1]);

    const handleDragEnd = async (_: any, info: PanInfo) => {
        const threshold = 80;

        if (info.offset.x < -threshold) {
            // Swipe left - Delete
            setIsDeleting(true);
            await deleteSubscription(subscription.id);
        } else if (info.offset.x > threshold) {
            // Swipe right - Pause/Resume
            setIsPausing(true);
            if (subscription.endedAt) {
                await reactivateSubscription(subscription.id);
            } else {
                await endSubscription(subscription.id);
            }
            setIsPausing(false);
        }
    };

    if (isDeleting) {
        return (
            <motion.div
                initial={{ height: 'auto', opacity: 1 }}
                animate={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
            />
        );
    }

    return (
        <div className="relative overflow-hidden rounded-xl">
            {/* Background actions */}
            <div className="absolute inset-0 flex items-stretch">
                {/* Left side - Pause/Resume action */}
                <motion.div
                    style={{ opacity: pauseOpacity, scale: pauseScale }}
                    className="flex items-center justify-center bg-yellow-500 text-white px-6 rounded-l-xl"
                >
                    {subscription.endedAt ? (
                        <>
                            <Play size={20} className="mr-2" />
                            <span className="text-sm font-medium">{t('manage.reactivate')}</span>
                        </>
                    ) : (
                        <>
                            <Pause size={20} className="mr-2" />
                            <span className="text-sm font-medium">{t('row.pause')}</span>
                        </>
                    )}
                </motion.div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Right side - Delete action */}
                <motion.div
                    style={{ opacity: deleteOpacity, scale: deleteScale }}
                    className="flex items-center justify-center bg-red-500 text-white px-6 rounded-r-xl"
                >
                    <Trash2 size={20} className="mr-2" />
                    <span className="text-sm font-medium">{t('row.delete')}</span>
                </motion.div>
            </div>

            {/* Draggable row */}
            <motion.button
                onClick={onClick}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                style={{ x }}
                whileTap={{ scale: 0.98 }}
                className={`relative w-full flex items-center justify-between p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all ${subscription.endedAt ? 'opacity-60 grayscale' : ''
                    }`}
            >
                <div className="flex items-center gap-3">
                    {showCategory && (
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: config.colors.icon }}
                        />
                    )}
                    <div className="text-left">
                        <div className="flex items-center gap-2">
                            <p className={`font-medium text-gray-900 ${subscription.endedAt ? 'line-through decoration-gray-400' : ''}`}>
                                {subscription.name}
                            </p>
                            {subscription.freeUntil && new Date(subscription.freeUntil) > new Date() && (
                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-blue-300 text-blue-500 bg-blue-50">
                                    {t('form.freeTrial')}
                                </Badge>
                            )}
                            {subscription.endedAt && (
                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-gray-300 text-gray-500">
                                    {t('manage.ended')}
                                </Badge>
                            )}
                        </div>
                        {subscription.notes && (
                            <p className="text-xs text-gray-500 truncate max-w-[150px]">
                                {subscription.notes}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="font-semibold text-gray-900">
                            {formatCurrency(convertedMonthly, displayCurrency)}
                            <span className="text-gray-400 font-normal text-sm">
                                {t('common.perMonth')}
                            </span>
                        </p>
                        {/* Show original currency if converted */}
                        {needsConversion && (
                            <p className="text-xs text-gray-400">
                                {formatCurrency(originalMonthly, subscription.currency)}
                            </p>
                        )}
                    </div>
                    <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                            backgroundColor: `${config.colors.bg}`,
                            color: config.colors.text,
                        }}
                    >
                        {subscription.billingCycle === 'MONTHLY' ? 'M' : 'Y'}
                    </Badge>
                    <ChevronRight size={18} className="text-gray-300" />
                </div>
            </motion.button>
        </div>
    );
}
