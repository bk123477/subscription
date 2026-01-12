'use client';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Category, Subscription } from '@/lib/db';
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

    // Get converted monthly amount
    const convertedMonthly = monthlyEquivalentAmountConverted(subscription, displayCurrency, fxRates);
    const originalMonthly = monthlyEquivalentAmount(subscription);
    const needsConversion = subscription.currency !== displayCurrency;

    return (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.98 }}
            className={`w-full flex items-center justify-between p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all ${subscription.endedAt ? 'opacity-60 grayscale' : ''
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
    );
}
