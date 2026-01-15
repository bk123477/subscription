'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CreditCard, Building2, Wallet, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import { db, PaymentMethod, addPaymentMethod, updatePaymentMethod, deletePaymentMethod } from '@/lib/db';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/Modal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const typeIcons = {
    credit_card: CreditCard,
    debit_card: CreditCard,
    bank_account: Building2,
    other: Wallet,
};

const typeLabels = {
    credit_card: 'payment.creditCard',
    debit_card: 'payment.debitCard',
    bank_account: 'payment.bankAccount',
    other: 'payment.other',
};

const defaultColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

interface PaymentMethodManagerProps {
    selectedId?: string | null;
    onSelect?: (id: string | null) => void;
    mode?: 'select' | 'manage';
}

export function PaymentMethodManager({ selectedId, onSelect, mode = 'select' }: PaymentMethodManagerProps) {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
    const [name, setName] = useState('');
    const [type, setType] = useState<PaymentMethod['type']>('credit_card');
    const [last4, setLast4] = useState('');
    const [color, setColor] = useState(defaultColors[0]);

    const paymentMethods = useLiveQuery(
        () => db.paymentMethods.toArray(),
        [],
        []
    );

    const handleOpenAdd = () => {
        setEditingMethod(null);
        setName('');
        setType('credit_card');
        setLast4('');
        setColor(defaultColors[0]);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (pm: PaymentMethod) => {
        setEditingMethod(pm);
        setName(pm.name);
        setType(pm.type);
        setLast4(pm.last4 || '');
        setColor(pm.color || defaultColors[0]);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!name.trim()) return;

        if (editingMethod) {
            await updatePaymentMethod(editingMethod.id, { name, type, last4: last4 || undefined, color });
        } else {
            await addPaymentMethod({ name, type, last4: last4 || undefined, color });
        }
        setIsModalOpen(false);
    };

    const handleDelete = async (id: string) => {
        await deletePaymentMethod(id);
        if (selectedId === id && onSelect) {
            onSelect(null);
        }
    };

    return (
        <div className="space-y-3">
            {/* Payment Methods List */}
            <div className="space-y-2">
                {/* None option for select mode */}
                {mode === 'select' && (
                    <button
                        onClick={() => onSelect?.(null)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${!selectedId
                                ? 'border-blue-300 bg-blue-50'
                                : 'border-gray-100 hover:border-gray-200'
                            }`}
                    >
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Wallet size={20} className="text-gray-400" />
                        </div>
                        <span className="font-medium text-gray-600">{t('payment.none')}</span>
                    </button>
                )}

                <AnimatePresence>
                    {paymentMethods?.map((pm) => {
                        const Icon = typeIcons[pm.type];
                        const isSelected = selectedId === pm.id;

                        return (
                            <motion.div
                                key={pm.id}
                                layout
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected
                                        ? 'border-blue-300 bg-blue-50'
                                        : 'border-gray-100 hover:border-gray-200'
                                    }`}
                            >
                                <button
                                    onClick={() => mode === 'select' && onSelect?.(pm.id)}
                                    className="flex-1 flex items-center gap-3"
                                    disabled={mode !== 'select'}
                                >
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                                        style={{ backgroundColor: `${pm.color}20`, color: pm.color }}
                                    >
                                        <Icon size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900">{pm.name}</p>
                                        {pm.last4 && (
                                            <p className="text-xs text-gray-500">•••• {pm.last4}</p>
                                        )}
                                    </div>
                                </button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                                            <MoreHorizontal size={16} className="text-gray-400" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenEdit(pm)}>
                                            <Edit2 size={14} className="mr-2" />
                                            {t('common.edit')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleDelete(pm.id)}
                                            className="text-red-600"
                                        >
                                            <Trash2 size={14} className="mr-2" />
                                            {t('row.delete')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Add Button */}
            <Button
                onClick={handleOpenAdd}
                variant="outline"
                className="w-full gap-2"
            >
                <Plus size={16} />
                {t('payment.addMethod')}
            </Button>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingMethod ? t('payment.editMethod') : t('payment.addMethod')}
            >
                <div className="p-4 space-y-4">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label>{t('payment.methodName')}</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('payment.namePlaceholder')}
                        />
                    </div>

                    {/* Type */}
                    <div className="space-y-2">
                        <Label>{t('payment.methodType')}</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {(Object.keys(typeIcons) as PaymentMethod['type'][]).map((t) => {
                                const Icon = typeIcons[t];
                                return (
                                    <button
                                        key={t}
                                        onClick={() => setType(t)}
                                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${type === t
                                                ? 'border-blue-300 bg-blue-50'
                                                : 'border-gray-100 hover:border-gray-200'
                                            }`}
                                    >
                                        <Icon size={16} />
                                        <span className="text-sm">{t}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Last 4 Digits */}
                    <div className="space-y-2">
                        <Label>{t('payment.last4')}</Label>
                        <Input
                            value={last4}
                            onChange={(e) => setLast4(e.target.value.slice(0, 4))}
                            placeholder="1234"
                            maxLength={4}
                        />
                    </div>

                    {/* Color */}
                    <div className="space-y-2">
                        <Label>{t('payment.color')}</Label>
                        <div className="flex gap-2">
                            {defaultColors.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-110 ring-2 ring-offset-2 ring-blue-500' : ''
                                        }`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Save Button */}
                    <Button onClick={handleSave} className="w-full">
                        {t('form.save')}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
