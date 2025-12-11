import React, { useState } from 'react';
import { Box, TextField, Button, Paper, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QrCode2Outlined from '@mui/icons-material/QrCode2Outlined';
import { useNotification } from '../../context/notification';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth';

const ResetRequest = () => {
    const [utorid, setUtorid] = useState('');
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [token, setToken] = useState('');
    const { showMessage } = useNotification();
    const navigate = useNavigate();
    const { currentUser, activeInterface } = useAuth();
    const [email, setEmail] = useState('');

    const handleSubmit = async (e) => {
        e && e.preventDefault();
        if (!utorid) return showMessage('Please enter a UTORid', 'warning');
        // If not authenticated as same user or a manager, require email to prove ownership
        const isAuthedSame = currentUser && (currentUser.utorid === utorid);
        const effectiveRole = activeInterface || currentUser?.role;
        const isAuthedManager = currentUser && (effectiveRole === 'manager' || effectiveRole === 'superuser');
        if (!isAuthedSame && !isAuthedManager && !email) return showMessage('Please provide the registered email to request a reset', 'warning');
        setLoading(true);
        try {
            const payload = { utorid };
            if (email) payload.email = email;
            const resp = await api.post('/auth/resets', payload);
            // resp may be { expiresAt, resetToken } or { expiresAt, message }
            if (resp?.resetToken) {
                setToken(resp.resetToken);
                setDialogOpen(true);
            } else if (resp?.message) {
                showMessage(resp.message, 'success');
            } else {
                showMessage('Reset request accepted', 'success');
            }
        } catch (err) {
            console.error(err);
            const msg = err?.response?.data?.error || err?.message || 'Failed to request reset';
            showMessage(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const copyToken = async () => {
        try {
            await navigator.clipboard.writeText(token);
            showMessage('Reset token copied to clipboard', 'success');
        } catch (e) {
            showMessage('Could not copy to clipboard', 'error');
        }
    };

    const goToReset = () => {
        setDialogOpen(false);
        navigate(`/auth/resets/${token}`);
    };

    return (
        <div className="auth-layout auth-layout--dark">
            <div className="auth-inner">
                <Paper elevation={0} className="auth-panel auth-panel--dark" sx={{ px:4, py:3, width:{xs:'92%', sm:480} }}>
                    <Box sx={{display:'flex', flexDirection:'column', alignItems:'center', gap:0.5, mb:2}}>
                        <Box sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #6d28d9, #4f46e5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 10px 22px rgba(79,70,229,0.35)',
                            marginBottom: '6px'
                        }}>
                            <QrCode2Outlined sx={{ color: '#fff', fontSize: 28 }} />
                        </Box>
                    </Box>
                    <Typography variant="h6" gutterBottom>Request password reset</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{mb:2}}>Enter your UTORid and we'll provide a reset link or token.</Typography>

                    <Box component="form" onSubmit={handleSubmit} sx={{ display:'flex', gap:2, flexDirection:'column' }}>
                        <TextField label="UTORid" value={utorid} onChange={(e)=>setUtorid(e.target.value)} fullWidth />
                        {/* Show email input for unauthenticated callers; optional for authenticated users */}
                        <TextField label="Registered email (required if not signed in)" value={email} onChange={(e)=>setEmail(e.target.value)} fullWidth />
                        <Box sx={{ display:'flex', gap:2 }}>
                            <Button variant="contained" onClick={handleSubmit} disabled={loading}>Request reset</Button>
                            <Button variant="outlined" onClick={() => window.location.href = '/'}>Back</Button>
                        </Box>
                    </Box>
                </Paper>
            </div>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                <DialogTitle>Reset token</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{wordBreak:'break-all'}}>{token}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button startIcon={<ContentCopyIcon />} onClick={copyToken}>Copy</Button>
                    <Button variant="contained" onClick={goToReset}>Use token</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default ResetRequest;
