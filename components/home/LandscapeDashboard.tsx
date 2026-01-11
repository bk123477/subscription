'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Category, Subscription } from '@/lib/db';
import { categoryConfig } from '@/lib/theme';
import { formatCurrencyCompact } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';
import { useFx } from '@/lib/FxContext';
import { monthlyEquivalentAmountConverted } from '@/lib/calc';

interface LandscapeDashboardProps {
    subscriptions: Subscription[];
    totalMonthly: number;
    onCategoryClick?: (category: Category) => void;
}

// Compact island positions for map-like layout
const islandLayout: Record<Category, { x: number; y: number; size: number }> = {
    'AI': { x: 22, y: 25, size: 1 },
    'ENTERTAIN': { x: 78, y: 30, size: 1 },
    'MEMBERSHIP': { x: 30, y: 72, size: 1 },
    'OTHER': { x: 72, y: 75, size: 1 },
};

export function LandscapeDashboard({
    subscriptions,
    totalMonthly,
    onCategoryClick
}: LandscapeDashboardProps) {
    const { t } = useTranslation();
    const { displayCurrency, fxRates } = useFx();
    const [hoveredCategory, setHoveredCategory] = useState<Category | null>(null);

    // Calculate category totals
    const categoryData = useMemo(() => {
        const totals: Record<Category, number> = {
            'AI': 0,
            'ENTERTAIN': 0,
            'MEMBERSHIP': 0,
            'OTHER': 0,
        };

        subscriptions
            .filter(s => s.isActive)
            .forEach(sub => {
                const converted = monthlyEquivalentAmountConverted(sub, displayCurrency, fxRates);
                totals[sub.category] += converted;
            });

        return (['AI', 'ENTERTAIN', 'MEMBERSHIP', 'OTHER'] as Category[]).map(cat => ({
            category: cat,
            amount: totals[cat],
            percent: totalMonthly > 0 ? (totals[cat] / totalMonthly) * 100 : 0,
            config: categoryConfig[cat],
            layout: islandLayout[cat],
        }));
    }, [subscriptions, totalMonthly, displayCurrency, fxRates]);

    const handleIslandClick = (category: Category) => {
        onCategoryClick?.(category);
    };

    const handleKeyDown = (e: React.KeyboardEvent, category: Category) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleIslandClick(category);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="px-4"
        >
            {/* Compact Map Card */}
            <div
                className="relative rounded-2xl shadow-sm overflow-hidden"
                style={{
                    height: '180px',
                    background: 'linear-gradient(180deg, #E0F2FE 0%, #BAE6FD 50%, #7DD3FC 100%)',
                }}
            >
                {/* Water pattern */}
                <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
                    <defs>
                        <pattern id="water-waves" width="60" height="20" patternUnits="userSpaceOnUse">
                            <path d="M0 10 Q15 0 30 10 T60 10" fill="none" stroke="#0369A1" strokeWidth="1" opacity="0.3" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#water-waves)" />
                </svg>

                {/* Islands */}
                <svg className="absolute inset-0 w-full h-full">
                    {categoryData.map(({ category, amount, percent, config, layout }, index) => {
                        const baseSize = 28 + Math.min(percent, 40) * 0.6;
                        const isHovered = hoveredCategory === category;
                        const ariaLabel = `${t(config.label as any)}, ${formatCurrencyCompact(amount, displayCurrency)}, ${percent.toFixed(0)}%`;

                        return (
                            <g
                                key={category}
                                role="button"
                                tabIndex={0}
                                aria-label={ariaLabel}
                                style={{ cursor: 'pointer', outline: 'none' }}
                                onClick={() => handleIslandClick(category)}
                                onPointerUp={() => handleIslandClick(category)}
                                onPointerEnter={() => setHoveredCategory(category)}
                                onPointerLeave={() => setHoveredCategory(null)}
                                onKeyDown={(e) => handleKeyDown(e, category)}
                            >
                                {/* Invisible hit area - largest clickable zone */}
                                <ellipse
                                    cx={`${layout.x}%`}
                                    cy={`${layout.y}%`}
                                    rx={baseSize + 10}
                                    ry={baseSize * 0.5 + 6}
                                    fill="transparent"
                                    style={{ pointerEvents: 'all' }}
                                />

                                {/* Island shadow */}
                                <motion.ellipse
                                    cx={`${layout.x + 1}%`}
                                    cy={`${layout.y + 3}%`}
                                    rx={baseSize + 4}
                                    ry={baseSize * 0.5 + 2}
                                    fill="rgba(0,0,0,0.08)"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: index * 0.08 }}
                                    style={{ pointerEvents: 'none' }}
                                />

                                {/* Island base - outer ring */}
                                <motion.ellipse
                                    cx={`${layout.x}%`}
                                    cy={`${layout.y}%`}
                                    rx={baseSize + 6}
                                    ry={baseSize * 0.5 + 3}
                                    fill={config.colors.icon}
                                    opacity={isHovered ? 0.35 : 0.2}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: index * 0.08 + 0.02 }}
                                    style={{ pointerEvents: 'none' }}
                                />

                                {/* Island middle */}
                                <motion.ellipse
                                    cx={`${layout.x}%`}
                                    cy={`${layout.y}%`}
                                    rx={baseSize + 2}
                                    ry={baseSize * 0.5 + 1}
                                    fill={config.colors.icon}
                                    opacity={isHovered ? 0.55 : 0.4}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: index * 0.08 + 0.04 }}
                                    style={{ pointerEvents: 'none' }}
                                />

                                {/* Island core */}
                                <motion.ellipse
                                    cx={`${layout.x}%`}
                                    cy={`${layout.y}%`}
                                    rx={baseSize - 2}
                                    ry={baseSize * 0.5 - 1}
                                    fill={config.colors.icon}
                                    initial={{ scale: 0 }}
                                    animate={{
                                        scale: isHovered ? 1.05 : 1,
                                    }}
                                    transition={{ delay: index * 0.08 + 0.06 }}
                                    style={{ pointerEvents: 'none' }}
                                />

                                {/* Contour lines */}
                                {[0.7, 0.5].map((scale, i) => (
                                    <motion.ellipse
                                        key={i}
                                        cx={`${layout.x}%`}
                                        cy={`${layout.y - 1}%`}
                                        rx={(baseSize - 2) * scale}
                                        ry={(baseSize * 0.5 - 1) * scale}
                                        fill="none"
                                        stroke="rgba(255,255,255,0.4)"
                                        strokeWidth="0.5"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: index * 0.08 + 0.1 + i * 0.02 }}
                                        style={{ pointerEvents: 'none' }}
                                    />
                                ))}
                            </g>
                        );
                    })}
                </svg>

                {/* Corner Labels - pointer-events-none so SVG islands receive clicks */}
                <div className="absolute inset-0 p-3 pointer-events-none">
                    {categoryData.map(({ category, amount, percent, config, layout }) => {
                        const isLeft = layout.x < 50;
                        const isTop = layout.y < 50;
                        const isHovered = hoveredCategory === category;
                        const ariaLabel = `${t(config.label as any)}, ${formatCurrencyCompact(amount, displayCurrency)}, ${percent.toFixed(0)}%`;

                        return (
                            <div
                                key={category}
                                className="absolute"
                                style={{
                                    [isLeft ? 'left' : 'right']: '8px',
                                    [isTop ? 'top' : 'bottom']: isTop ? '8px' : '12px',
                                }}
                            >
                                <button
                                    className="px-2 py-1 rounded-lg text-xs font-medium shadow-sm transition-all pointer-events-auto"
                                    style={{
                                        backgroundColor: isHovered ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.9)',
                                        color: config.colors.icon,
                                        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => handleIslandClick(category)}
                                    onPointerEnter={() => setHoveredCategory(category)}
                                    onPointerLeave={() => setHoveredCategory(null)}
                                    aria-label={ariaLabel}
                                >
                                    <span>{t(config.label as any)}</span>
                                    <span className="ml-1 opacity-70">
                                        {formatCurrencyCompact(amount, displayCurrency)}
                                    </span>
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Center total */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm">
                        <p className="text-xs text-gray-600">{t('home.monthlyTotal')}</p>
                        <p className="text-lg font-bold text-gray-900">
                            {formatCurrencyCompact(totalMonthly, displayCurrency)}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
