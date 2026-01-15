'use client';

import { motion } from 'framer-motion';
import { Plus, Sparkles, TrendingUp, Calendar, Bell } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    onAddClick?: () => void;
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
    const { t } = useTranslation();

    const features = [
        { icon: TrendingUp, labelKey: 'empty.feature1' },
        { icon: Calendar, labelKey: 'empty.feature2' },
        { icon: Bell, labelKey: 'empty.feature3' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
        >
            {/* Illustration */}
            <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                className="relative mb-8"
            >
                {/* Background circles */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 opacity-50" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        className="w-24 h-24 rounded-full border-2 border-dashed border-blue-200"
                    />
                </div>

                {/* Main icon */}
                <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-12 h-12 text-white" />
                </div>

                {/* Floating dots */}
                <motion.div
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-pink-400 shadow-md"
                />
                <motion.div
                    animate={{ y: [5, -5, 5] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="absolute -bottom-1 -left-3 w-4 h-4 rounded-full bg-yellow-400 shadow-md"
                />
            </motion.div>

            {/* Text */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('empty.noSubscriptions')}
            </h3>
            <p className="text-gray-500 mb-6 max-w-xs">
                {t('empty.addFirst')}
            </p>

            {/* Features list */}
            <div className="space-y-3 mb-8 text-left">
                {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                        <motion.div
                            key={feature.labelKey}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                            className="flex items-center gap-3 text-sm text-gray-600"
                        >
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Icon size={16} className="text-blue-500" />
                            </div>
                            <span>{t(feature.labelKey as any)}</span>
                        </motion.div>
                    );
                })}
            </div>

            {/* CTA Button */}
            {onAddClick && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Button
                        onClick={onAddClick}
                        className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg"
                        size="lg"
                    >
                        <Plus size={18} />
                        {t('manage.addSubscription')}
                    </Button>
                </motion.div>
            )}
        </motion.div>
    );
}
