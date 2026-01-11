import { format } from 'date-fns';
import { enUS, ko } from 'date-fns/locale';
import { Currency } from './db';

type Language = 'en' | 'ko';

const locales = {
    en: enUS,
    ko: ko
};

/**
 * Format currency amount with proper symbol and formatting
 */
export function formatCurrency(
    amount: number,
    currency: Currency = 'USD',
    language: Language = 'en'
): string {
    if (currency === 'KRW') {
        // KRW: no decimals, use ₩ symbol
        const rounded = Math.round(amount);
        const formatted = rounded.toLocaleString('ko-KR');
        return `₩${formatted}`;
    }

    // USD: 2 decimal places, use $ symbol
    const rounded = Math.round(amount * 100) / 100;
    const formatted = rounded.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return `$${formatted}`;
}

/**
 * Format currency without decimals (for compact display)
 */
export function formatCurrencyCompact(
    amount: number,
    currency: Currency = 'USD'
): string {
    const rounded = Math.round(amount);
    if (currency === 'KRW') {
        return `₩${rounded.toLocaleString('ko-KR')}`;
    }
    return `$${rounded.toLocaleString('en-US')}`;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
    return currency === 'KRW' ? '₩' : '$';
}

/**
 * Format date according to language
 */
export function formatDate(date: Date, formatStr: string, language: Language = 'en'): string {
    return format(date, formatStr, { locale: locales[language] });
}

/**
 * Format date for display (short format)
 */
export function formatDateShort(date: Date, language: Language = 'en'): string {
    if (language === 'ko') {
        return format(date, 'M월 d일', { locale: locales[language] });
    }
    return format(date, 'MMM d', { locale: locales[language] });
}

/**
 * Format date for display (medium format)
 */
export function formatDateMedium(date: Date, language: Language = 'en'): string {
    if (language === 'ko') {
        return format(date, 'yyyy년 M월 d일', { locale: locales[language] });
    }
    return format(date, 'MMM d, yyyy', { locale: locales[language] });
}

/**
 * Format date for display (day of week)
 */
export function formatDayOfWeek(date: Date, language: Language = 'en'): string {
    return format(date, 'EEE', { locale: locales[language] });
}

/**
 * Format month name
 */
export function formatMonthName(month: number, language: Language = 'en'): string {
    const date = new Date(2024, month - 1, 1);
    if (language === 'ko') {
        return format(date, 'M월', { locale: locales[language] });
    }
    return format(date, 'MMMM', { locale: locales[language] });
}

/**
 * Format today's date for display
 */
export function formatTodayDate(language: Language = 'en'): string {
    const today = new Date();
    if (language === 'ko') {
        return format(today, 'yyyy년 M월 d일', { locale: locales[language] });
    }
    return format(today, 'MMM d, yyyy', { locale: locales[language] });
}

/**
 * Format FX rate update time
 */
export function formatFxUpdateTime(date: Date, language: Language = 'en'): string {
    if (language === 'ko') {
        return format(date, 'M월 d일 HH:mm', { locale: locales[language] });
    }
    return format(date, 'MMM d, HH:mm', { locale: locales[language] });
}

/**
 * Get the locale object for date-fns
 */
export function getDateLocale(language: Language) {
    return locales[language];
}

/**
 * Format large KRW amounts in a readable way (e.g., 1,234,567 -> 123만)
 */
export function formatKRWCompact(amount: number): string {
    if (amount >= 10000) {
        const man = Math.round(amount / 10000);
        return `₩${man.toLocaleString('ko-KR')}만`;
    }
    return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
}
