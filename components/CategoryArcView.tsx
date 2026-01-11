'use client';

import { motion } from 'framer-motion';
import { Sparkles, Tv, CreditCard, MoreHorizontal } from 'lucide-react';
import { Category } from '@/lib/db';
import { categoryConfig, colors } from '@/lib/theme';
import { formatCurrency, formatCurrencyCompact } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';
import { useFx } from '@/lib/FxContext';

const iconComponents = {
    Sparkles,
    Tv,
    CreditCard,
    MoreHorizontal,
};

interface CategoryArcProps {
    categoryTotals: Record<Category, number>;
    totalMonthly: number;
    onCategoryClick?: (category: Category) => void;
}

const categoryOrder: Category[] = ['AI', 'ENTERTAIN', 'MEMBERSHIP', 'OTHER'];

export function CategoryArcView({ categoryTotals, totalMonthly, onCategoryClick }: CategoryArcProps) {
    const { t } = useTranslation();
    const { displayCurrency } = useFx();

    // Calculate percentages and arc angles
    const percentages = categoryOrder.map(cat => ({
        category: cat,
        percentage: totalMonthly > 0 ? (categoryTotals[cat] / totalMonthly) * 100 : 0,
        amount: categoryTotals[cat]
    })).filter(p => p.amount > 0);

    // Calculate arc positions (start and end angles for each category)
    let currentAngle = -90; // Start from top
    const arcs = percentages.map(({ category, percentage, amount }) => {
        const arcAngle = (percentage / 100) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + arcAngle;
        currentAngle = endAngle;

        return {
            category,
            percentage,
            amount,
            startAngle,
            endAngle,
            midAngle: startAngle + arcAngle / 2
        };
    });

    // SVG arc helper
    const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
        const start = polarToCartesian(cx, cy, r, endAngle);
        const end = polarToCartesian(cx, cy, r, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
        return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
    };

    const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
        const rad = (angle * Math.PI) / 180;
        return {
            x: cx + r * Math.cos(rad),
            y: cy + r * Math.sin(rad)
        };
    };

    const size = 280;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 100;
    const strokeWidth = 24;

    return (
        <div className="relative flex flex-col items-center">
            {/* Arc Chart */}
            <div className="relative">
                <svg width={size} height={size} className="transform -rotate-0">
                    {/* Background circle */}
                    <circle
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill="none"
                        stroke="#F3F4F6"
                        strokeWidth={strokeWidth}
                    />

                    {/* Category arcs */}
                    {arcs.map((arc, index) => {
                        const config = categoryConfig[arc.category];
                        return (
                            <motion.path
                                key={arc.category}
                                d={describeArc(cx, cy, radius, arc.startAngle, arc.endAngle - 1)}
                                fill="none"
                                stroke={config.colors.icon}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{
                                    duration: 0.8,
                                    delay: index * 0.15,
                                    ease: 'easeOut'
                                }}
                                style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
                                onClick={() => onCategoryClick?.(arc.category)}
                            />
                        );
                    })}
                </svg>

                {/* Center total */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.3 }}
                        className="text-center"
                    >
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                            {t('home.monthlyTotal')}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {formatCurrencyCompact(totalMonthly, displayCurrency)}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Category Legend */}
            <div className="grid grid-cols-2 gap-3 mt-6 w-full max-w-xs">
                {categoryOrder.map((category, index) => {
                    const config = categoryConfig[category];
                    const amount = categoryTotals[category];
                    const percentage = totalMonthly > 0 ? (amount / totalMonthly) * 100 : 0;
                    const Icon = iconComponents[config.icon as keyof typeof iconComponents];

                    if (amount === 0) return null;

                    return (
                        <motion.button
                            key={category}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            onClick={() => onCategoryClick?.(category)}
                            className="flex items-center gap-2 p-3 rounded-xl transition-all hover:scale-105 active:scale-95"
                            style={{ backgroundColor: config.colors.bg }}
                        >
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${config.colors.icon}20` }}
                            >
                                <Icon size={16} style={{ color: config.colors.icon }} />
                            </div>
                            <div className="text-left flex-1 min-w-0">
                                <p className="text-xs font-medium truncate" style={{ color: config.colors.text }}>
                                    {t(config.label as any)}
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                    {formatCurrencyCompact(amount, displayCurrency)}
                                </p>
                            </div>
                            <div
                                className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                                style={{ backgroundColor: `${config.colors.icon}15`, color: config.colors.text }}
                            >
                                {percentage.toFixed(0)}%
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
