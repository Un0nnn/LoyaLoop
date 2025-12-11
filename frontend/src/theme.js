import { createTheme } from '@mui/material/styles';
import { palettes } from './themePresets';

const baseOptions = {
    typography: {
        fontFamily: ['IBM Plex Sans', 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'].join(','),
        h1: { fontWeight: 700, letterSpacing: '-0.02em' },
        h2: { fontWeight: 600 },
        h3: { fontWeight: 600 },
        body1: { fontWeight: 400 },
        body2: { fontWeight: 400 },
        button: { textTransform: 'none', fontWeight: 600 }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: { borderRadius: 10, padding: '8px 14px' }
            }
        },
        MuiAppBar: {
            styleOverrides: {
                root: { boxShadow: 'none', backgroundColor: 'transparent' }
            }
        },
        MuiToolbar: {
            styleOverrides: {
                root: { minHeight: 64 }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 12px 36px rgba(2,8,23,0.15)'
                }
            }
        }
    }
};

export const buildTheme = (mode = 'dark') => {
    const palette = palettes[mode] || palettes.dark;
    return createTheme({
        palette,
        ...baseOptions,
        components: {
            ...baseOptions.components,
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        boxShadow: mode === 'dark'
                            ? '0 12px 36px rgba(2,8,23,0.6)'
                            : '0 8px 24px rgba(237,23,42,0.08)',
                        backgroundColor: palette.background.paper
                    }
                }
            }
        }
    });
};

const theme = buildTheme('dark');

export default theme;