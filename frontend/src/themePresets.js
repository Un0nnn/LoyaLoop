export const palettes = {
    dark: {
        mode: 'dark',
        background: {
            default: '#050a1d',
            paper: '#0b1220'
        },
        primary: { main: '#7C3AED', contrastText: '#ffffff' },
        secondary: { main: '#94A3B8' },
        error: { main: '#ef4444' },
        warning: { main: '#f59e0b' },
        info: { main: '#06b6d4' },
        success: { main: '#10b981' },
        text: { primary: '#e6eef8', secondary: '#94a3b8' }
    },
    light: {
        mode: 'light',
        background: {
            default: '#f8fafc',  // Lighter, cleaner background
            paper: '#ffffff'
        },
        primary: { main: '#7C3AED', contrastText: '#ffffff' },  // Same purple as dark mode for consistency
        secondary: { main: '#1e293b' },  // Darker for better contrast
        error: { main: '#dc2626' },
        warning: { main: '#ea580c' },
        info: { main: '#0284c7' },
        success: { main: '#16a34a' },
        text: {
            primary: '#0f172a',      // Very dark for high contrast
            secondary: '#475569'     // Medium gray for secondary text, better than #334155
        }
    }
};

