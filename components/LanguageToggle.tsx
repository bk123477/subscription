'use client';

import { Globe } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function LanguageToggle() {
    const { language, setLanguage } = useLanguage();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <Globe size={18} />
                    <span>{language === 'en' ? 'EN' : '한국어'}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => setLanguage('en')}
                    className={language === 'en' ? 'bg-gray-100' : ''}
                >
                    English
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setLanguage('ko')}
                    className={language === 'ko' ? 'bg-gray-100' : ''}
                >
                    한국어
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
