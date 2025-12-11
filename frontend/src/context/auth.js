import {createContext, useContext, useMemo, useState, useCallback} from 'react';
import authService from "../services/auth.service";
import { setAuthToken } from '../services/api';
import { useNotification } from './notification';

export const AuthContext = createContext();

export const demoUsers = Object.freeze({
    regular_user: {
        name: "Riley Regular",
        role: "regular",
        label: "Regular User",
        password: "password",
        avatar: "",
    },
    jane_cashier: {
        name: "Jane Cashier",
        role: "cashier",
        label: "Cashier",
        password: "password",
        avatar: "",
    },
    bob_manager: {
        name: "Bob Manager",
        role: "manager",
        label: "Manager",
        password: "password",
        avatar: "",
    },
    olivia_organizer: {
        name: "Olivia Organizer",
        role: "organizer",
        label: "Organizer",
        password: "password",
        avatar: "",
    },
    sasha_superuser: {
        name: "Sasha Superuser",
        role: "superuser",
        label: "Superuser",
        password: "password",
        avatar: "",
    },
});

const CURRENT_USER_KEY = "currentUser";

const readStoredUser = () => {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    if (!stored) return null;
    try {
        return JSON.parse(stored);
    } catch (err) {
        return { utorid: stored };
    }
};

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(readStoredUser);
    const [activeInterface, setActiveInterface] = useState(() => {
        // Always initialize to the user's actual role
        // This ensures users see their default interface on every page load
        const user = readStoredUser();
        return user?.role || null;
    });
    // tokens and expiry are stored in sessionStorage to reduce cross-session exposure
    const [token, setToken] = useState(() => sessionStorage.getItem('authToken'));
    const [tokenExpiry, setTokenExpiry] = useState(() => {
        const stored = sessionStorage.getItem("expireAt");
        if (!stored) return null;
        try {
            return JSON.parse(stored);
        } catch (err) {
            return stored;
        }
    });

    const { showMessage } = useNotification();

    // --- Impersonation stack helpers (stored in sessionStorage) ---
    const IMP_STACK_KEY = 'impStack';
    const AUDIT_KEY = 'interfaceAudit';

    const pushImpersonationEntry = (entry) => {
        try {
            const raw = sessionStorage.getItem(IMP_STACK_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            arr.push(entry);
            sessionStorage.setItem(IMP_STACK_KEY, JSON.stringify(arr));
        } catch (e) { /* ignore storage errors */ }
    };

    const popImpersonationEntry = () => {
        try {
            const raw = sessionStorage.getItem(IMP_STACK_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            const entry = arr.pop();
            if (arr.length === 0) sessionStorage.removeItem(IMP_STACK_KEY);
            else sessionStorage.setItem(IMP_STACK_KEY, JSON.stringify(arr));
            return entry;
        } catch (e) { return null; }
    };

    const getImpersonationCount = () => {
        try {
            const raw = sessionStorage.getItem(IMP_STACK_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr.length : 0;
        } catch (e) { return 0; }
    };

    const recordAudit = (entry) => {
        try {
            const raw = localStorage.getItem(AUDIT_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            arr.unshift(entry); // newest first
            // cap the audit log to 200 entries to avoid unbounded growth
            if (arr.length > 200) arr.length = 200;
            localStorage.setItem(AUDIT_KEY, JSON.stringify(arr));
        } catch (e) { /* ignore */ }
    };

    const getAuditLog = () => {
        try {
            const raw = localStorage.getItem(AUDIT_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr : [];
        } catch (e) { return []; }
    };

    const persistUser = (user) => {
        setCurrentUser(user);
        try {
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        } catch (err) {
            localStorage.setItem(CURRENT_USER_KEY, user?.utorid || "");
        }
        // ALWAYS set activeInterface to user's default role upon login
        // This ensures each user sees their role's interface every time they log in
        try {
            localStorage.setItem('activeInterface', user?.role || 'regular');
            setActiveInterface(user?.role || 'regular');
        } catch (e) {
            setActiveInterface(user?.role || 'regular');
        }
        return user;
    };

    // Helper that returns allowed interfaces for a given role
    const getInterfacesForRole = (role) => {
        switch (role) {
            case 'superuser':
                // Superuser can switch to any interface INCLUDING their own superuser interface
                return ['superuser','manager','cashier','organizer','regular'];
            case 'manager':
                // Manager can switch to cashier, organizer, or regular (NOT superuser)
                return ['manager','cashier','organizer','regular'];
            case 'organizer':
                // Organizer can switch to regular
                return ['organizer','regular'];
            case 'cashier':
                // Cashier can switch to regular
                return ['cashier','regular'];
            case 'regular':
            default:
                // Regular users CANNOT switch interfaces (security)
                return ['regular'];
        }
    };

    const switchInterface = (iface) => {
        if (!currentUser) return false;
        const allowed = getInterfacesForRole(currentUser.role);
        if (!allowed.includes(iface)) return false;
        try {
            localStorage.setItem('activeInterface', iface);
        } catch (e) {}
        const prev = activeInterface;
        setActiveInterface(iface);
        // record audit
        try {
            recordAudit({ action: 'switch', by: currentUser?.utorid || null, from: prev || null, to: iface, at: new Date().toISOString() });
        } catch (e) {}
        return true;
    };

    const login = useCallback(async (utorid, password) => {
        const demoUser = demoUsers[utorid];
        if (demoUser && password === demoUser.password) {
            showMessage('Logged in as demo user', 'success');
            const user = persistUser({ ...demoUser, utorid });
            setAuthToken(null); // demo user won't have backend token
            setToken(null);
            return user;
        }

        const response = await authService.login(utorid, password);
        const authToken = response?.token;
        const expireAt = response?.expiresAt;
        const userPayload = response?.user || { utorid };

        if (authToken) {
            setAuthToken(authToken);
            setToken(authToken);
            try { sessionStorage.setItem('authToken', authToken); } catch (e) { }
        }
        if (expireAt) {
            setTokenExpiry(expireAt);
            try { sessionStorage.setItem('expireAt', JSON.stringify(expireAt)); } catch (e) { }
        }

        showMessage('Signed in', 'success');
        // record login in audit (non-demo)
        try { recordAudit({ action: 'login', by: userPayload?.utorid || null, at: new Date().toISOString() }); } catch (e) {}
        return persistUser(userPayload);
    }, [showMessage]);

    // Impersonate login: push current state onto stack and then login as new user
    const impersonateLogin = useCallback(async (utorid, password) => {
        // push current user + token for restoration
        try {
            if (currentUser) pushImpersonationEntry({ user: currentUser, token, tokenExpiry });
        } catch (e) {}
        const newUser = await login(utorid, password);
        // record impersonation event
        try { recordAudit({ action: 'impersonate', by: (currentUser?.utorid || null), to: (newUser?.utorid || null), at: new Date().toISOString() }); } catch (e) {}
        return newUser;
    }, [currentUser, token, tokenExpiry, login]);

    // Restore prior impersonation (pop stack)
    const restoreImpersonation = useCallback(() => {
        try {
            const entry = popImpersonationEntry();
            if (!entry) return false;
            // restore token and user
            try { setAuthToken(entry.token); } catch (e) {}
            setToken(entry.token || null);
            setTokenExpiry(entry.tokenExpiry || null);
            setCurrentUser(entry.user || null);
            try { localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(entry.user || {})); } catch (e) {}
            // set active interface back to previous user's role
            try { localStorage.setItem('activeInterface', entry.user?.role || 'regular'); } catch (e) {}
            setActiveInterface(entry.user?.role || 'regular');
            recordAudit({ action: 'restoreImpersonation', by: entry.user?.utorid || null, at: new Date().toISOString() });
            showMessage('Restored previous user session', 'success');
            return true;
        } catch (e) {
            console.error('Failed to restore impersonation', e);
            return false;
        }
    }, [showMessage]);

    // Logout helper (restore default state)
    const logout = useCallback(() => {
        try { setAuthToken(null); } catch (e) {}
        try { sessionStorage.removeItem('authToken'); } catch (e) {}
        try { sessionStorage.removeItem('expireAt'); } catch (e) {}
        try { localStorage.removeItem(CURRENT_USER_KEY); } catch (e) {}
        setTokenExpiry(null);
        setToken(null);
        setCurrentUser(null);
        showMessage('Signed out', 'info');
    }, [showMessage]);

    // Refresh current user data from backend (used to update points after transactions)
    const refreshUser = useCallback(async () => {
        if (!currentUser || !token) return null;
        try {
            const userService = require('../services/user.service').default;
            const freshUser = await userService.getCurrentUser();
            if (freshUser) {
                const updatedUser = { ...currentUser, ...freshUser };
                setCurrentUser(updatedUser);
                try {
                    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
                } catch (err) {
                    localStorage.setItem(CURRENT_USER_KEY, updatedUser?.utorid || "");
                }
                return updatedUser;
            }
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
        return null;
    }, [currentUser, token]);

    const value = useMemo(() => ({
        currentUser,
        token,
        tokenExpiry,
        login,
        logout,
        setCurrentUser,
        refreshUser,
        activeInterface,
        switchInterface,
        impersonateLogin,
        restoreImpersonation,
        getImpersonationCount,
        getAuditLog
    }), [currentUser, token, tokenExpiry, login, logout, refreshUser, activeInterface, impersonateLogin, restoreImpersonation]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
 }

 export default AuthContext;
