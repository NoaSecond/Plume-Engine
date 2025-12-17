import { Theme } from './types';

// Theme - Forest (Nature inspired)
export const forest: Theme = {
    name: 'forest',
    displayName: 'Forest',
    description: 'A deep nature-inspired theme with calming greens',
    colors: {
        bg: {
            primary: '#151915',      // Deep forest green-black
            secondary: '#1C211C',    // Panel background
            tertiary: '#242924',     // Elevated elements
            elevated: '#2C332C',     // Hover states
        },
        text: {
            primary: '#E0E6E0',      // Soft white with green hint
            secondary: '#9CA69C',    // Muted grey-green
            muted: '#637063',        // Darker muted
            disabled: '#3D453D',     // Disabled
        },
        accent: {
            primary: '#66BB6A',      // Fresh green
            secondary: '#43A047',    // Darker green
            hover: '#81C784',        // Light green hover
            active: '#2E7D32',       // Deep green active
        },
        border: {
            default: '#334033',
            subtle: '#263026',
            focus: '#66BB6A',
        },
        status: {
            success: '#66BB6A',
            warning: '#FFA726',
            error: '#EF5350',
            info: '#42A5F5',
        },
        viewport: {
            background: '#0F120F',
            grid: '#242924',
            selection: '#66BB6A80',
        },
        selection: {
            background: '#66BB6A30',
            border: '#66BB6A',
        },
    },
    shadows: {
        sm: '0 1px 2px 0 rgba(0, 20, 0, 0.3)',
        md: '0 4px 6px -1px rgba(0, 20, 0, 0.3)',
        lg: '0 10px 15px -3px rgba(0, 20, 0, 0.3)',
    },
    borderRadius: {
        sm: '2px',
        md: '4px',
        lg: '6px',
    },
};

export default forest;
