import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import { getHomeRouteForRole } from "../roleAccess";
import { LogoutOutlined, ManageAccountsOutlined, DragIndicator, RestartAlt, TrendingUpRounded, VerifiedUserRounded } from "@mui/icons-material";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Select, FormControl, InputLabel, Typography, IconButton, Tooltip, Box, Stack, Divider, Avatar, useTheme } from '@mui/material';
import { useNotification } from '../context/notification';
import ThemeToggle from './ThemeToggle.comp.jsx';
import useDraggable from '../hooks/useDraggable';

const UserInfo = () => {
    const theme = useTheme();
    const { currentUser, logout, activeInterface, switchInterface, impersonateLogin, restoreImpersonation, getImpersonationCount, refreshUser } = useAuth();
    const { showMessage } = useNotification();
    const navigate = useNavigate();
    const [switchOpen, setSwitchOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [mode, setMode] = useState('quick');
    const [selectedInterface, setSelectedInterface] = useState(activeInterface || (currentUser?.role || 'regular'));
    const [authUtorid, setAuthUtorid] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [loadingSwitch, setLoadingSwitch] = useState(false);
    const [message, setMessage] = useState('');

    // Add draggable functionality
    const { isDragging, isAltPressed, dragHandlers, resetPosition } = useDraggable(
        'userinfo-position',
        { top: '18px', right: '18px', left: 'auto', bottom: 'auto' }
    );

    // Prevent default Alt+Click behavior on all clickable elements
    const handleClick = useCallback((e) => {
        if (isAltPressed) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, [isAltPressed]);

    // Refresh user data when window gains focus to keep points updated
    useEffect(() => {
        const handleFocus = () => {
            if (refreshUser) {
                refreshUser();
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [refreshUser]);

    const resetDialog = () => {
        setMode('quick');
        setSelectedInterface(activeInterface || (currentUser?.role || 'regular'));
        setAuthUtorid('');
        setAuthPassword('');
        setLoadingSwitch(false);
        setMessage('');
    };

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

    const allowedIfaces = currentUser ? getInterfacesForRole(currentUser.role) : ['regular'];

    // Check if user can switch interfaces (regular users cannot)
    const canSwitchInterface = currentUser && currentUser.role !== 'regular' && allowedIfaces.length > 1;

    const handleQuickSwitch = async () => {
        if (!selectedInterface) return;
        if (selectedInterface === activeInterface) {
            setMessage('Already using that interface');
            return;
        }

        // Show confirmation dialog
        setSwitchOpen(false);
        setConfirmOpen(true);
    };

    const handleConfirmSwitch = async () => {
        const ok = switchInterface(selectedInterface);
        if (!ok) {
            setMessage('Not allowed to switch to this interface');
            setConfirmOpen(false);
            setSwitchOpen(true);
            return;
        }
        showMessage(`Switched interface to ${selectedInterface}`, 'success');
        setConfirmOpen(false);
        resetDialog();
        // Navigate to the home route for the new interface
        try {
            const homeRoute = getHomeRouteForRole(selectedInterface);
            navigate(homeRoute, { replace: true, state: { interfaceSwitch: Date.now() } });
        } catch (e) {
            console.error('Navigation failed:', e);
        }
    };

    const handleAuthSwitch = async () => {
        setLoadingSwitch(true);
        setMessage('');
        try {
            const u = await impersonateLogin(authUtorid.trim(), authPassword);
            if (!u) {
                setMessage('Failed to authenticate — check credentials');
            } else {
                try { switchInterface(u.role || 'regular'); } catch (e) {}
                showMessage(`Now impersonating ${u.utorid || u.name}`, 'success');
                setSwitchOpen(false);
                resetDialog();
                // Navigate to the home route for the new user's role
                try {
                    const homeRoute = getHomeRouteForRole(u.role || 'regular');
                    navigate(homeRoute, { replace: true, state: { interfaceSwitch: Date.now() } });
                } catch (e) {
                    console.error('Navigation failed:', e);
                }
            }
        } catch (err) {
            const svcMsg = err?.response?.data?.error || err?.response?.data || err?.message;
            setMessage(String(svcMsg || 'Login failed'));
        } finally {
            setLoadingSwitch(false);
        }
    };

    if (!currentUser) return null;

    const roleLabel = (currentUser.role || 'member').replace(/_/g, ' ');
    const capitalize = (s) => typeof s === 'string' && s.length ? s[0].toUpperCase() + s.slice(1) : s;
    const avatarInitial = (currentUser.name || currentUser.utorid || '?')[0]?.toUpperCase();
    const pointsLabel = (currentUser.points ?? 1250).toLocaleString();

    return (
        <Box
            className="app-user-info"
            {...dragHandlers}
            sx={{
                ...dragHandlers.style,
                position: 'fixed',
                zIndex: isDragging ? 100 : 40,
                boxShadow: isDragging ? '0 30px 80px rgba(0, 0, 0, 0.6)' : '0 20px 45px rgba(6, 10, 20, 0.5)',
                outline: isAltPressed ? '2px solid rgba(124, 58, 237, 0.5)' : 'none',
                outlineOffset: '2px',
                background: 'linear-gradient(180deg, #0c101c, #181c28)',
                backdropFilter: 'blur(12px)',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflow: 'hidden',
                transition: isDragging ? 'none' : 'all 0.2s ease'
            }}
        >
            {/* Drag indicator and reset button */}
            {isAltPressed && (
                <Box sx={{
                    position: 'absolute',
                    top: '-38px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                    padding: '6px 16px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    zIndex: 101
                }}>
                    <DragIndicator sx={{ fontSize: 16 }} />
                    <span>Drag to reposition</span>
                    <Tooltip title="Reset position" arrow>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                resetPosition();
                                showMessage('Position reset', 'success');
                            }}
                            sx={{
                                p: 0.75,
                                ml: 0.5,
                                color: '#fff',
                                background: 'rgba(255, 255, 255, 0.15)',
                                '&:hover': {
                                    background: 'rgba(255, 255, 255, 0.25)',
                                    transform: 'rotate(180deg)',
                                    transition: 'all 0.3s ease'
                                }
                            }}
                        >
                            <RestartAlt sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}

            <Stack spacing={2} sx={{ position: 'relative', zIndex: 1, p: 2 }}>
                {/* User Profile Card */}
                <Box sx={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: '12px',
                    p: 2,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{
                            width: 48,
                            height: 48,
                            background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                            fontSize: '1.3rem',
                            fontWeight: 700,
                            border: '2px solid rgba(124, 58, 237, 0.3)'
                        }}>
                            {avatarInitial}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                color: '#fff',
                                lineHeight: 1.3,
                                mb: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {currentUser.name || currentUser.utorid}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                <Typography sx={{
                                    fontSize: '0.75rem',
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    textTransform: 'capitalize',
                                    fontWeight: 600
                                }}>
                                    {roleLabel}
                                </Typography>
                                {currentUser.verified && (
                                    <Tooltip title="Verified Account" arrow>
                                        <VerifiedUserRounded sx={{ fontSize: 14, color: '#34d399' }} />
                                    </Tooltip>
                                )}
                            </Stack>
                            <Stack direction="row" spacing={0.8} alignItems="center">
                                <Typography sx={{
                                    fontSize: '0.65rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    fontWeight: 600
                                }}>
                                    Interface
                                </Typography>
                                <Box sx={{
                                    px: 1,
                                    py: 0.3,
                                    borderRadius: '6px',
                                    background: 'rgba(124, 58, 237, 0.15)',
                                    border: '1px solid rgba(124, 58, 237, 0.3)'
                                }}>
                                    <Typography sx={{
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        color: '#7C3AED',
                                        textTransform: 'capitalize'
                                    }}>
                                        {capitalize(activeInterface)}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                        <Box sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#34d399',
                            boxShadow: '0 0 8px rgba(52, 211, 153, 0.6)',
                            animation: 'pulse 2s ease-in-out infinite',
                            '@keyframes pulse': {
                                '0%, 100%': { opacity: 1 },
                                '50%': { opacity: 0.5 }
                            }
                        }} />
                    </Stack>
                </Box>

                {/* Points Display Card */}
                <Box sx={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: '12px',
                    p: 2,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(124, 58, 237, 0.3)'
                    }
                }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '10px',
                            background: 'rgba(124, 58, 237, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(124, 58, 237, 0.3)'
                        }}>
                            <TrendingUpRounded sx={{ color: '#7C3AED', fontSize: 20 }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontWeight: 600,
                                mb: 0.5
                            }}>
                                Points
                            </Typography>
                            <Typography sx={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: '#fff',
                                lineHeight: 1
                            }}>
                                {pointsLabel}
                            </Typography>
                        </Box>
                    </Stack>
                </Box>

                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', my: 0.5 }} />

                {/* Action Buttons */}
                <Stack spacing={1.5} onClick={handleClick}>
                    <Stack direction="row" spacing={1.5}>
                        <Tooltip
                            title={!canSwitchInterface ? "Regular users cannot switch interfaces" : "Switch to a different interface"}
                            arrow
                        >
                            <span style={{ flex: 1 }}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    disabled={!canSwitchInterface}
                                    onClick={(e) => {
                                        handleClick(e);
                                        if (!isAltPressed && canSwitchInterface) setSwitchOpen(true);
                                    }}
                                    startIcon={<ManageAccountsOutlined />}
                                    sx={{
                                        background: !canSwitchInterface
                                            ? 'rgba(100, 100, 100, 0.3)'
                                            : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                                        py: 1,
                                        borderRadius: '10px',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        '&:hover': {
                                            background: !canSwitchInterface
                                                ? 'rgba(100, 100, 100, 0.3)'
                                                : 'linear-gradient(135deg, #6D28D9, #4C1D95)'
                                        },
                                        transition: 'all 0.2s ease',
                                        '&.Mui-disabled': {
                                            color: 'rgba(255, 255, 255, 0.3)'
                                        }
                                    }}
                                >
                                    Switch
                                </Button>
                            </span>
                        </Tooltip>

                        <ThemeToggle />

                        {getImpersonationCount() > 0 && (
                            <Button
                                variant="outlined"
                                onClick={(e) => {
                                    handleClick(e);
                                    if (!isAltPressed) {
                                        const ok = restoreImpersonation();
                                        if (!ok) showMessage('Restore failed', 'error');
                                    }
                                }}
                                sx={{
                                    px: 2,
                                    py: 1,
                                    borderRadius: '10px',
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                    color: '#fff',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    '&:hover': {
                                        borderColor: 'rgba(255, 255, 255, 0.3)',
                                        background: 'rgba(255, 255, 255, 0.05)'
                                    }
                                }}
                            >
                                Undo
                            </Button>
                        )}
                    </Stack>

                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={(e) => {
                            handleClick(e);
                            if (!isAltPressed) {
                                logout();
                                navigate('/login');
                            }
                        }}
                        startIcon={<LogoutOutlined />}
                        sx={{
                            py: 1,
                            borderRadius: '10px',
                            borderColor: theme.palette.mode === 'light'
                                ? 'rgba(239, 68, 68, 0.3)'
                                : 'rgba(255, 255, 255, 0.2)',
                            color: theme.palette.mode === 'light'
                                ? '#dc2626'  // Red-600 for light mode
                                : 'rgba(255, 255, 255, 0.9)',
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            '&:hover': {
                                borderColor: 'rgba(239, 68, 68, 0.5)',
                                background: 'rgba(239, 68, 68, 0.08)',
                                color: '#ef4444'
                            },
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Sign Out
                    </Button>
                </Stack>
            </Stack>

            {/* Dialog remains the same */}
            <Dialog
                open={switchOpen}
                onClose={() => { setSwitchOpen(false); resetDialog(); }}
                fullWidth
                maxWidth="xs"
                PaperProps={{
                    sx: {
                        background: 'linear-gradient(135deg, #0c101c, #181c28)',
                        borderRadius: '18px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)'
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.3rem' }}>Switch Interface</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
                        Current: <strong>{currentUser?.role}</strong> • Active: <strong>{activeInterface}</strong>
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel id="switch-mode-label">Mode</InputLabel>
                        <Select
                            variant="outlined"
                            labelId="switch-mode-label"
                            value={mode}
                            label="Mode"
                            onChange={(e) => setMode(e.target.value)}
                        >
                            <MenuItem value="quick">Quick switch (no auth)</MenuItem>
                            <MenuItem value="auth">Authenticate as another user</MenuItem>
                        </Select>
                    </FormControl>

                    {mode === 'quick' ? (
                        <FormControl fullWidth sx={{ mb: 1 }}>
                            <InputLabel id="iface-label">Interface</InputLabel>
                            <Select
                                variant="outlined"
                                labelId="iface-label"
                                value={selectedInterface}
                                label="Interface"
                                onChange={(e) => setSelectedInterface(e.target.value)}
                            >
                                {allowedIfaces.map(ifc => <MenuItem key={ifc} value={ifc}>{ifc}</MenuItem>)}
                            </Select>
                        </FormControl>
                    ) : (
                        <Stack spacing={2}>
                            <TextField
                                id="auth-utorid"
                                label="UTORid"
                                value={authUtorid}
                                onChange={(e) => setAuthUtorid(e.target.value)}
                                fullWidth
                                autoFocus
                            />
                            <TextField
                                id="auth-password"
                                label="Password"
                                type="password"
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                                fullWidth
                            />
                        </Stack>
                    )}
                    {message && (
                        <Typography color="error" sx={{ mt: 2 }} role="alert">
                            {message}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 1 }}>
                    <Button onClick={() => { setSwitchOpen(false); resetDialog(); }} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    {mode === 'quick' ? (
                        <Button
                            variant="contained"
                            onClick={handleQuickSwitch}
                            disabled={selectedInterface === activeInterface}
                            sx={{ textTransform: 'none' }}
                        >
                            Switch
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={handleAuthSwitch}
                            disabled={loadingSwitch || !authUtorid || !authPassword}
                            sx={{ textTransform: 'none' }}
                        >
                            {loadingSwitch ? 'Signing in...' : 'Sign in & Impersonate'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmOpen}
                onClose={() => {
                    setConfirmOpen(false);
                    setSwitchOpen(true);
                }}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        background: 'linear-gradient(135deg, #0c101c, #181c28)',
                        borderRadius: '18px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)'
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.2rem', pb: 1 }}>
                    Confirm Interface Switch
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                            You are about to switch to the <strong style={{ color: '#7C3AED', textTransform: 'capitalize' }}>{selectedInterface}</strong> interface.
                        </Typography>
                        <Box sx={{
                            background: 'rgba(124, 58, 237, 0.1)',
                            border: '1px solid rgba(124, 58, 237, 0.3)',
                            borderRadius: '12px',
                            p: 2
                        }}>
                            <Stack spacing={1.5}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                                        Current Interface:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, textTransform: 'capitalize', color: '#fff' }}>
                                        {activeInterface}
                                    </Typography>
                                </Stack>
                                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                                        New Interface:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, textTransform: 'capitalize', color: '#7C3AED' }}>
                                        {selectedInterface}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                            The interface will update immediately and you'll be redirected to the new interface's home page.
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 1 }}>
                    <Button
                        onClick={() => {
                            setConfirmOpen(false);
                            setSwitchOpen(true);
                        }}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmSwitch}
                        sx={{
                            background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': {
                                background: 'linear-gradient(135deg, #6D28D9, #4C1D95)'
                            }
                        }}
                    >
                        Confirm Switch
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserInfo;

