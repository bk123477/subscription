import { Category } from './db';

// Pastel color palette
export const colors = {
    // Background colors
    background: {
        primary: '#FAFAFA',
        secondary: '#F5F5F5',
        card: '#FFFFFF',
        gradient: {
            from: '#E0F2FE',
            to: '#FCE7F3'
        }
    },

    // Text colors
    text: {
        primary: '#1F2937',
        secondary: '#6B7280',
        tertiary: '#9CA3AF',
        inverse: '#FFFFFF'
    },

    // Category colors
    category: {
        AI: {
            bg: '#DBEAFE',
            bgHover: '#BFDBFE',
            text: '#1D4ED8',
            icon: '#3B82F6',
            border: '#93C5FD'
        },
        ENTERTAIN: {
            bg: '#FCE7F3',
            bgHover: '#FBCFE8',
            text: '#BE185D',
            icon: '#EC4899',
            border: '#F9A8D4'
        },
        MEMBERSHIP: {
            bg: '#D1FAE5',
            bgHover: '#A7F3D0',
            text: '#047857',
            icon: '#10B981',
            border: '#6EE7B7'
        },
        OTHER: {
            bg: '#FEF3C7',
            bgHover: '#FDE68A',
            text: '#B45309',
            icon: '#F59E0B',
            border: '#FCD34D'
        }
    },

    // UI colors
    ui: {
        border: '#E5E7EB',
        borderFocus: '#93C5FD',
        divider: '#F3F4F6',
        overlay: 'rgba(0, 0, 0, 0.4)',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        dangerBg: '#FEE2E2',
        info: '#3B82F6'
    },

    // Bottom nav
    nav: {
        bg: '#FFFFFF',
        active: '#3B82F6',
        inactive: '#9CA3AF'
    }
};

// Category configuration
export const categoryConfig: Record<Category, {
    icon: string;
    label: string;
    colors: typeof colors.category.AI;
}> = {
    AI: {
        icon: 'Sparkles',
        label: 'category.ai',
        colors: colors.category.AI
    },
    ENTERTAIN: {
        icon: 'Tv',
        label: 'category.entertain',
        colors: colors.category.ENTERTAIN
    },
    MEMBERSHIP: {
        icon: 'CreditCard',
        label: 'category.membership',
        colors: colors.category.MEMBERSHIP
    },
    OTHER: {
        icon: 'MoreHorizontal',
        label: 'category.other',
        colors: colors.category.OTHER
    }
};

// Animation variants for Framer Motion
export const animations = {
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
    },
    slideUp: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 }
    },
    slideInFromBottom: {
        initial: { y: '100%' },
        animate: { y: 0 },
        exit: { y: '100%' }
    },
    scale: {
        initial: { scale: 0.95, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.95, opacity: 0 }
    },
    stagger: {
        animate: {
            transition: {
                staggerChildren: 0.05
            }
        }
    }
};

// Transition presets
export const transitions = {
    fast: { duration: 0.15 },
    normal: { duration: 0.2 },
    slow: { duration: 0.3 },
    spring: { type: 'spring', stiffness: 300, damping: 30 }
};
