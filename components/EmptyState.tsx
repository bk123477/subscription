'use client';

import { motion } from 'framer-motion';
import { CreditCard, Plus } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    onAddClick?: () => void;
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
        >
            <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                style={{
                    background: 'linear-gradient(135deg, #E0F2FE 0%, #FCE7F3 100%)',
                }}
            >
                <CreditCard className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('empty.noSubscriptions')}
            </h3>
            <p className="text-gray-500 mb-6 max-w-xs">
                {t('empty.addFirst')}
            </p>
            {onAddClick && (
                <Button
                    onClick={onAddClick}
                    className="gap-2 bg-blue-500 hover:bg-blue-600"
                >
                    <Plus size={18} />
                    {t('manage.addSubscription')}
                </Button>
            )}
        </motion.div>
    );
}
