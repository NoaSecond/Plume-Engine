import { Theme } from './types';

// Theme - Ocean (Deep Blue)
export const ocean: Theme = {
    name: 'ocean',
    displayName: 'Ocean',
    description: 'Deep sea tones for a cool, professional look',
    colors: {
        bg: {
            primary: '#0F1724',      // Deep navy
            secondary: '#162032',    // Lighter navy
            tertiary: '#1E2940',     // Panel element
            elevated: '#263350',     // Hover state
        },
        text: {
            primary: '#E0E7FF',      // Cool white
            secondary: '#94A3B8',    // Blue-grey
            muted: '#64748B',        // Muted blue
            disabled: '#334155',     // Dark blue-grey
        },
        accent: {
            primary: '#38BDF8',      // Sky blue
            secondary: '#0EA5E9',    // Ocean blue
            hover: '#7DD3FC',        // Light blue hover
            active: '#0284C7',       // Deep blue active
        },
        border: {
            default: '#1E293B',
            subtle: '#0F172A',
            focus: '#38BDF8',
        },
        status: {
            success: '#4ADE80',
            warning: '#FACC15',
            error: '#F87171',
            info: '#38BDF8',
        },
        viewport: {
            background: '#0B111A',
            grid: '#1E293B',
            selection: '#38BDF880',
        },
        selection: {
            background: '#38BDF830',
            border: '#38BDF8',
        },
    },
    shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 20, 0.3)',
        md: '0 4px 6px -1px rgba(0, 0, 20, 0.3)',
        lg: '0 10px 15px -3px rgba(0, 0, 20, 0.3)',
    },
    borderRadius: {
        sm: '2px',
        md: '4px',
        lg: '6px',
    },
};

export default ocean;
