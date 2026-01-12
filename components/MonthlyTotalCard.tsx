'use client';

import { motion } from 'framer-motion';
import { formatCurrency, formatCurrencyCompact } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';
import { useFx } from '@/lib/FxContext';
import { TodayDate } from './TodayDate';
import { FxStatusChip } from './FxStatusChip';

interface MonthlyTotalCardProps {
    total: number;
    subscriptionCount: number;
}

export function MonthlyTotalCard({ total, subscriptionCount }: MonthlyTotalCardProps) {
    const { t } = useTranslation();
    const { displayCurrency } = useFx();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative overflow-hidden rounded-3xl p-6 shadow-lg"
            style={{
                background: 'linear-gradient(135deg, #E0F2FE 0%, #FCE7F3 50%, #FEF3C7 100%)',
            }}
        >
            {/* Decorative circles */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20" />
            <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/15" />

            <div className="relative z-10">
                {/* Header with date and FX chip */}
                <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-600">
                        {t('home.monthlyTotal')}
                    </p>
                    <FxStatusChip />
                </div>

                {/* Main total */}
                <motion.p
                    key={`${total}-${displayCurrency}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-4xl font-bold text-gray-900 tracking-tight"
                >
                    {formatCurrency(total, displayCurrency)}
                </motion.p>


                {/* Bottom row: subscription count + today's date */}
                <div className="mt-4 flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full bg-white/50 px-3 py-1 text-sm font-medium text-gray-700 backdrop-blur-sm">
                        {subscriptionCount} {t('home.activeSubscriptions')}
                    </span>
                    <TodayDate />
                </div>
            </div>
        </motion.div>
    );
}
