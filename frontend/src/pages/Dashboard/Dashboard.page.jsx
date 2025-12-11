import React from 'react';
import PageShell from "../../components/PageShell.comp";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from '../../context/auth';
import QRViewer from '../../components/QRViewer.comp';
import { Button, Typography, CircularProgress, Card, CardContent, Box, Grid, Chip, Stack, Avatar } from '@mui/material';
import { Link } from 'react-router-dom';
import transactionService from '../../services/transaction.service';
import userService from '../../services/user.service';
import eventService from '../../services/event.service';
import promotionService from '../../services/promotion.service';
import { useNotification } from '../../context/notification';
import { TrendingUp, People, Event, LocalOffer, QrCode2, Timeline, Verified } from '@mui/icons-material';

const Dashboard = () => {
    const { currentUser, activeInterface, refreshUser } = useAuth();

    const [copied, setCopied] = React.useState(false);
    const [recent, setRecent] = React.useState([]);
    const [loadingRecent, setLoadingRecent] = React.useState(false);
    const [overviewCounts, setOverviewCounts] = React.useState({ users: null, events: null, promotions: null });
    const displayName = currentUser?.name || currentUser?.utorid || 'Member';

    // Use activeInterface if available, otherwise fall back to currentUser.role
    const effectiveRole = activeInterface || currentUser?.role || 'member';
    const roleLabel = effectiveRole.replace(/_/g, ' ');

    const userId = currentUser?.utorid || 'u1';
    const qrPayload = `user:${userId}`;
    const points = currentUser?.points ?? 0;
    const { showMessage } = useNotification();

    // Manager overview with modern card design
    const ManagerOverview = () => (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
                <Card className="section-card section-card--glow" sx={{ height: '100%' }}>
                    <CardContent>
                        <Stack spacing={2}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                                    <People />
                                </Avatar>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Total Users
                                </Typography>
                            </Stack>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                {overviewCounts.users ?? '—'}
                            </Typography>
                            <Button
                                component={Link}
                                to="/manager/users"
                                size="small"
                                variant="contained"
                                fullWidth
                                sx={{ textTransform: 'none', borderRadius: '8px' }}
                            >
                                Manage Users
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
                <Card className="section-card section-card--glow" sx={{ height: '100%' }}>
                    <CardContent>
                        <Stack spacing={2}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                                    <Event />
                                </Avatar>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Total Events
                                </Typography>
                            </Stack>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                {overviewCounts.events ?? '—'}
                            </Typography>
                            <Button
                                component={Link}
                                to="/manager/events"
                                size="small"
                                variant="contained"
                                fullWidth
                                sx={{ textTransform: 'none', borderRadius: '8px' }}
                            >
                                Manage Events
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
                <Card className="section-card section-card--glow" sx={{ height: '100%' }}>
                    <CardContent>
                        <Stack spacing={2}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Avatar sx={{ bgcolor: 'warning.main', width: 40, height: 40 }}>
                                    <LocalOffer />
                                </Avatar>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Promotions
                                </Typography>
                            </Stack>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                {overviewCounts.promotions ?? '—'}
                            </Typography>
                            <Button
                                component={Link}
                                to="/manager/promotions"
                                size="small"
                                variant="contained"
                                fullWidth
                                sx={{ textTransform: 'none', borderRadius: '8px' }}
                            >
                                Manage Promos
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    // Derive chart data from recent transactions (fallback to sample data)
    const chartData = React.useMemo(() => {
        if (Array.isArray(recent) && recent.length > 0) {
            // Map recent transactions to a points time series (most recent first)
            return recent.slice(0, 6).map((r, idx) => ({ name: `${idx + 1}`, points: Number(r.amount || r.points || 0) }));
        }
        // fallback sample
        return [
            { name: '1', points: 0 },
            { name: '2', points: 0 },
            { name: '3', points: 0 },
            { name: '4', points: 0 },
            { name: '5', points: 0 },
            { name: '6', points: 0 },
        ];
    }, [recent]);

    React.useEffect(() => {
        const loadRecent = async () => {
            setLoadingRecent(true);
            try {
                // Refresh current user from backend to get updated points
                if (refreshUser) {
                    await refreshUser();
                }

                const txResp = await transactionService.getMyTransactions(undefined, undefined, undefined, undefined, undefined, 1, 6);
                let list = Array.isArray(txResp) ? txResp : (txResp?.results || txResp?.data || []);
                setRecent(list);
            } catch (err) {
                console.error('Failed to load recent transactions', err);
                showMessage('Failed to load recent transactions', 'error');
            } finally { setLoadingRecent(false); }
        };

        const loadOverview = async () => {
            if (!currentUser) return;
            if (effectiveRole === 'manager' || effectiveRole === 'superuser') {
                try {
                    const [uResp, eResp, pResp] = await Promise.all([
                        userService.getUsers(undefined, undefined, undefined, undefined, 1, 1),
                        eventService.getEvents(undefined, undefined, undefined, undefined, undefined, undefined, 1, 1),
                        promotionService.getPromotions(undefined, undefined, undefined, undefined, 1, 1),
                    ]);
                    const usersTotal = uResp?.count ?? uResp?.total ?? (Array.isArray(uResp) ? uResp.length : null);
                    const eventsTotal = eResp?.count ?? eResp?.total ?? (Array.isArray(eResp) ? eResp.length : null);
                    const promosTotal = pResp?.count ?? pResp?.total ?? (Array.isArray(pResp) ? pResp.length : null);
                    setOverviewCounts({ users: usersTotal, events: eventsTotal, promotions: promosTotal });
                } catch (err) {
                    console.error('Failed to load overview counts', err);
                }
            }
        };

        loadRecent();
        loadOverview();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveRole]);

    const handleCopyPayload = async () => {
        try {
            await navigator.clipboard.writeText(qrPayload);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch (err) {
            console.warn('Clipboard copy failed', err);
        }
    };

    const handleOpenQr = () => {
        const url = `/qr?mode=user&payload=${encodeURIComponent(qrPayload)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <PageShell
            title="Dashboard"
            subtitle={`Welcome back, ${displayName}`}
            align="center"
            showRail={false}
        >
            {/* Hero Section with Points */}
            <Card className="section-card section-card--glow" sx={{ mb: 4 }}>
                <CardContent sx={{ p: 4 }}>
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={8}>
                            <Stack spacing={2}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar sx={{
                                        bgcolor: 'primary.main',
                                        width: 56,
                                        height: 56,
                                        boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)'
                                    }}>
                                        <TrendingUp sx={{ fontSize: 32 }} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                                            Available Points
                                        </Typography>
                                        <Typography variant="h2" sx={{
                                            fontWeight: 800,
                                            background: 'linear-gradient(135deg, #7C3AED, #9333EA)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent'
                                        }}>
                                            {points.toLocaleString()}
                                        </Typography>
                                    </Box>
                                </Stack>
                                <Typography variant="body2" color="text.secondary">
                                    Stay in sync with points, transfers, and events. Use the quick links for common actions.
                                </Typography>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Stack spacing={1.5} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                                <Chip
                                    icon={<Verified />}
                                    label={roleLabel}
                                    color="primary"
                                    sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Member ID:</strong> {userId}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Updated moments ago
                                </Typography>
                            </Stack>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Manager Overview - Only for managers/superusers */}
            {(effectiveRole === 'manager' || effectiveRole === 'superuser') && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Timeline /> Management Overview
                    </Typography>
                    <ManagerOverview />
                </Box>
            )}

            <Grid container spacing={3}>
                {/* Points Activity Chart */}
                <Grid item xs={12} lg={8}>
                    <Card className="section-card section-card--glow">
                        <CardContent sx={{ p: 3 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                                        Points Activity Trend
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Last 6 transactions
                                    </Typography>
                                </Box>
                                <Chip label="In Sync" color="success" size="small" sx={{ fontWeight: 600 }} />
                            </Stack>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.9} />
                                            <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        stroke="rgba(255, 255, 255, 0.2)"
                                        tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 12 }}
                                    />
                                    <YAxis
                                        stroke="rgba(255, 255, 255, 0.2)"
                                        tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(11, 18, 32, 0.95)',
                                            border: '1px solid rgba(124, 58, 237, 0.3)',
                                            borderRadius: 12,
                                            backdropFilter: 'blur(12px)'
                                        }}
                                        labelStyle={{ color: 'rgba(255, 255, 255, 0.9)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="points"
                                        stroke="#7C3AED"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorPoints)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Column */}
                <Grid item xs={12} lg={4}>
                    <Stack spacing={3}>
                        {/* QR Code Card */}
                        <Card className="section-card section-card--glow">
                            <CardContent sx={{ p: 3 }}>
                                <Stack spacing={2}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
                                                My Member ID
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                {displayName}
                                            </Typography>
                                        </Box>
                                        <Chip label={userId} size="small" sx={{ fontWeight: 600 }} />
                                    </Stack>

                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        p: 2,
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '12px'
                                    }}>
                                        <QRViewer type="user" payload={qrPayload} size={140} />
                                    </Box>

                                    <Stack direction="row" spacing={1}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={handleCopyPayload}
                                            fullWidth
                                            sx={{ textTransform: 'none', borderRadius: '8px' }}
                                        >
                                            {copied ? 'Copied!' : 'Copy'}
                                        </Button>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={handleOpenQr}
                                            fullWidth
                                            startIcon={<QrCode2 />}
                                            sx={{ textTransform: 'none', borderRadius: '8px' }}
                                        >
                                            Open
                                        </Button>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Recent Activity Card */}
                        <Card className="section-card section-card--glow">
                            <CardContent sx={{ p: 3 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                        Recent Activity
                                    </Typography>
                                    <Button
                                        component={Link}
                                        to="/points"
                                        size="small"
                                        sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                                    >
                                        View All
                                    </Button>
                                </Stack>

                                {loadingRecent ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : recent.length === 0 ? (
                                    <Box sx={{
                                        textAlign: 'center',
                                        py: 4,
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        borderRadius: '12px'
                                    }}>
                                        <Typography variant="body2" color="text.secondary">
                                            No recent activity
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Stack spacing={1.5}>
                                        {recent.map(item => (
                                            <Box
                                                key={item.id}
                                                sx={{
                                                    p: 2,
                                                    background: 'rgba(255, 255, 255, 0.03)',
                                                    borderRadius: '12px',
                                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        background: 'rgba(255, 255, 255, 0.05)',
                                                        border: '1px solid rgba(124, 58, 237, 0.2)',
                                                    }
                                                }}
                                            >
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {item.remark || item.type}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={item.amount > 0 ? `+${item.amount}` : item.amount}
                                                        color={item.amount > 0 ? 'success' : 'error'}
                                                        size="small"
                                                        sx={{ fontWeight: 700 }}
                                                    />
                                                </Stack>
                                            </Box>
                                        ))}
                                    </Stack>
                                )}
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
            </Grid>
        </PageShell>
    );
}

export default Dashboard;
