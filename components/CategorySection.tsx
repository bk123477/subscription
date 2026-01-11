'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Tv, CreditCard, MoreHorizontal, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Category, Subscription } from '@/lib/db';
import { categoryConfig } from '@/lib/theme';
import { formatCurrency } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';
import { useFx } from '@/lib/FxContext';
import { SubscriptionRow } from './SubscriptionRow';

const iconComponents = {
    Sparkles,
    Tv,
    CreditCard,
    MoreHorizontal,
};

interface CategorySectionProps {
    category: Category;
    subscriptions: Subscription[];
    monthlyTotal: number;
    onSubscriptionClick: (sub: Subscription) => void;
}

export function CategorySection({
    category,
    subscriptions,
    monthlyTotal,
    onSubscriptionClick,
}: CategorySectionProps) {
    const { t, language } = useTranslation();
    const { displayCurrency } = useFx();
    const [isExpanded, setIsExpanded] = useState(true);

    const config = categoryConfig[category];
    const Icon = iconComponents[config.icon as keyof typeof iconComponents];

    if (subscriptions.length === 0) {
        return null;
    }

    const itemText = language === 'ko'
        ? `${subscriptions.length}개`
        : subscriptions.length === 1 ? '1 item' : `${subscriptions.length} items`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
        >
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-colors"
                style={{ backgroundColor: config.colors.bg }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="flex items-center justify-center w-10 h-10 rounded-xl"
                        style={{ backgroundColor: `${config.colors.icon}20` }}
                    >
                        <Icon size={20} style={{ color: config.colors.icon }} />
                    </div>
                    <div className="text-left">
                        <p className="font-semibold" style={{ color: config.colors.text }}>
                            {t(config.label as any)}
                        </p>
                        <p className="text-sm text-gray-500">
                            {itemText}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-bold" style={{ color: config.colors.text }}>
                        {formatCurrency(monthlyTotal, displayCurrency)}
                    </span>
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown size={20} className="text-gray-400" />
                    </motion.div>
                </div>
            </button>

            {/* Subscriptions list */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2 space-y-2 pl-2">
                            {subscriptions.map((sub, index) => (
                                <motion.div
                                    key={sub.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <SubscriptionRow
                                        subscription={sub}
                                        onClick={() => onSubscriptionClick(sub)}
                                        category={category}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
