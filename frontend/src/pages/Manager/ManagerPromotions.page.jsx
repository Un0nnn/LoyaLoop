import React, { useEffect, useState } from 'react';
import PageShell from '../../components/PageShell.comp';
import { Typography, Button, Stack, TextField, Chip, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Table, TableHead, TableBody, TableRow, TableCell, CircularProgress } from '@mui/material';
import promotionService from '../../services/promotion.service';
import { useNotification } from '../../context/notification';
import ConfirmDialog from '../../components/ConfirmDialog.comp';
import SafeHtml from '../../components/SafeHtml.comp';
import { Add, Edit, Delete, Visibility, LocalOfferOutlined, AccessTime } from '@mui/icons-material';

const defaultForm = {
    name: '',
    description: '',
    type: 'automatic',
    startTime: '',
    endTime: '',
    minSpending: '',
    rate: '',
    points: '',
};

const ManagerPromotions = () => {
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(false);
    const { showMessage } = useNotification();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDeleteId, setToDeleteId] = useState(null);

    const [formOpen, setFormOpen] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [form, setForm] = useState(defaultForm);
    const [editingId, setEditingId] = useState(null);
    const [viewPromo, setViewPromo] = useState(null);

    // Search and filter
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const isActive = (promo) => {
        const now = new Date();
        const start = promo.startTime ? new Date(promo.startTime) : null;
        const end = promo.endTime ? new Date(promo.endTime) : null;
        return (!start || start <= now) && (!end || end >= now);
    };

    const filteredPromos = promos.filter(p => {
        const matchesSearch = !search ||
            p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.description?.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && isActive(p)) ||
            (filterStatus === 'expired' && !isActive(p));

        return matchesSearch && matchesStatus;
    });

    const loadAll = async () => {
        setLoading(true);
        try {
            const resp = await promotionService.getPromotions();
            const list = Array.isArray(resp) ? resp : (resp?.results || resp?.data || resp?.promotions || []);
            setPromos(list);
        } catch (err) {
            console.error(err);
            showMessage('Failed to load promotions', 'error');
        } finally { setLoading(false); }
    };

    useEffect(() => { loadAll(); }, [showMessage]);

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...defaultForm });
        setFormOpen(true);
    };

    const openEdit = (p) => {
        setEditingId(p.id);
        setForm({
            name: p.name || '',
            description: p.description || '',
            type: p.type || 'automatic',
            startTime: p.startTime ? new Date(p.startTime).toISOString().slice(0,16) : '',
            endTime: p.endTime ? new Date(p.endTime).toISOString().slice(0,16) : '',
            minSpending: p.minSpending ?? '',
            rate: p.rate ?? '',
            points: p.points ?? '',
        });
        setFormOpen(true);
    };

    const handleSave = async () => {
        // Comprehensive validation
        if (!form.name || !form.description) {
            return showMessage('Name and description are required', 'warning');
        }

        if (!form.startTime || !form.endTime) {
            return showMessage('Start time and end time are required', 'warning');
        }

        const startDate = new Date(form.startTime);
        const endDate = new Date(form.endTime);

        // Check if dates are valid
        if (isNaN(startDate.getTime())) {
            return showMessage('Invalid start time', 'warning');
        }
        if (isNaN(endDate.getTime())) {
            return showMessage('Invalid end time', 'warning');
        }

        // Check if end is before start
        if (endDate <= startDate) {
            return showMessage('End time must be after start time', 'warning');
        }

        // Validate numeric fields
        if (form.minSpending !== '' && (isNaN(Number(form.minSpending)) || Number(form.minSpending) <= 0)) {
            return showMessage('Minimum spending must be a positive number', 'warning');
        }

        if (form.rate !== '' && (isNaN(Number(form.rate)) || Number(form.rate) <= 0)) {
            return showMessage('Rate must be a positive number', 'warning');
        }

        if (form.points !== '' && (!Number.isInteger(Number(form.points)) || Number(form.points) < 0)) {
            return showMessage('Points must be a non-negative integer', 'warning');
        }

        setFormLoading(true);
        try {
            const payload = {
                name: form.name,
                description: form.description,
                type: form.type,
                startTime: form.startTime ? new Date(form.startTime).toISOString() : null,
                endTime: form.endTime ? new Date(form.endTime).toISOString() : null,
                minSpending: form.minSpending === '' ? null : Number(form.minSpending),
                rate: form.rate === '' ? null : Number(form.rate),
                points: form.points === '' ? null : Number(form.points),
            };

            if (editingId) {
                await promotionService.updatePromotion(editingId, payload.name, payload.description, payload.type, payload.startTime, payload.endTime, payload.minSpending, payload.rate, payload.points);
                showMessage('Promotion updated', 'success');
            } else {
                await promotionService.createPromotion(payload.name, payload.description, payload.type, payload.startTime, payload.endTime, payload.minSpending, payload.rate, payload.points);
                showMessage('Promotion created', 'success');
            }

            setFormOpen(false);
            setEditingId(null);
            await loadAll();
        } catch (err) {
            console.error(err);
            const errorMsg = err?.response?.data?.error || err?.message || err?.toString();
            showMessage('Failed to save promotion: ' + errorMsg, 'error');
        } finally { setFormLoading(false); }
    };

    const handleDelete = (id) => {
        setToDeleteId(id);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        setConfirmOpen(false);
        try {
            await promotionService.deletePromotion(toDeleteId);
            showMessage('Promotion deleted', 'success');
            await loadAll();
        } catch (err) {
            console.error(err);
            showMessage('Failed to delete promotion: ' + (err?.message || err?.toString()), 'error');
        } finally {
            setToDeleteId(null);
        }
    };

    const handleView = (p) => setViewPromo(p);

    return (
        <PageShell title="Promotions Management" subtitle="Create, edit, and manage all promotional campaigns.">
            {/* Action Bar */}
            <div className="section-card section-card--glow" style={{marginBottom:24}}>
                <Stack direction={{xs:'column', md:'row'}} spacing={2} alignItems="center">
                    <TextField
                        label="Search Promotions"
                        placeholder="Name or description"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        select
                        label="Status"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        sx={{minWidth: 160}}
                    >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="expired">Expired</MenuItem>
                    </TextField>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={openCreate}
                        disabled={loading}
                    >
                        New
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={loadAll}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                </Stack>
            </div>

            {/* Promotions Table */}
            <div className="section-card">
                {loading ? (
                    <div style={{padding:48, textAlign:'center'}}>
                        <CircularProgress />
                    </div>
                ) : filteredPromos.length === 0 ? (
                    <div className="empty-state">
                        <LocalOfferOutlined sx={{ fontSize: 64, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>No promotions found</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {search || filterStatus !== 'all' ?
                                'Try adjusting your filters' :
                                'Create your first promotion to get started'
                            }
                        </Typography>
                    </div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Value</TableCell>
                                <TableCell>Valid Period</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredPromos.map(promo => {
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
                                                {promo.description?.replace(/<[^>]*>/g, '').substring(0, 60)}...
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
                                                    {promo.rate ? `${promo.rate}x` : promo.points ? `${promo.points} pts` : '—'}
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
                                                <Button
                                                    size="small"
                                                    startIcon={<Edit />}
                                                    onClick={() => openEdit(promo)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    startIcon={<Delete />}
                                                    onClick={() => handleDelete(promo.id)}
                                                >
                                                    Delete
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

            {/* Create / Edit Dialog */}
            <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>{editingId ? 'Edit Promotion' : 'Create Promotion'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{mt:1}}>
                        <TextField label="Name" fullWidth value={form.name} onChange={(e)=>setForm(s=>({...s, name: e.target.value}))} />
                        <TextField label="Description" fullWidth multiline minRows={3} value={form.description} onChange={(e)=>setForm(s=>({...s, description: e.target.value}))} />
                        <TextField select label="Type" value={form.type} onChange={(e)=>setForm(s=>({...s, type: e.target.value}))}>
                            <MenuItem value="automatic">Automatic</MenuItem>
                            <MenuItem value="onetime">One-time</MenuItem>
                        </TextField>
                        <Stack direction={{xs:'column', md:'row'}} spacing={2}>
                            <TextField label="Start time" type="datetime-local" InputLabelProps={{ shrink: true }} value={form.startTime} onChange={(e)=>setForm(s=>({...s, startTime: e.target.value}))} />
                            <TextField label="End time" type="datetime-local" InputLabelProps={{ shrink: true }} value={form.endTime} onChange={(e)=>setForm(s=>({...s, endTime: e.target.value}))} />
                        </Stack>
                        <Stack direction={{xs:'column', md:'row'}} spacing={2}>
                            <TextField label="Min spending" type="number" value={form.minSpending} onChange={(e)=>setForm(s=>({...s, minSpending: e.target.value}))} />
                            <TextField label="Rate (multiplier)" type="number" value={form.rate} onChange={(e)=>setForm(s=>({...s, rate: e.target.value}))} />
                            <TextField label="Points (flat)" type="number" value={form.points} onChange={(e)=>setForm(s=>({...s, points: e.target.value}))} />
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setFormOpen(false); setEditingId(null); }} disabled={formLoading}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={formLoading}>{formLoading ? 'Saving...' : (editingId ? 'Update' : 'Create')}</Button>
                </DialogActions>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={!!viewPromo} onClose={()=>setViewPromo(null)} fullWidth maxWidth="md">
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
                    {viewPromo?.name}
                </DialogTitle>
                <DialogContent>
                    {viewPromo && (
                        <Stack spacing={3} sx={{mt: 2}}>
                            <Stack direction="row" spacing={2} flexWrap="wrap">
                                <Chip
                                    label={viewPromo.type || 'automatic'}
                                    sx={{textTransform: 'capitalize'}}
                                />
                                <Chip
                                    label={isActive(viewPromo) ? 'Active' : 'Expired'}
                                    color={isActive(viewPromo) ? 'success' : 'default'}
                                />
                                <Chip
                                    icon={<LocalOfferOutlined />}
                                    label={viewPromo.rate ?
                                        `${viewPromo.rate}x Multiplier` :
                                        viewPromo.points ? `${viewPromo.points} Points` : 'No Value'
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
                                        Minimum Spending Required
                                    </Typography>
                                    <Typography variant="body1" fontWeight={600}>
                                        ${viewPromo.minSpending}
                                    </Typography>
                                </div>
                            )}

                            <div>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Valid Period
                                </Typography>
                                <Stack spacing={1}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <AccessTime fontSize="small" />
                                        <Typography variant="body1">
                                            <strong>Start:</strong> {viewPromo.startTime ? new Date(viewPromo.startTime).toLocaleString() : 'Immediately'}
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <AccessTime fontSize="small" />
                                        <Typography variant="body1">
                                            <strong>End:</strong> {viewPromo.endTime ? new Date(viewPromo.endTime).toLocaleString() : 'No End Date'}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </div>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{p: 3}}>
                    <Button onClick={()=>setViewPromo(null)} variant="outlined">
                        Close
                    </Button>
                    <Button
                        onClick={() => {
                            openEdit(viewPromo);
                            setViewPromo(null);
                        }}
                        variant="contained"
                        startIcon={<Edit />}
                    >
                        Edit Promotion
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog open={confirmOpen} title="Delete promotion" description="Are you sure you want to delete this promotion?" onCancel={() => setConfirmOpen(false)} onConfirm={confirmDelete} confirmText="Delete" />
        </PageShell>
    );
};

export default ManagerPromotions;
