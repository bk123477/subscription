'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown, Calendar, Tag, DollarSign, Clock } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export type SortOption = 'amount-desc' | 'amount-asc' | 'name' | 'next-payment' | 'category' | 'currency' | 'start-date';

interface SortMenuProps {
    value: SortOption;
    onChange: (value: SortOption) => void;
}

const sortOptions: { value: SortOption; icon: typeof ArrowUp; labelKey: string; group?: string }[] = [
    { value: 'amount-desc', icon: ArrowDown, labelKey: 'manage.sortAmount', group: 'amount' },
    { value: 'amount-asc', icon: ArrowUp, labelKey: 'manage.sortAmount', group: 'amount' },
    { value: 'name', icon: ArrowUpDown, labelKey: 'manage.sortName' },
    { value: 'next-payment', icon: Calendar, labelKey: 'manage.sortNextPayment' },
    { value: 'category', icon: Tag, labelKey: 'manage.sortCategory' },
    { value: 'currency', icon: DollarSign, labelKey: 'manage.sortCurrency' },
    { value: 'start-date', icon: Clock, labelKey: 'manage.sortStartDate' },
];

export function SortMenu({ value, onChange }: SortMenuProps) {
    const { t } = useTranslation();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-11 gap-2 rounded-xl">
                    <ArrowUpDown size={16} />
                    <span className="hidden sm:inline">{t('manage.sortBy')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {sortOptions.map((option, index) => {
                    const Icon = option.icon;
                    const showSeparator = index === 1; // After amount options
                    return (
                        <div key={option.value}>
                            <DropdownMenuItem
                                onClick={() => onChange(option.value)}
                                className={value === option.value ? 'bg-blue-50 text-blue-600' : ''}
                            >
                                <Icon size={16} className="mr-2" />
                                {t(option.labelKey as any)}
                                {option.value.includes('desc') && ' ↓'}
                                {option.value.includes('asc') && ' ↑'}
                            </DropdownMenuItem>
                            {showSeparator && <DropdownMenuSeparator />}
                        </div>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
