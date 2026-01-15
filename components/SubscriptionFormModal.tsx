'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Tag, Calendar, CreditCard } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { Category, BillingCycle, Currency, Subscription, addSubscription, updateSubscription, deleteSubscription, endSubscription, reactivateSubscription } from '@/lib/db';
import { PaymentMethodManager } from './PaymentMethodManager';
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

type SubscriptionType = 'MONTHLY' | 'YEARLY' | 'TRIAL';

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
    const [contactType, setContactType] = useState<SubscriptionType>('MONTHLY');
    // Using internal 'billingCycle' state for the *result* or *renewal* cycle
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');

    const [billingDay, setBillingDay] = useState(1);
    const [billingMonth, setBillingMonth] = useState(1);
    const [notes, setNotes] = useState('');
    const [freeUntil, setFreeUntil] = useState('');
    const [startedAt, setStartedAt] = useState('');
    const [serviceUrl, setServiceUrl] = useState('');
    const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
    const [promoAmount, setPromoAmount] = useState('');
    const [promoUntil, setPromoUntil] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; amount?: string; freeUntil?: string }>({});

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
            setBillingDay(subscription.billingDay);
            setBillingMonth(subscription.billingMonth ?? 1);
            setNotes(subscription.notes ?? '');

            // Determine type
            if (subscription.freeUntil) {
                setContactType('TRIAL');
                setFreeUntil(subscription.freeUntil.split('T')[0]);
                setBillingCycle(subscription.billingCycle); // Renewal cycle
            } else {
                setContactType(subscription.billingCycle === 'MONTHLY' ? 'MONTHLY' : 'YEARLY');
                setBillingCycle(subscription.billingCycle);
                setFreeUntil('');
            }

            // Set startedAt
            if (subscription.startedAt) {
                setStartedAt(subscription.startedAt.split('T')[0]);
            } else {
                setStartedAt('');
            }

            // Set serviceUrl
            setServiceUrl(subscription.serviceUrl || '');

            // Set paymentMethodId
            setPaymentMethodId(subscription.paymentMethodId || null);

            // Set promo fields
            setPromoAmount(subscription.promoAmount?.toString() || '');
            setPromoUntil(subscription.promoUntil ? subscription.promoUntil.split('T')[0] : '');
        } else {
            // Defaults
            setName('');
            setCategory('OTHER');
            setAmount('');
            setCurrency('USD');
            setContactType('MONTHLY');
            setBillingCycle('MONTHLY');
            setBillingDay(1);
            setBillingMonth(1);
            setNotes('');
            setFreeUntil('');
            setStartedAt('');
            setServiceUrl('');
            setPaymentMethodId(null);
            setPromoAmount('');
            setPromoUntil('');
        }
        setErrors({});
    }, [subscription, isOpen]);

    // Update billing day when freeUntil changes (if in Trial mode)
    useEffect(() => {
        if (contactType === 'TRIAL' && freeUntil) {
            const parts = freeUntil.split('-');
            if (parts.length === 3) {
                setBillingDay(parseInt(parts[2]));
            }
        }
    }, [freeUntil, contactType]);

    const validate = (): boolean => {
        const newErrors: { name?: string; amount?: string; freeUntil?: string } = {};

        if (!name.trim()) {
            newErrors.name = t('form.required');
        }

        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            newErrors.amount = t('form.required');
        }

        if (contactType === 'TRIAL' && !freeUntil) {
            newErrors.freeUntil = t('form.required');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        setIsLoading(true);
        try {
            // Determine final billing cycle and freeUntil
            let finalBillingCycle: BillingCycle = 'MONTHLY';
            let finalFreeUntil: string | null = null;

            if (contactType === 'TRIAL') {
                finalBillingCycle = billingCycle; // The renewal cycle selected
                finalFreeUntil = new Date(freeUntil).toISOString();
            } else {
                finalBillingCycle = contactType === 'MONTHLY' ? 'MONTHLY' : 'YEARLY';
                finalFreeUntil = null;
            }

            const data = {
                name: name.trim(),
                category,
                amount: parseFloat(amount),
                currency,
                billingCycle: finalBillingCycle,
                billingDay,
                billingMonth: finalBillingCycle === 'YEARLY' ? billingMonth : undefined,
                notes: notes.trim() || undefined,
                freeUntil: finalFreeUntil,
                startedAt: startedAt ? new Date(startedAt).toISOString() : null,
                serviceUrl: serviceUrl.trim() || null,
                paymentMethodId: paymentMethodId || null,
                promoAmount: promoAmount ? parseFloat(promoAmount) : null,
                promoUntil: promoUntil ? new Date(promoUntil).toISOString() : null,
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

                                {/* Type Selector */}
                                <div className="space-y-2">
                                    <Label>{t('form.billingCycle')}</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['MONTHLY', 'YEARLY', 'TRIAL'] as const).map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setContactType(type)}
                                                className={`p-3 rounded-xl font-medium transition-all text-sm ${contactType === type
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                {type === 'TRIAL' ? t('form.freeTrial') : t(`form.${type.toLowerCase()}` as any)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Render based on Type */}
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={contactType}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="space-y-5"
                                    >
                                        {contactType === 'TRIAL' ? (
                                            <>
                                                {/* Free Trial End Date */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="freeUntil">{t('form.freeTrialEnd')}</Label>
                                                    <Input
                                                        id="freeUntil"
                                                        type="date"
                                                        value={freeUntil}
                                                        onChange={(e) => setFreeUntil(e.target.value)}
                                                        className={`w-full block ${errors.freeUntil ? 'border-red-300' : ''}`}
                                                    />
                                                    <p className="text-xs text-gray-500">
                                                        {t('form.billingDay')} will be set to this date.
                                                    </p>
                                                    {errors.freeUntil && (
                                                        <p className="text-xs text-red-500">{errors.freeUntil}</p>
                                                    )}
                                                </div>

                                                <div className="p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-100">
                                                    <h3 className="text-sm font-semibold text-gray-900">After Trial Ends</h3>

                                                    {/* Renewal Cycle */}
                                                    <div className="space-y-2">
                                                        <Label>{t('form.billingCycle')}</Label>
                                                        <div className="flex bg-white rounded-lg p-1 border">
                                                            {(['MONTHLY', 'YEARLY'] as const).map((cycle) => (
                                                                <button
                                                                    key={cycle}
                                                                    onClick={() => setBillingCycle(cycle)}
                                                                    className={`flex-1 py-1.5 text-sm rounded-md transition-all ${billingCycle === cycle
                                                                        ? 'bg-gray-100 font-semibold text-gray-900'
                                                                        : 'text-gray-500 hover:text-gray-900'
                                                                        }`}
                                                                >
                                                                    {t(`form.${cycle.toLowerCase()}` as any)}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Renewal Amount with Currency */}
                                                    <div className="space-y-2">
                                                        <Label htmlFor="amount">{t('form.amount')}</Label>
                                                        <div className="flex gap-2">
                                                            <div className="flex rounded-lg overflow-hidden border">
                                                                <button
                                                                    onClick={() => setCurrency('USD')}
                                                                    className={`px-3 py-2 text-sm font-medium transition-colors ${currency === 'USD' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                                                >
                                                                    USD
                                                                </button>
                                                                <div className="w-px bg-gray-100" />
                                                                <button
                                                                    onClick={() => setCurrency('KRW')}
                                                                    className={`px-3 py-2 text-sm font-medium transition-colors ${currency === 'KRW' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                                                >
                                                                    KRW
                                                                </button>
                                                            </div>
                                                            <div className="relative flex-1">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                                    {currency === 'KRW' ? '₩' : '$'}
                                                                </span>
                                                                <Input
                                                                    id="amount"
                                                                    type="number"
                                                                    step={currency === 'KRW' ? '100' : '0.01'}
                                                                    value={amount}
                                                                    onChange={(e) => setAmount(e.target.value)}
                                                                    className={`pl-7 bg-white ${errors.amount ? 'border-red-300' : ''}`}
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {/* Amount and Currency */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="amount">{t('form.amount')}</Label>
                                                    <div className="flex gap-2">
                                                        <div className="flex rounded-lg overflow-hidden border border-gray-200">
                                                            <button
                                                                onClick={() => setCurrency('USD')}
                                                                className={`px-3 py-2 text-sm font-medium transition-colors ${currency === 'USD' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                                            >
                                                                USD
                                                            </button>
                                                            <div className="w-px bg-gray-200" />
                                                            <button
                                                                onClick={() => setCurrency('KRW')}
                                                                className={`px-3 py-2 text-sm font-medium transition-colors ${currency === 'KRW' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                                            >
                                                                KRW
                                                            </button>
                                                        </div>
                                                        <div className="relative flex-1">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                                {currency === 'KRW' ? '₩' : '$'}
                                                            </span>
                                                            <Input
                                                                id="amount"
                                                                type="number"
                                                                step={currency === 'KRW' ? '100' : '0.01'}
                                                                value={amount}
                                                                onChange={(e) => setAmount(e.target.value)}
                                                                className={`pl-7 ${errors.amount ? 'border-red-300' : ''}`}
                                                                placeholder="0.00"
                                                            />
                                                        </div>
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
                                                        <SelectContent className="z-[200]">
                                                            {billingDays.map((day) => (
                                                                <SelectItem key={day} value={day.toString()}>
                                                                    {day}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Billing Month (Yearly only) */}
                                                {contactType === 'YEARLY' && (
                                                    <div className="space-y-2">
                                                        <Label>{t('form.billingMonth')}</Label>
                                                        <Select
                                                            value={billingMonth.toString()}
                                                            onValueChange={(v) => setBillingMonth(parseInt(v))}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="z-[200]">
                                                                {billingMonths.map((month) => (
                                                                    <SelectItem key={month} value={month.toString()}>
                                                                        {t(`month.${month}` as any)}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </motion.div>
                                </AnimatePresence>

                                {/* Service URL (optional, for logo) */}
                                <div className="space-y-2">
                                    <Label htmlFor="serviceUrl">{t('form.serviceUrl')}</Label>
                                    <Input
                                        id="serviceUrl"
                                        type="url"
                                        value={serviceUrl}
                                        onChange={(e) => setServiceUrl(e.target.value)}
                                        placeholder="https://netflix.com"
                                        className="w-full"
                                    />
                                    <p className="text-xs text-gray-500">
                                        {t('form.serviceUrlHint')}
                                    </p>
                                </div>

                                {/* Payment Method Selector */}
                                <div className="space-y-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <CreditCard size={16} />
                                        {t('form.paymentMethod')}
                                    </div>
                                    <PaymentMethodManager
                                        selectedId={paymentMethodId}
                                        onSelect={setPaymentMethodId}
                                        mode="select"
                                    />
                                </div>

                                {/* Promotional Discount (Optional) */}
                                <div className="space-y-4 p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                                        <Tag size={16} />
                                        {t('form.promoSection')}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="promoAmount" className="text-xs">{t('form.promoAmount')}</Label>
                                            <Input
                                                id="promoAmount"
                                                type="number"
                                                value={promoAmount}
                                                onChange={(e) => setPromoAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="promoUntil" className="text-xs">{t('form.promoUntil')}</Label>
                                            <Input
                                                id="promoUntil"
                                                type="date"
                                                value={promoUntil}
                                                onChange={(e) => setPromoUntil(e.target.value)}
                                                className="bg-white"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 italic">
                                        {t('form.promoHint')}
                                    </p>
                                </div>

                                {/* Subscription Start Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="startedAt">{t('form.startedAt')}</Label>
                                    <Input
                                        id="startedAt"
                                        type="date"
                                        value={startedAt}
                                        onChange={(e) => setStartedAt(e.target.value)}
                                        className="w-full"
                                    />
                                    <p className="text-xs text-gray-500">
                                        {t('form.startedAtHint')}
                                    </p>
                                </div>

                                {/* Notes */}
                                <Input
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder={t('form.notesPlaceholder')}
                                />
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
