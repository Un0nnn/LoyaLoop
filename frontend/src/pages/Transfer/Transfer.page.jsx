import React, { useState } from 'react';
import { Typography, TextField, Button, Stack } from '@mui/material';
import { useAuth } from '../../context/auth';
import PageShell from '../../components/PageShell.comp';
import userService from '../../services/user.service';
import transactionService from '../../services/transaction.service';
import { useNotification } from '../../context/notification';

const Transfer = () => {
    const { currentUser, setCurrentUser } = useAuth();
    const { showMessage } = useNotification();
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [remark, setRemark] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!recipient || !amount) {
            showMessage('Please provide recipient and amount', 'warning');
            return;
        }

        const amountNum = parseInt(amount, 10);
        if (Number.isNaN(amountNum) || amountNum <= 0) {
            showMessage('Amount must be a positive whole number', 'warning');
            return;
        }

        if (amountNum > (currentUser?.points || 0)) {
            showMessage('Insufficient points', 'warning');
            return;
        }

        setLoading(true);
        try {
            const usersResp = await userService.getUsers(undefined, undefined, undefined, recipient);
            // normalize response shapes from apiClient (apiClient returns response.data directly)
            let users;
            if (Array.isArray(usersResp)) users = usersResp;
            else if (Array.isArray(usersResp.results)) users = usersResp.results;
            else if (Array.isArray(usersResp.data)) users = usersResp.data;
            else if (Array.isArray(usersResp.users)) users = usersResp.users;
            else users = [];

            if (!users || users.length === 0) {
                showMessage('Recipient not found', 'error');
                return;
            }

            const recipientUser = users[0];
            await transactionService.createTransfer(recipientUser.id, 'transfer', amountNum, remark || 'Points transfer');

            showMessage('Transfer completed successfully', 'success');
            setRecipient('');
            setAmount('');
            setRemark('');
            // refresh current user to update points balance
            try {
                const me = await userService.getCurrentUser();
                if (me && setCurrentUser) setCurrentUser(me);
            } catch (e) {
                // ignore refresh errors
            }
        } catch (err) {
            console.error(err);
            const errorMsg = err?.response?.data?.error || err?.message || err?.toString();
            showMessage('Failed to transfer points: ' + errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageShell title="Transfer Points" subtitle="Send points securely to another user.">
            <div className="glass-panel centered-panel">
                <Stack component="form" onSubmit={handleSubmit} spacing={2} className="form-panel">
                    <Typography color="text.secondary">Your balance: {currentUser?.points ?? 0} pts</Typography>
                    <TextField
                        label="Recipient UTORid"
                        value={recipient}
                        onChange={(e)=>setRecipient(e.target.value)}
                        fullWidth
                        required
                        disabled={loading}
                    />
                    <TextField
                        label="Points to transfer"
                        type="number"
                        value={amount}
                        onChange={(e)=>setAmount(e.target.value)}
                        fullWidth
                        required
                        disabled={loading}
                        inputProps={{
                            min: 1,
                            step: 1
                        }}
                        helperText="Enter whole number of points"
                    />
                    <TextField
                        label="Remark (optional)"
                        value={remark}
                        onChange={(e)=>setRemark(e.target.value)}
                        fullWidth
                        disabled={loading}
                    />
                    <Button type="submit" variant="contained" size="large" disabled={loading}>
                        {loading ? 'Sending...' : 'Send'}
                    </Button>
                </Stack>
            </div>
        </PageShell>
    );
}

export default Transfer;
