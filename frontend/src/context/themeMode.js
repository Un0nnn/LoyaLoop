import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "ui-theme-mode";
const ThemeModeContext = createContext({ mode: "dark", toggleMode: () => {} });

const getPreferredMode = () => {
    if (typeof window === "undefined") return "dark";
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "light" || stored === "dark") return stored;
    } catch (err) {
        // ignore storage read issues
    }
    try {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? "light" : "dark";
    } catch (err) {
        return "dark";
    }
};

export const ThemeModeProvider = ({ children }) => {
    const [mode, setMode] = useState(() => getPreferredMode());

    useEffect(() => {
        if (typeof document !== "undefined") {
            document.documentElement.dataset.theme = mode;
        }
        try {
            localStorage.setItem(STORAGE_KEY, mode);
        } catch (err) {
            // ignore storage write failures
        }
    }, [mode]);

    const toggleMode = () => setMode(prev => prev === "dark" ? "light" : "dark");

    const value = useMemo(() => ({ mode, setMode, toggleMode }), [mode]);

    return (
        <ThemeModeContext.Provider value={value}>
            {children}
        </ThemeModeContext.Provider>
    );
};

export const useThemeMode = () => useContext(ThemeModeContext);

