import React, { useState, useEffect } from 'react';
import { Stack, Button, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip, CircularProgress, Card, CardContent, Box } from '@mui/material';
import PageShell from '../../components/PageShell.comp';
import transactionService from '../../services/transaction.service';
import { useNotification } from '../../context/notification';

const CashierProcess = () => {
    const [redemptions, setRedemptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const { showMessage } = useNotification();

    // Fetch pending redemptions
    const fetchRedemptions = async () => {
        setLoading(true);
        try {
            // Fetch all redemption transactions
            const response = await transactionService.getTransactions(
                undefined, // name
                undefined, // createdBy
                undefined, // suspicious
                undefined, // promotionId
                'redemption', // type
                undefined, // relatedId
                undefined, // amount
                undefined, // operator
                1, // page
                100 // limit - show up to 100 redemptions
            );

            let allRedemptions = [];
            if (Array.isArray(response)) {
                allRedemptions = response;
            } else if (response?.results && Array.isArray(response.results)) {
                allRedemptions = response.results;
            } else if (response?.data && Array.isArray(response.data)) {
                allRedemptions = response.data;
            }

            // Filter for pending redemptions
            // A redemption is pending if:
            // - createdBy is 'system' (no cashier assigned yet), OR
            // - createdBy is the customer's utorid (they created it), OR
            // - processedBy field is null/undefined
            const pending = allRedemptions.filter(tx => {
                // If createdBy is a cashier utorid (not 'system', not 'manager'), it's been processed
                const isProcessed = tx.createdBy &&
                                  tx.createdBy !== 'system' &&
                                  tx.createdBy !== tx.utorid;
                return !isProcessed;
            });

            setRedemptions(pending);
        } catch (err) {
            console.error('Failed to fetch redemptions:', err);
            showMessage('Failed to load redemptions', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRedemptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleProcess = async (redemption) => {
        setProcessingId(redemption.id);
        try {
            await transactionService.processRedemption(redemption.id, true);
            showMessage(`Redemption #${redemption.id} processed successfully`, 'success');
            // Remove from list
            setRedemptions(prev => prev.filter(r => r.id !== redemption.id));
        } catch (err) {
            console.error(err);
            const errorMsg = err?.response?.data?.error || err?.message || err?.toString();
            showMessage('Failed to process redemption: ' + errorMsg, 'error');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <PageShell title="Process Redemptions" subtitle="Complete pending redemption requests from users.">
            <Card className="section-card section-card--glow" sx={{ mb: 3 }}>
                <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Pending Redemptions
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {loading ? 'Loading...' : `${redemptions.length} pending request${redemptions.length !== 1 ? 's' : ''}`}
                            </Typography>
                        </Box>
                        <Button variant="outlined" onClick={fetchRedemptions} disabled={loading}>
                            Refresh
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <Card className="section-card">
                <CardContent sx={{ p: 0 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                            <CircularProgress />
                        </Box>
                    ) : redemptions.length === 0 ? (
                        <Box sx={{ textAlign: 'center', p: 6 }}>
                            <Typography variant="body1" color="text.secondary" gutterBottom>
                                No pending redemptions
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Redemption requests will appear here
                            </Typography>
                        </Box>
                    ) : (
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Customer</TableCell>
                                    <TableCell>Points</TableCell>
                                    <TableCell>Remark</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {redemptions.map(redemption => (
                                    <TableRow key={redemption.id}>
                                        <TableCell>
                                            <Chip label={`#${redemption.id}`} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {redemption.utorid || 'Unknown'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={`${redemption.amount || redemption.points || 0} pts`}
                                                color="warning"
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {redemption.remark || 'No remark'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label="Pending" color="warning" size="small" />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => handleProcess(redemption)}
                                                disabled={processingId === redemption.id}
                                                sx={{ textTransform: 'none' }}
                                            >
                                                {processingId === redemption.id ? 'Processing...' : 'Process'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </PageShell>
    );
}

export default CashierProcess;