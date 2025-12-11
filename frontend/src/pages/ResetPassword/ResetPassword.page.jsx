import React, { useState } from 'react';
import { Box, TextField, Button, Paper, Typography } from '@mui/material';
import QrCode2Outlined from '@mui/icons-material/QrCode2Outlined';
import api from '../../services/api';
import { useNotification } from '../../context/notification';
import { useParams, useNavigate } from 'react-router-dom';

const ResetPassword = () => {
    const { resetToken } = useParams();
    const [utorid, setUtorid] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { showMessage } = useNotification();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e && e.preventDefault();
        if (!utorid || !password) return showMessage('Please enter UTORid and new password', 'warning');
        setLoading(true);
        try {
            await api.post(`/auth/resets/${resetToken}`, { utorid, password });
            showMessage('Password reset successful', 'success');
            navigate('/login');
        } catch (err) {
            console.error(err);
            showMessage(err?.response?.data?.error || err?.message || 'Failed to reset password', 'error');
        } finally {
            setLoading(false);
        }
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
                    <Typography variant="h6" gutterBottom>Reset password</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{mb:2}}>Enter your UTORid and a new password (8–20 chars, upper/lower/digit/special).</Typography>

                    <Box component="form" onSubmit={handleSubmit} sx={{ display:'flex', gap:2, flexDirection:'column' }}>
                        <TextField label="UTORid" value={utorid} onChange={(e)=>setUtorid(e.target.value)} fullWidth />
                        <TextField label="New password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} fullWidth />
                        <Box sx={{ display:'flex', gap:2 }}>
                            <Button variant="contained" onClick={handleSubmit} disabled={loading}>Set password</Button>
                            <Button variant="outlined" onClick={() => navigate('/login')}>Cancel</Button>
                        </Box>
                    </Box>
                </Paper>
            </div>
        </div>
    );
};

export default ResetPassword;
