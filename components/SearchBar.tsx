'use client';

import { Search, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
    const { t } = useTranslation();

    return (
        <div className="relative">
            <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={t('manage.search')}
                className="pl-10 pr-10 h-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white"
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 transition-colors"
                >
                    <X size={16} className="text-gray-400" />
                </button>
            )}
        </div>
    );
}
