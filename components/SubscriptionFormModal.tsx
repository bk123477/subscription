'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { Category, BillingCycle, Currency, Subscription, addSubscription, updateSubscription, deleteSubscription, endSubscription, reactivateSubscription } from '@/lib/db';
import { categoryConfig, colors } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useScrollLock } from '@/lib/useScrollLock';

interface SubscriptionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    subscription?: Subscription | null;
}

const categories: Category[] = ['AI', 'ENTERTAIN', 'MEMBERSHIP', 'OTHER'];
const billingDays = Array.from({ length: 31 }, (_, i) => i + 1);
const billingMonths = Array.from({ length: 12 }, (_, i) => i + 1);

export function SubscriptionFormModal({
    isOpen,
    onClose,
    onSave,
    subscription,
}: SubscriptionFormModalProps) {
    const { t, language } = useTranslation();
    const isEditing = !!subscription;
    const { lockScroll, unlockScroll } = useScrollLock();

    const [name, setName] = useState('');
    const [category, setCategory] = useState<Category>('OTHER');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState<Currency>('USD');
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
    const [billingDay, setBillingDay] = useState(1);
    const [billingMonth, setBillingMonth] = useState(1);
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; amount?: string }>({});

    useEffect(() => {
        if (isOpen) {
            lockScroll();
        } else {
            unlockScroll();
        }
    }, [isOpen, lockScroll, unlockScroll]);

    // Reset form when subscription changes
    useEffect(() => {
        if (subscription) {
            setName(subscription.name);
            setCategory(subscription.category);
            setAmount(subscription.amount.toString());
            setCurrency(subscription.currency || 'USD');
            setBillingCycle(subscription.billingCycle);
            setBillingDay(subscription.billingDay);
            setBillingMonth(subscription.billingMonth ?? 1);
            setNotes(subscription.notes ?? '');
        } else {
            setName('');
            setCategory('OTHER');
            setAmount('');
            setCurrency('USD');
            setBillingCycle('MONTHLY');
            setBillingDay(1);
            setBillingMonth(1);
            setNotes('');
        }
        setErrors({});
    }, [subscription, isOpen]);

    const validate = (): boolean => {
        const newErrors: { name?: string; amount?: string } = {};

        if (!name.trim()) {
            newErrors.name = t('form.required');
        }

        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            newErrors.amount = t('form.required');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        setIsLoading(true);
        try {
            const data = {
                name: name.trim(),
                category,
                amount: parseFloat(amount),
                currency,
                billingCycle,
                billingDay,
                billingMonth: billingCycle === 'YEARLY' ? billingMonth : undefined,
                notes: notes.trim() || undefined,
                isActive: true,
            };

            if (isEditing && subscription) {
                await updateSubscription(subscription.id, data);
            } else {
                await addSubscription(data);
            }

            onSave();
            onClose();
        } catch (error) {
            console.error('Failed to save subscription:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!subscription) return;

        setIsLoading(true);
        try {
            await deleteSubscription(subscription.id);
            onSave();
            onClose();
        } catch (error) {
            console.error('Failed to delete subscription:', error);
        } finally {
            setIsLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm"
                        onClick={(e) => e.target === e.currentTarget && onClose()}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="w-full max-w-lg bg-white rounded-t-3xl max-h-[90vh] sheet-scroll"
                        >
                            {/* Header */}
                            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-100 bg-white">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {isEditing ? t('manage.editSubscription') : t('manage.addSubscription')}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            {/* Form */}
                            <div className="p-4 space-y-5 pb-40">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t('form.name')}</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder={t('form.namePlaceholder')}
                                        className={errors.name ? 'border-red-300' : ''}
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-red-500">{errors.name}</p>
                                    )}
                                </div>

                                {/* Category */}
                                <div className="space-y-2">
                                    <Label>{t('form.category')}</Label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {categories.map((cat) => {
                                            const config = categoryConfig[cat];
                                            const isSelected = category === cat;
                                            return (
                                                <button
                                                    key={cat}
                                                    onClick={() => setCategory(cat)}
                                                    className={`p-3 rounded-xl border-2 transition-all ${isSelected
                                                        ? 'border-current'
                                                        : 'border-transparent'
                                                        }`}
                                                    style={{
                                                        backgroundColor: config.colors.bg,
                                                        color: config.colors.text,
                                                        borderColor: isSelected ? config.colors.icon : 'transparent',
                                                    }}
                                                >
                                                    <span className="text-xs font-medium">
                                                        {t(config.label as any)}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Currency */}
                                <div className="space-y-2">
                                    <Label>{t('form.currency')}</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setCurrency('USD')}
                                            className={`p-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${currency === 'USD'
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            <span className="text-lg">$</span>
                                            <span>USD</span>
                                        </button>
                                        <button
                                            onClick={() => setCurrency('KRW')}
                                            className={`p-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${currency === 'KRW'
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            <span className="text-lg">₩</span>
                                            <span>KRW</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="space-y-2">
                                    <Label htmlFor="amount">{t('form.amount')}</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            {currency === 'KRW' ? '₩' : '$'}
                                        </span>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step={currency === 'KRW' ? '100' : '0.01'}
                                            min="0"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className={`pl-7 ${errors.amount ? 'border-red-300' : ''}`}
                                        />
                                    </div>
                                    {errors.amount && (
                                        <p className="text-xs text-red-500">{errors.amount}</p>
                                    )}
                                </div>

                                {/* Billing Cycle */}
                                <div className="space-y-2">
                                    <Label>{t('form.billingCycle')}</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setBillingCycle('MONTHLY')}
                                            className={`p-3 rounded-xl font-medium transition-all ${billingCycle === 'MONTHLY'
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {t('form.monthly')}
                                        </button>
                                        <button
                                            onClick={() => setBillingCycle('YEARLY')}
                                            className={`p-3 rounded-xl font-medium transition-all ${billingCycle === 'YEARLY'
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {t('form.yearly')}
                                        </button>
                                    </div>
                                </div>

                                {/* Billing Day */}
                                <div className="space-y-2">
                                    <Label>{t('form.billingDay')}</Label>
                                    <Select
                                        value={billingDay.toString()}
                                        onValueChange={(v) => setBillingDay(parseInt(v))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {billingDays.map((day) => (
                                                <SelectItem key={day} value={day.toString()}>
                                                    {day}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Billing Month (only for YEARLY) */}
                                {billingCycle === 'YEARLY' && (
                                    <div className="space-y-2">
                                        <Label>{t('form.billingMonth')}</Label>
                                        <Select
                                            value={billingMonth.toString()}
                                            onValueChange={(v) => setBillingMonth(parseInt(v))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {billingMonths.map((month) => (
                                                    <SelectItem key={month} value={month.toString()}>
                                                        {t(`month.${month}` as any)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label htmlFor="notes">{t('form.notes')}</Label>
                                    <Input
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder={t('form.notesPlaceholder')}
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div
                                className="sticky bottom-0 p-4 border-t border-gray-100 bg-white space-y-3"
                                style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
                            >
                                {isEditing && (
                                    <div className="flex flex-col gap-2 mb-2">
                                        {!subscription.endedAt ? (
                                            <Button
                                                variant="outline"
                                                className="w-full text-red-500 border-red-200 hover:bg-red-50"
                                                onClick={() => {
                                                    if (confirm(t('manage.endConfirm'))) {
                                                        endSubscription(subscription.id);
                                                        onClose();
                                                    }
                                                }}
                                            >
                                                <Trash2 size={18} className="mr-2" />
                                                {t('manage.endSubscription')}
                                            </Button>
                                        ) : (
                                            <div className="space-y-2">
                                                <Button
                                                    variant="outline"
                                                    className="w-full text-blue-500 border-blue-200 hover:bg-blue-50"
                                                    onClick={() => {
                                                        reactivateSubscription(subscription.id);
                                                        onClose();
                                                    }}
                                                >
                                                    {t('manage.reactivate')}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="w-full text-xs text-gray-400 hover:text-red-500"
                                                    onClick={() => {
                                                        if (confirm(t('manage.permanentDeleteConfirm'))) {
                                                            deleteSubscription(subscription.id);
                                                            onClose();
                                                        }
                                                    }}
                                                >
                                                    {t('manage.deletePermanent')}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={onClose}
                                    >
                                        {t('form.cancel')}
                                    </Button>
                                    <Button
                                        className="flex-1 bg-blue-500 hover:bg-blue-600"
                                        onClick={handleSave}
                                        disabled={isLoading}
                                    >
                                        {t('form.save')}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete confirmation dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('manage.delete')}</DialogTitle>
                        <DialogDescription>{t('manage.deleteConfirm')}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                            {t('form.cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isLoading}
                        >
                            {t('manage.delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
