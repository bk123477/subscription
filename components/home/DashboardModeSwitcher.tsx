'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Check, Mountain, Clock, BarChart3 } from 'lucide-react';
import { DashboardMode } from '@/lib/db';
import { useSettings } from '@/lib/useSettings';
import { useTranslation } from '@/lib/i18n';
import { Modal } from '@/components/ui/Modal';

const modeOptions: { mode: DashboardMode; icon: typeof Mountain; labelKey: string; subtitleKey: string }[] = [
    { mode: 'LANDSCAPE', icon: Mountain, labelKey: 'home.view.landscape', subtitleKey: 'home.view.subtitle.landscape' },
    { mode: 'TIME_WHEEL', icon: Clock, labelKey: 'home.view.timeWheel', subtitleKey: 'home.view.subtitle.timeWheel' },
    { mode: 'MINIMAL_KPI', icon: BarChart3, labelKey: 'home.view.minimal', subtitleKey: 'home.view.subtitle.minimal' },
];

export function DashboardModeSwitcher() {
    const { t } = useTranslation();
    const { dashboardMode, setDashboardMode } = useSettings();
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = async (mode: DashboardMode) => {
        await setDashboardMode(mode);
        setIsOpen(false);
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors"
                aria-label={t('home.dashboardView') as string}
            >
                <LayoutGrid size={18} className="text-gray-600" />
            </button>

            {/* Centered Modal */}
            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title={t('home.dashboardView')}
            >
                <div className="p-4 space-y-2">
                    {modeOptions.map(({ mode, icon: Icon, labelKey, subtitleKey }) => {
                        const isSelected = dashboardMode === mode;
                        return (
                            <button
                                key={mode}
                                onClick={() => handleSelect(mode)}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isSelected
                                        ? 'bg-blue-50 border-2 border-blue-200'
                                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                    }`}
                            >
                                {/* Icon */}
                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-100' : 'bg-gray-200'
                                        }`}
                                >
                                    <Icon size={24} className={isSelected ? 'text-blue-600' : 'text-gray-500'} />
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0 text-left">
                                    <p className={`font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                        {t(labelKey as any)}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">
                                        {t(subtitleKey as any)}
                                    </p>
                                </div>

                                {/* Check */}
                                {isSelected && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0"
                                    >
                                        <Check size={14} className="text-white" />
                                    </motion.div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </Modal>
        </>
    );
}
