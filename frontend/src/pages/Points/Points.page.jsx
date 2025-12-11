import React, { useState, useEffect } from 'react';
import { Typography, LinearProgress, Chip, Card, CardContent, Box, Grid, Stack, Avatar, Divider, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/auth';
import PageShell from '../../components/PageShell.comp';
import { Stars, TrendingUp, TrendingDown, AccountBalanceWallet, Timeline, CheckCircle } from '@mui/icons-material';
import transactionService from '../../services/transaction.service';
import { useNotification } from '../../context/notification';

const PointsPage = () => {
    const { currentUser, refreshUser } = useAuth();
    const { showMessage } = useNotification();
    const [recent, setRecent] = useState([]);
    const [loading, setLoading] = useState(true);
    const points = currentUser?.points ?? 0;
    const maxPoints = 1000; // Example max for progress bar
    const progressPercent = Math.min(100, (points / maxPoints) * 100);

    // Fetch recent transactions
    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            try {
                // Fetch transactions for current user
                const response = await transactionService.getTransactions();

                // Handle different response formats
                let transactions = [];
                if (Array.isArray(response)) {
                    transactions = response;
                } else if (response?.data && Array.isArray(response.data)) {
                    transactions = response.data;
                } else if (response?.results && Array.isArray(response.results)) {
                    transactions = response.results;
                } else if (response?.transactions && Array.isArray(response.transactions)) {
                    transactions = response.transactions;
                }

                // Sort by date (most recent first) and take the last 10
                const sortedTransactions = transactions
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 10);

                // Format transactions for display
                const formattedTransactions = sortedTransactions.map(t => ({
                    id: t.id,
                    desc: t.remark || t.type || 'Transaction',
                    points: t.amount || 0,
                    type: t.amount > 0 ? 'earn' : 'redeem',
                    createdAt: t.createdAt || new Date()
                }));

                setRecent(formattedTransactions);

                // Refresh user data to get updated points balance
                if (refreshUser) {
                    await refreshUser();
                }
            } catch (error) {
                console.error('Failed to fetch transactions:', error);
                showMessage('Failed to load recent transactions', 'error');
                setRecent([]);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchTransactions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    // Calculate stats
    const totalEarned = recent.filter(r => r.points > 0).reduce((sum, r) => sum + r.points, 0);
    const totalSpent = Math.abs(recent.filter(r => r.points < 0).reduce((sum, r) => sum + r.points, 0));

    return (
        <PageShell title="Points" subtitle="Monitor your balance and recent activity.">
            {/* Hero Section - Points Balance */}
            <Card className="section-card section-card--glow" sx={{ mb: 4 }}>
                <CardContent sx={{ p: 4 }}>
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={8}>
                            <Stack spacing={3}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar sx={{
                                        bgcolor: 'primary.main',
                                        width: 64,
                                        height: 64,
                                        boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)'
                                    }}>
                                        <Stars sx={{ fontSize: 36 }} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" sx={{
                                            textTransform: 'uppercase',
                                            letterSpacing: 1,
                                            fontWeight: 600,
                                            mb: 0.5
                                        }}>
                                            Available Balance
                                        </Typography>
                                        <Typography variant="h2" sx={{
                                            fontWeight: 800,
                                            background: 'linear-gradient(135deg, #7C3AED, #9333EA)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent'
                                        }}>
                                            {points.toLocaleString()} pts
                                        </Typography>
                                    </Box>
                                </Stack>

                                {/* Progress Bar */}
                                <Box>
                                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Progress to next tier
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                            {points} / {maxPoints}
                                        </Typography>
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        value={progressPercent}
                                        sx={{
                                            height: 10,
                                            borderRadius: 999,
                                            background: 'rgba(124, 58, 237, 0.1)',
                                            '& .MuiLinearProgress-bar': {
                                                background: 'linear-gradient(90deg, #7C3AED, #9333EA)',
                                                borderRadius: 999
                                            }
                                        }}
                                    />
                                </Box>

                                {/* Member Info */}
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Member: <strong style={{ color: 'var(--text)' }}>{currentUser?.name ?? 'Guest'}</strong>
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Grid>

                        {/* Stats Summary */}
                        <Grid item xs={12} md={4}>
                            <Stack spacing={2}>
                                <Card sx={{
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.2)'
                                }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                            <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                                                <TrendingUp />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Total Earned
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                                                    +{totalEarned}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>

                                <Card sx={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)'
                                }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                            <Avatar sx={{ bgcolor: 'error.main', width: 40, height: 40 }}>
                                                <TrendingDown />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Total Spent
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                                                    -{totalSpent}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Stack>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="section-card section-card--glow">
                <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                        <Timeline sx={{ color: 'primary.main', fontSize: 28 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Recent Transactions
                        </Typography>
                    </Stack>

                    {loading ? (
                        <Box sx={{
                            textAlign: 'center',
                            py: 6
                        }}>
                            <CircularProgress />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                Loading transactions...
                            </Typography>
                        </Box>
                    ) : recent.length === 0 ? (
                        <Box sx={{
                            textAlign: 'center',
                            py: 6,
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '12px'
                        }}>
                            <AccountBalanceWallet sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.2)', mb: 2 }} />
                            <Typography variant="body1" color="text.secondary" gutterBottom>
                                No recent transactions
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Your activity will appear here
                            </Typography>
                        </Box>
                    ) : (
                        <Stack spacing={2}>
                            {recent.map((r, index) => (
                                <Box key={r.id}>
                                    <Card sx={{
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(124, 58, 237, 0.2)',
                                            transform: 'translateX(4px)'
                                        }
                                    }}>
                                        <CardContent sx={{ p: 2.5 }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Avatar sx={{
                                                        bgcolor: r.points > 0 ? 'success.main' : 'warning.main',
                                                        width: 44,
                                                        height: 44
                                                    }}>
                                                        {r.points > 0 ? <TrendingUp /> : <TrendingDown />}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                            {r.desc}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(r.createdAt).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                                <Chip
                                                    label={`${r.points > 0 ? '+' : ''}${r.points}`}
                                                    color={r.points > 0 ? 'success' : 'warning'}
                                                    sx={{
                                                        fontWeight: 700,
                                                        fontSize: '0.9rem',
                                                        minWidth: 80
                                                    }}
                                                />
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                    {index < recent.length - 1 && <Divider sx={{ opacity: 0 }} />}
                                </Box>
                            ))}
                        </Stack>
                    )}
                </CardContent>
            </Card>
        </PageShell>
    );
};

export default PointsPage;
