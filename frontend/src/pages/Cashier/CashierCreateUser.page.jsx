import React, { useState } from 'react';
import PageShell from '../../components/PageShell.comp';
import { TextField, Button, Stack, Typography } from '@mui/material';
import userService from '../../services/user.service';
import { useNotification } from '../../context/notification';
import { useNavigate } from 'react-router-dom';

const CashierCreateUser = () => {
    const [utorid, setUtorid] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [created, setCreated] = useState(null);
    const { showMessage } = useNotification();
    const navigate = useNavigate();

    const handleCreate = async () => {
        if (!utorid || !name || !email) {
            showMessage('Please fill all fields', 'warning');
            return;
        }
        setLoading(true);
        try {
            const resp = await userService.createUser(utorid.trim(), name.trim(), email.trim());
            // response may be axios response
            const data = resp?.data || resp;
            setCreated(data);
            showMessage('User created', 'success');
        } catch (err) {
            console.error(err);
            const msg = err?.response?.data?.error || err?.message || 'Failed to create user';
            showMessage(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageShell title="Create user" subtitle="Register a new user account (cashier or higher).">
            <div className="section-card centered-panel">
                <Stack spacing={2} sx={{width: '100%'}}>
                    <TextField label="UTORid" value={utorid} onChange={(e)=>setUtorid(e.target.value)} fullWidth />
                    <TextField label="Name" value={name} onChange={(e)=>setName(e.target.value)} fullWidth />
                    <TextField label="Email (UofT)" value={email} onChange={(e)=>setEmail(e.target.value)} fullWidth />

                    <div style={{display:'flex', gap:12}}>
                        <Button variant="contained" onClick={handleCreate} disabled={loading}>{loading ? 'Creating...' : 'Create user'}</Button>
                        <Button variant="outlined" onClick={()=>navigate(-1)}>Cancel</Button>
                    </div>

                    {created && (
                        <div style={{marginTop:12}}>
                            <Typography variant="subtitle1">Created user</Typography>
                            <Typography>ID: {created.id}</Typography>
                            <Typography>UTORid: {created.utorid}</Typography>
                            <Typography>Name: {created.name}</Typography>
                            <Typography>Email: {created.email}</Typography>
                            {/* Show reset token if backend returns one */}
                            {created.resetToken && (
                                <div style={{marginTop:8, padding:8, background:'#f6f6f6', borderRadius:6}}>
                                    <Typography variant="caption" color="text.secondary">Reset token (showing for testing):</Typography>
                                    <Typography sx={{wordBreak:'break-all'}}>{created.resetToken}</Typography>
                                </div>
                            )}
                        </div>
                    )}
                </Stack>
            </div>
        </PageShell>
    );
};

export default CashierCreateUser;
