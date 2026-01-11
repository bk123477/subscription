'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown, Calendar, Tag } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export type SortOption = 'amount-desc' | 'amount-asc' | 'name' | 'next-payment' | 'category';

interface SortMenuProps {
    value: SortOption;
    onChange: (value: SortOption) => void;
}

const sortOptions: { value: SortOption; icon: typeof ArrowUp; labelKey: string }[] = [
    { value: 'amount-desc', icon: ArrowDown, labelKey: 'manage.sortAmount' },
    { value: 'amount-asc', icon: ArrowUp, labelKey: 'manage.sortAmount' },
    { value: 'name', icon: ArrowUpDown, labelKey: 'manage.sortName' },
    { value: 'next-payment', icon: Calendar, labelKey: 'manage.sortNextPayment' },
    { value: 'category', icon: Tag, labelKey: 'manage.sortCategory' },
];

export function SortMenu({ value, onChange }: SortMenuProps) {
    const { t } = useTranslation();

    const currentOption = sortOptions.find((o) => o.value === value) || sortOptions[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 rounded-xl">
                    <ArrowUpDown size={16} />
                    <span className="hidden sm:inline">{t('manage.sortBy')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {sortOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                        <DropdownMenuItem
                            key={option.value}
                            onClick={() => onChange(option.value)}
                            className={value === option.value ? 'bg-gray-100' : ''}
                        >
                            <Icon size={16} className="mr-2" />
                            {t(option.labelKey as any)}
                            {option.value.includes('desc') && ' ↓'}
                            {option.value.includes('asc') && ' ↑'}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
