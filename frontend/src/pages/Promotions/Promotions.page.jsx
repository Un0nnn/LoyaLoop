import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell from '../../components/PageShell.comp';
import { Button, Stack, TextField, Table, TableHead, TableBody, TableRow, TableCell, Typography, CircularProgress, Chip, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import promotionService from '../../services/promotion.service';
import { useNotification } from '../../context/notification';
import SafeHtml from '../../components/SafeHtml.comp';
import { LocalOfferOutlined, AccessTime, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Promotions = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Initialize from URL params
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [sort, setSort] = useState(searchParams.get('sort') || 'recent');
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewPromo, setViewPromo] = useState(null);
    const { showMessage } = useNotification();

    // Update URL when filters change
    useEffect(() => {
        const params = {};
        if (search) params.search = search;
        if (sort !== 'recent') params.sort = sort;

        setSearchParams(params, { replace: true });
    }, [search, sort, setSearchParams]);

    const loadPromos = useCallback(async () => {
        setLoading(true);
        try {
            const resp = await promotionService.getPromotions();
            const list = Array.isArray(resp) ? resp : (resp?.results || resp?.data?.promotions || resp?.data || []);
            setPromos(list);
        } catch (err) {
            console.error(err);
            showMessage('Failed to load promotions', 'error');
        } finally {
            setLoading(false);
        }
    }, [showMessage]);

    useEffect(() => {
        loadPromos();
    }, [loadPromos]);

    const isActive = (promo) => {
        const now = new Date();
        const start = promo.startTime ? new Date(promo.startTime) : null;
        const end = promo.endTime ? new Date(promo.endTime) : null;
        return (!start || start <= now) && (!end || end >= now);
    };

    const filtered = useMemo(() => {
        const searchLower = search.toLowerCase();
        const sorted = [...promos]
            .filter(p => (p.name || '').toLowerCase().includes(searchLower));
        if (sort === 'multiplier') {
            sorted.sort((a, b) => (b.rate || 0) - (a.rate || 0));
        } else {
            sorted.sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0));
        }
        return sorted;
    }, [promos, search, sort]);

    const handleCreate = () => navigate('/manager/promotions');

    const handleView = (promo) => setViewPromo(promo);

    return (
        <PageShell title="Active Promotions" subtitle="Maximize your points with these special offers.">
            {/* Filter Bar */}
            <div className="section-card section-card--glow" style={{marginBottom:24}}>
                <Stack direction={{xs:'column', md:'row'}} spacing={2} alignItems="center">
                    <TextField
                        label="Search Promotions"
                        placeholder="Name or description"
                        value={search}
                        onChange={(e)=>setSearch(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        select
                        label="Sort By"
                        value={sort}
                        onChange={(e)=>setSort(e.target.value)}
                        sx={{minWidth: 200}}
                    >
                        <MenuItem value="recent">Most Recent</MenuItem>
                        <MenuItem value="multiplier">Highest Multiplier</MenuItem>
                        <MenuItem value="name">Name (A-Z)</MenuItem>
                    </TextField>
                    <Button variant="contained" onClick={loadPromos} disabled={loading}>
                        Refresh
                    </Button>
                    <Button variant="contained" onClick={handleCreate}>
                        Manage
                    </Button>
                </Stack>
            </div>

            {/* Promotions Table */}
            <div className="section-card">
                {loading ? (
                    <div style={{padding:48, textAlign:'center'}}>
                        <CircularProgress />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <LocalOfferOutlined sx={{ fontSize: 64, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>No promotions found</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {search ? 'Try adjusting your search terms' : 'Check back later for new promotions'}
                        </Typography>
                    </div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Promotion Name</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Value</TableCell>
                                <TableCell>Valid Period</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.map(promo => {
                                const active = isActive(promo);
                                const startDate = promo.startTime ? new Date(promo.startTime).toLocaleDateString() : 'Now';
                                const endDate = promo.endTime ? new Date(promo.endTime).toLocaleDateString() : 'No End';

                                return (
                                    <TableRow key={promo.id} hover>
                                        <TableCell>
                                            <Typography variant="body1" fontWeight={600}>
                                                {promo.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{mt: 0.5}}>
                                                {promo.description?.replace(/<[^>]*>/g, '').substring(0, 80)}...
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={promo.type || 'automatic'}
                                                size="small"
                                                sx={{textTransform: 'capitalize'}}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <LocalOfferOutlined fontSize="small" color="primary" />
                                                <Typography variant="body1" fontWeight={700}>
                                                    {promo.type === 'rate' || promo.rate ?
                                                        `${promo.rate || 1}x` :
                                                        `${promo.points || 0} pts`
                                                    }
                                                </Typography>
                                            </Stack>
                                            {promo.minSpending && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Min: ${promo.minSpending}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Stack spacing={0.5}>
                                                <Typography variant="body2">
                                                    <AccessTime sx={{fontSize: 14, verticalAlign: 'middle', mr: 0.5}} />
                                                    {startDate}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    to {endDate}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={active ? 'Active' : 'Expired'}
                                                color={active ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <Button
                                                    size="small"
                                                    startIcon={<Visibility />}
                                                    onClick={() => handleView(promo)}
                                                >
                                                    View
                                                </Button>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* View Promotion Dialog */}
            <Dialog open={!!viewPromo} onClose={()=>setViewPromo(null)} fullWidth maxWidth="md">
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
                    {viewPromo?.name}
                </DialogTitle>
                <DialogContent>
                    {viewPromo && (
                        <Stack spacing={3} sx={{mt: 2}}>
                            <Stack direction="row" spacing={2} flexWrap="wrap">
                                <Chip label={viewPromo.type || 'automatic'} sx={{textTransform: 'capitalize'}} />
                                <Chip
                                    label={isActive(viewPromo) ? 'Active' : 'Expired'}
                                    color={isActive(viewPromo) ? 'success' : 'default'}
                                />
                                <Chip
                                    icon={<LocalOfferOutlined />}
                                    label={viewPromo.type === 'rate' || viewPromo.rate ?
                                        `${viewPromo.rate || 1}x Multiplier` :
                                        `${viewPromo.points || 0} Points`
                                    }
                                    color="primary"
                                />
                            </Stack>

                            <div>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Description
                                </Typography>
                                <SafeHtml html={viewPromo.description} />
                            </div>

                            {viewPromo.minSpending && (
                                <div>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Minimum Spending
                                    </Typography>
                                    <Typography variant="body1">
                                        ${viewPromo.minSpending}
                                    </Typography>
                                </div>
                            )}

                            <div>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Valid Period
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <AccessTime fontSize="small" />
                                    <Typography variant="body1">
                                        {viewPromo.startTime ? new Date(viewPromo.startTime).toLocaleString() : 'Now'}
                                        {' → '}
                                        {viewPromo.endTime ? new Date(viewPromo.endTime).toLocaleString() : 'No End Date'}
                                    </Typography>
                                </Stack>
                            </div>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{p: 3}}>
                    <Button onClick={()=>setViewPromo(null)} variant="outlined">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </PageShell>
    );
};

export default Promotions;
