import React, { useEffect, useMemo, useState } from 'react';
import { Typography, Chip, Stack, TextField, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, Button, Pagination, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Card, CardContent, Box, Grid, Avatar, Divider } from '@mui/material';
import PageShell from "../../components/PageShell.comp";
import transactionService from '../../services/transaction.service';
import userService from '../../services/user.service';
import { useNotification } from '../../context/notification';
import { useAuth } from '../../context/auth';
import { ShoppingCart, CardGiftcard, SwapHoriz, AccountBalanceWallet, TrendingUp, TrendingDown, Person, CalendarToday, Build } from '@mui/icons-material';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [typeFilter, setTypeFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [detailTx, setDetailTx] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [userDetails, setUserDetails] = useState({}); // Map of userId -> user details
    const { showMessage } = useNotification();
    const { currentUser, activeInterface } = useAuth();

    // Use activeInterface if available, otherwise fall back to currentUser.role
    const effectiveRole = activeInterface || currentUser?.role;
    const isManager = currentUser && (effectiveRole === 'manager' || effectiveRole === 'superuser');

    // Fetch user details for relatedId
    const fetchUserDetails = async (userId) => {
        if (!userId || userDetails[userId]) return;
        try {
            const user = await userService.getUser(userId);
            const userData = user?.data || user;
            setUserDetails(prev => ({
                ...prev,
                [userId]: {
                    utorid: userData?.utorid || 'Unknown',
                    name: userData?.name || 'Unknown User'
                }
            }));
        } catch (err) {
            console.error('Failed to fetch user details:', err);
            setUserDetails(prev => ({
                ...prev,
                [userId]: { utorid: 'Unknown', name: 'Unknown User' }
            }));
        }
    };

    useEffect(() => {
        const loadTransactions = async () => {
            setLoading(true);
            try {
                const params = { type: typeFilter === 'all' ? undefined : typeFilter, page, limit, name: searchTerm || undefined };
                let resp;
                // managers and superusers can fetch all transactions
                if (currentUser && (effectiveRole === 'manager' || effectiveRole === 'superuser')) {
                    resp = await transactionService.getTransactions(undefined, undefined, undefined, undefined, params.type, undefined, undefined, undefined, page, limit);
                } else {
                    resp = await transactionService.getMyTransactions(params.type, undefined, undefined, undefined, undefined, page, limit);
                }

                // resp may be array or { count, results }
                let list;
                if (Array.isArray(resp)) list = resp;
                else if (Array.isArray(resp.results)) list = resp.results;
                else if (Array.isArray(resp.data)) list = resp.data;
                else list = [];

                const total = resp?.count ?? resp?.total ?? list.length;
                setTransactions(list);
                setTotalPages(Math.max(1, Math.ceil((total || list.length) / limit)));

                // Fetch user details for all transactions with relatedId
                list.forEach(tx => {
                    if (tx.relatedId) {
                        fetchUserDetails(tx.relatedId);
                    }
                });
            } catch (err) {
                console.error(err);
                showMessage('Failed to load transactions', 'error');
            } finally {
                setLoading(false);
            }
        };
        loadTransactions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showMessage, page, limit, typeFilter, searchTerm, currentUser, effectiveRole]);

    const exportCsv = () => {
        const headers = ['id','type','amount','createdAt','remark','utorid','spent','relatedId'];
        const rows = filteredTx.map(r => [r.id, r.type, r.amount, r.createdAt, r.remark || '', r.utorid || '', r.spent || '', r.relatedId || '']);
        const csv = [headers, ...rows].map(r => r.map(c => `"${String(c ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transactions.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const typeColor = (type) => {
        switch(type?.toLowerCase()) {
            case 'purchase': return 'success';
            case 'redemption': return 'warning';
            case 'transfer': return 'info';
            case 'adjustment': return 'error';
            case 'event': return 'secondary';
            default: return 'default';
        }
    };

    // Get background color for transaction type
    const getTypeBackground = (type) => {
        switch(type?.toLowerCase()) {
            case 'purchase': return 'rgba(16, 185, 129, 0.1)';
            case 'redemption': return 'rgba(251, 146, 60, 0.1)';
            case 'transfer': return 'rgba(6, 182, 212, 0.1)';
            case 'adjustment': return 'rgba(239, 68, 68, 0.1)';
            case 'event': return 'rgba(168, 85, 247, 0.1)';
            default: return 'rgba(255, 255, 255, 0.03)';
        }
    };

    // Get border color for transaction type
    const getTypeBorder = (type) => {
        switch(type?.toLowerCase()) {
            case 'purchase': return 'rgba(16, 185, 129, 0.3)';
            case 'redemption': return 'rgba(251, 146, 60, 0.3)';
            case 'transfer': return 'rgba(6, 182, 212, 0.3)';
            case 'adjustment': return 'rgba(239, 68, 68, 0.3)';
            case 'event': return 'rgba(168, 85, 247, 0.3)';
            default: return 'rgba(255, 255, 255, 0.08)';
        }
    };

    // Get icon for transaction type
    const getTypeIcon = (type) => {
        switch(type?.toLowerCase()) {
            case 'purchase': return <ShoppingCart />;
            case 'redemption': return <CardGiftcard />;
            case 'transfer': return <SwapHoriz />;
            case 'adjustment': return <Build />;
            case 'event': return <CalendarToday />;
            default: return <AccountBalanceWallet />;
        }
    };

    // Get avatar color for transaction type
    const getAvatarColor = (type) => {
        switch(type?.toLowerCase()) {
            case 'purchase': return 'success.main';
            case 'redemption': return 'warning.main';
            case 'transfer': return 'info.main';
            case 'adjustment': return 'error.main';
            case 'event': return 'secondary.main';
            default: return 'primary.main';
        }
    };

    const filteredTx = useMemo(() => {
        return transactions.filter(t => {
            if (typeFilter !== 'all' && t.type?.toLowerCase() !== typeFilter) return false;
            const target = ((t.remark || '') + ' ' + (t.utorid || '')).toLowerCase();
            if (searchTerm && !target.includes(searchTerm.toLowerCase())) return false;
            return true;
        });
    }, [transactions, typeFilter, searchTerm]);

    const stats = useMemo(() => {
        const net = filteredTx.reduce((sum, entry) => sum + (entry.amount || 0), 0);
        const purchases = filteredTx.filter(t => t.type?.toLowerCase() === 'purchase').length;
        return [
            { label: 'Net points', value: `${net > 0 ? '+' : ''}${net}` },
            { label: 'Purchases', value: purchases },
            { label: 'Records', value: filteredTx.length },
        ];
    }, [filteredTx]);

    return (
        <PageShell title="Transactions" subtitle="Filter, audit, and export your full ledger." stats={stats} align="left">
            <section className="transactions-layout">
                {/* Toolbar */}
                <Card className="section-card section-card--glow" sx={{ mb: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ xs: 'stretch', lg: 'center' }}>
                            <TextField
                                label="Search"
                                placeholder="Search remarks or UTORid"
                                fullWidth
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                size="small"
                            />
                            <TextField
                                select
                                label="Type"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                fullWidth
                                size="small"
                            >
                                <MenuItem value="all">All Types</MenuItem>
                                <MenuItem value="purchase">Purchase</MenuItem>
                                <MenuItem value="redemption">Redemption</MenuItem>
                                <MenuItem value="transfer">Transfer</MenuItem>
                                <MenuItem value="adjustment">Adjustment</MenuItem>
                                <MenuItem value="event">Event</MenuItem>
                            </TextField>
                            <Button
                                variant="contained"
                                onClick={exportCsv}
                                sx={{ minWidth: { xs: 'auto', lg: 150 } }}
                            >
                                Export CSV
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Transaction Cards */}
                <Card className="section-card section-card--glow">
                    <CardContent sx={{ p: 3 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    Transaction History
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {filteredTx.length} transaction{filteredTx.length !== 1 ? 's' : ''} found
                                </Typography>
                            </Box>
                            {totalPages > 1 && (
                                <Pagination
                                    count={totalPages}
                                    page={page}
                                    onChange={(e, v) => setPage(v)}
                                    color="primary"
                                    size="small"
                                />
                            )}
                        </Stack>

                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                <CircularProgress />
                            </Box>
                        ) : filteredTx.length === 0 ? (
                            <Box sx={{
                                textAlign: 'center',
                                py: 6,
                                background: 'rgba(255, 255, 255, 0.02)',
                                borderRadius: '12px'
                            }}>
                                <AccountBalanceWallet sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.2)', mb: 2 }} />
                                <Typography variant="body1" color="text.secondary" gutterBottom>
                                    No transactions found
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Try adjusting your filters
                                </Typography>
                            </Box>
                        ) : (
                            <Stack spacing={2}>
                                {filteredTx.map((tx) => (
                                    <Card
                                        key={tx.id}
                                        sx={{
                                            background: getTypeBackground(tx.type),
                                            border: `1px solid ${getTypeBorder(tx.type)}`,
                                            borderRadius: '12px',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                transform: 'translateX(4px)',
                                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ p: 2.5 }}>
                                            <Grid container spacing={2} alignItems="center">
                                                {/* Icon and Type */}
                                                <Grid item xs={12} sm={6} md={3}>
                                                    <Stack direction="row" spacing={2} alignItems="center">
                                                        <Avatar
                                                            sx={{
                                                                bgcolor: getAvatarColor(tx.type),
                                                                width: 48,
                                                                height: 48
                                                            }}
                                                        >
                                                            {getTypeIcon(tx.type)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                                                {tx.type}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                ID: #{tx.id}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </Grid>

                                                {/* Description and Related User */}
                                                <Grid item xs={12} sm={6} md={4}>
                                                    <Box>
                                                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                            {tx.remark || 'No description'}
                                                        </Typography>
                                                        {tx.relatedId && userDetails[tx.relatedId] ? (
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {tx.type?.toLowerCase() === 'transfer' && tx.amount < 0 ? 'To: ' :
                                                                     tx.type?.toLowerCase() === 'transfer' && tx.amount > 0 ? 'From: ' : ''}
                                                                    <strong>{userDetails[tx.relatedId].utorid}</strong>
                                                                    {userDetails[tx.relatedId].name !== 'Unknown User' &&
                                                                     ` (${userDetails[tx.relatedId].name})`}
                                                                </Typography>
                                                            </Stack>
                                                        ) : tx.relatedId ? (
                                                            <Typography variant="caption" color="text.secondary">
                                                                Loading user...
                                                            </Typography>
                                                        ) : null}
                                                    </Box>
                                                </Grid>

                                                {/* Date */}
                                                <Grid item xs={6} md={2}>
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                            Date
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '-'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString() : ''}
                                                        </Typography>
                                                    </Box>
                                                </Grid>

                                                {/* Points */}
                                                <Grid item xs={6} md={2}>
                                                    <Box sx={{ textAlign: 'right' }}>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                            Points
                                                        </Typography>
                                                        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
                                                            {tx.amount >= 0 ? (
                                                                <TrendingUp sx={{ fontSize: 20, color: 'success.main' }} />
                                                            ) : (
                                                                <TrendingDown sx={{ fontSize: 20, color: 'error.main' }} />
                                                            )}
                                                            <Typography
                                                                variant="h6"
                                                                sx={{
                                                                    fontWeight: 700,
                                                                    color: tx.amount >= 0 ? 'success.main' : 'error.main'
                                                                }}
                                                            >
                                                                {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                                                            </Typography>
                                                        </Stack>
                                                        {tx.spent > 0 && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                ${tx.spent} spent
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Grid>

                                                {/* Actions */}
                                                <Grid item xs={12} md={1}>
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={async () => {
                                                                try {
                                                                    const resp = await transactionService.getTransaction(tx.id);
                                                                    setDetailTx(resp);
                                                                    setDetailOpen(true);
                                                                } catch(e) {
                                                                    showMessage('Failed to load detail', 'error');
                                                                }
                                                            }}
                                                            sx={{ textTransform: 'none' }}
                                                        >
                                                            View
                                                        </Button>
                                                    </Stack>
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        )}

                        {/* Pagination Footer */}
                        {totalPages > 1 && (
                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                                <Pagination
                                    count={totalPages}
                                    page={page}
                                    onChange={(e, v) => setPage(v)}
                                    color="primary"
                                />
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </section>

            <Dialog open={detailOpen} onClose={()=>setDetailOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 700 }}>Transaction Details</DialogTitle>
                <DialogContent>
                    {detailTx ? (
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Transaction ID</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>#{detailTx.id}</Typography>
                            </Box>

                            <Divider />

                            <Box>
                                <Typography variant="caption" color="text.secondary">Type</Typography>
                                <Box sx={{ mt: 0.5 }}>
                                    <Chip
                                        label={detailTx.type}
                                        color={typeColor(detailTx.type)}
                                        icon={getTypeIcon(detailTx.type)}
                                        sx={{ fontWeight: 600 }}
                                    />
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">Amount</Typography>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 700,
                                        color: detailTx.amount >= 0 ? 'success.main' : 'error.main'
                                    }}
                                >
                                    {detailTx.amount > 0 ? `+${detailTx.amount}` : detailTx.amount} pts
                                </Typography>
                            </Box>

                            {detailTx.spent > 0 && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Amount Spent</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>${detailTx.spent}</Typography>
                                </Box>
                            )}

                            <Box>
                                <Typography variant="caption" color="text.secondary">Description</Typography>
                                <Typography variant="body1">{detailTx.remark || 'No description provided'}</Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">Date & Time</Typography>
                                <Typography variant="body1">
                                    {detailTx.createdAt ? new Date(detailTx.createdAt).toLocaleString() : 'N/A'}
                                </Typography>
                            </Box>

                            {detailTx.relatedId && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {detailTx.type?.toLowerCase() === 'transfer' && detailTx.amount < 0 ? 'Sent To' :
                                         detailTx.type?.toLowerCase() === 'transfer' && detailTx.amount > 0 ? 'Received From' :
                                         'Related User'}
                                    </Typography>
                                    {userDetails[detailTx.relatedId] ? (
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                                <Person sx={{ fontSize: 20 }} />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                    {userDetails[detailTx.relatedId].utorid}
                                                </Typography>
                                                {userDetails[detailTx.relatedId].name !== 'Unknown User' && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {userDetails[detailTx.relatedId].name}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Stack>
                                    ) : (
                                        <Typography variant="body1">Loading user information...</Typography>
                                    )}
                                </Box>
                            )}
                        </Stack>
                    ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={()=>setDetailOpen(false)} variant="contained">Close</Button>
                </DialogActions>
            </Dialog>
        </PageShell>
    );
}

export default Transactions;
