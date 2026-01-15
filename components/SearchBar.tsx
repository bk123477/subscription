'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Category } from '@/lib/db';
import { categoryConfig } from '@/lib/theme';
import { motion, AnimatePresence } from 'framer-motion';

export interface SearchFilters {
    query: string;
    category: Category | 'ALL';
    minAmount?: number;
    maxAmount?: number;
}

interface SearchBarProps {
    value: SearchFilters;
    onChange: (value: SearchFilters) => void;
}

const categories: (Category | 'ALL')[] = ['ALL', 'AI', 'ENTERTAIN', 'MEMBERSHIP', 'OTHER'];

export function SearchBar({ value, onChange }: SearchBarProps) {
    const { t } = useTranslation();
    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    // Close filters on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setShowFilters(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const hasActiveFilters = value.category !== 'ALL' || value.minAmount || value.maxAmount;

    return (
        <div className="space-y-2" ref={filterRef}>
            <div className="flex gap-2">
                {/* Search Input */}
                <div className="relative flex-1">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <Input
                        value={value.query}
                        onChange={(e) => onChange({ ...value, query: e.target.value })}
                        placeholder={t('manage.search')}
                        className="pl-10 pr-10 h-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white"
                    />
                    {value.query && (
                        <button
                            onClick={() => onChange({ ...value, query: '' })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 transition-colors"
                        >
                            <X size={16} className="text-gray-400" />
                        </button>
                    )}
                </div>

                {/* Filter Button */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`h-11 px-3 rounded-xl border flex items-center gap-1 transition-colors ${hasActiveFilters
                            ? 'bg-blue-50 border-blue-200 text-blue-600'
                            : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                        }`}
                >
                    <Filter size={16} />
                    <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    {hasActiveFilters && (
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                </button>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 bg-white rounded-xl border border-gray-100 space-y-4">
                            {/* Category Filter */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                    {t('form.category')}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((cat) => {
                                        const isSelected = value.category === cat;
                                        const config = cat !== 'ALL' ? categoryConfig[cat] : null;
                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => onChange({ ...value, category: cat })}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isSelected
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {cat === 'ALL' ? t('manage.filterAll') : t(config!.label as any)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Amount Range */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                    {t('manage.amountRange')}
                                </label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        placeholder={t('manage.min')}
                                        value={value.minAmount || ''}
                                        onChange={(e) => onChange({
                                            ...value,
                                            minAmount: e.target.value ? Number(e.target.value) : undefined
                                        })}
                                        className="h-9 flex-1"
                                    />
                                    <span className="text-gray-400">–</span>
                                    <Input
                                        type="number"
                                        placeholder={t('manage.max')}
                                        value={value.maxAmount || ''}
                                        onChange={(e) => onChange({
                                            ...value,
                                            maxAmount: e.target.value ? Number(e.target.value) : undefined
                                        })}
                                        className="h-9 flex-1"
                                    />
                                </div>
                            </div>

                            {/* Clear Filters */}
                            {hasActiveFilters && (
                                <button
                                    onClick={() => onChange({
                                        query: value.query,
                                        category: 'ALL',
                                        minAmount: undefined,
                                        maxAmount: undefined
                                    })}
                                    className="text-sm text-blue-500 hover:text-blue-600"
                                >
                                    {t('manage.clearFilters')}
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
