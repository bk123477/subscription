'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useScrollLock } from '@/lib/useScrollLock';

interface MonthPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate: Date;
    onSelect: (date: Date) => void;
}

export function MonthPickerModal({
    isOpen,
    onClose,
    currentDate,
    onSelect,
}: MonthPickerModalProps) {
    const { t } = useTranslation();
    const { lockScroll, unlockScroll } = useScrollLock();
    const [year, setYear] = useState(currentDate.getFullYear());

    useEffect(() => {
        if (isOpen) {
            lockScroll();
            setYear(currentDate.getFullYear());
        } else {
            unlockScroll();
        }
    }, [isOpen, currentDate, lockScroll, unlockScroll]);

    const handleMonthSelect = (monthIndex: number) => {
        const newDate = new Date(year, monthIndex, 1);
        onSelect(newDate);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-[101] flex items-center justify-center p-4"
                        style={{ pointerEvents: 'none' }}
                    >
                        <div
                            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl pointer-events-auto flex flex-col max-h-[80vh]"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {t('calendar.selectMonth')}
                                </h3>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            {/* Year Selector */}
                            <div className="flex items-center justify-center gap-6 py-4">
                                <button
                                    onClick={() => setYear((y) => y - 1)}
                                    className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <span className="text-xl font-bold text-gray-900 min-w-[4rem] text-center">
                                    {year}
                                </span>
                                <button
                                    onClick={() => setYear((y) => y + 1)}
                                    className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </div>

                            {/* Month Grid */}
                            <div className="grid grid-cols-3 gap-3 p-4 overflow-y-auto sheet-scroll pb-safe">
                                {Array.from({ length: 12 }, (_, i) => i).map((monthIndex) => {
                                    const isCurrentMonth =
                                        year === currentDate.getFullYear() &&
                                        monthIndex === currentDate.getMonth();

                                    const isTodayMonth =
                                        year === new Date().getFullYear() &&
                                        monthIndex === new Date().getMonth();

                                    return (
                                        <button
                                            key={monthIndex}
                                            onClick={() => handleMonthSelect(monthIndex)}
                                            className={`
                                                relative p-4 rounded-2xl text-sm font-medium transition-all
                                                ${isCurrentMonth
                                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                }
                                            `}
                                        >
                                            {t(`month.${monthIndex + 1}` as any)}
                                            {isTodayMonth && !isCurrentMonth && (
                                                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
