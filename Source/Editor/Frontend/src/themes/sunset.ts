import { Theme } from './types';

// Theme - Sunset (Warm Dark)
export const sunset: Theme = {
    name: 'sunset',
    displayName: 'Sunset',
    description: 'Warm dusk tones with vibrant orange accents',
    colors: {
        bg: {
            primary: '#1A1614',      // Deep warm brown-black
            secondary: '#241E1B',    // Warm grey panel
            tertiary: '#2E2623',     // Lighter warm panel
            elevated: '#382E2A',     // Hover state
        },
        text: {
            primary: '#F0E6E0',      // Warm white
            secondary: '#A69B95',    // Warm grey
            muted: '#706660',        // Muted brown-grey
            disabled: '#423B36',     // Dark brown-grey
        },
        accent: {
            primary: '#FF9800',      // Sunset orange
            secondary: '#F57C00',    // Deep orange
            hover: '#FFB74D',        // Light orange
            active: '#E65100',       // Burnt orange
        },
        border: {
            default: '#3D332E',
            subtle: '#29221F',
            focus: '#FF9800',
        },
        status: {
            success: '#66BB6A',
            warning: '#FFA726',
            error: '#EF5350',
            info: '#29B6F6',
        },
        viewport: {
            background: '#120F0E',
            grid: '#2E2623',
            selection: '#FF980080',
        },
        selection: {
            background: '#FF980030',
            border: '#FF9800',
        },
    },
    shadows: {
        sm: '0 1px 2px 0 rgba(20, 10, 0, 0.3)',
        md: '0 4px 6px -1px rgba(20, 10, 0, 0.3)',
        lg: '0 10px 15px -3px rgba(20, 10, 0, 0.3)',
    },
    borderRadius: {
        sm: '2px',
        md: '4px',
        lg: '6px',
    },
};

export default sunset;
