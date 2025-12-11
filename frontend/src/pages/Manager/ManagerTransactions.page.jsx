import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell from '../../components/PageShell.comp';
import { TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, Chip, Stack, Pagination, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, MenuItem, Typography } from '@mui/material';
import transactionService from '../../services/transaction.service';
import { useNotification } from '../../context/notification';

const ManagerTransactions = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [transactions, setTransactions] = useState([]);

    // Initialize from URL params
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [type, setType] = useState(searchParams.get('type') || 'all');
    const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [detail, setDetail] = useState(null);
    const [open, setOpen] = useState(false);
    const [adjOpen, setAdjOpen] = useState(false);
    const [adjUtorid, setAdjUtorid] = useState('');
    const [adjRelatedId, setAdjRelatedId] = useState('');
    const [adjAmount, setAdjAmount] = useState('');
    const [adjRemark, setAdjRemark] = useState('');
    const [adjLoading, setAdjLoading] = useState(false);
    const { showMessage } = useNotification();

    // Update URL when filters change
    useEffect(() => {
        const params = {};
        if (search) params.search = search;
        if (type && type !== 'all') params.type = type;
        if (page > 1) params.page = page.toString();

        setSearchParams(params, { replace: true });
    }, [search, type, page, setSearchParams]);

    const load = async () => {
        setLoading(true);
        try {
            const params = { name: search || undefined, type: type === 'all' ? undefined : type, page, limit };
            const resp = await transactionService.getTransactions(params.name, undefined, undefined, undefined, params.type, undefined, undefined, undefined, page, limit);
            let list = [];
            if (Array.isArray(resp)) list = resp;
            else if (Array.isArray(resp.results)) list = resp.results;
            else if (Array.isArray(resp.data)) list = resp.data;
            const total = resp?.count ?? resp?.total ?? list.length;
            setTransactions(list);
            setTotalPages(Math.max(1, Math.ceil((total || list.length) / limit)));
        } catch (err) {
            console.error(err);
            showMessage('Failed to load transactions', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [page, limit]);

    const handleView = async (id) => {
        try {
            const tx = await transactionService.getTransaction(id);
            setDetail(tx);
            setOpen(true);
        } catch (err) {
            console.error(err);
            showMessage('Failed to load transaction', 'error');
        }
    };

    const handleToggleFlag = async (tx) => {
        try {
            await transactionService.setTransactionSuspicious(tx.id, !tx.suspicious);
            showMessage('Updated suspicious flag', 'success');
            setTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, suspicious: !t.suspicious } : t));
        } catch (err) {
            console.error(err);
            showMessage('Failed to update transaction: ' + (err?.message || err?.toString()), 'error');
        }
    };

    const handleCreateAdjustment = async () => {
        if (!adjUtorid || !adjRelatedId || !adjAmount) return showMessage('Please provide UTORid, related transaction id and amount', 'warning');
        setAdjLoading(true);
        try {
            await transactionService.createTransaction(adjUtorid.trim(), 'adjustment', undefined, Number(adjAmount), Number(adjRelatedId), adjRemark || '', []);
            showMessage('Adjustment created', 'success');
            setAdjOpen(false);
            setAdjUtorid(''); setAdjRelatedId(''); setAdjAmount(''); setAdjRemark('');
            await load();
        } catch (err) {
            console.error(err);
            showMessage('Failed to create adjustment: ' + (err?.response?.data?.error || err?.message || ''), 'error');
        } finally { setAdjLoading(false); }
    };

    return (
        <PageShell title="All transactions" subtitle="Monitor and adjust every transaction.">
            <div className="section-card section-card--glow" style={{marginBottom:24}}>
                <Stack direction={{xs:'column', md:'row'}} spacing={2} alignItems={{xs:'stretch', md:'center'}}>
                    <TextField label="Search" placeholder="UTORid" fullWidth value={search} onChange={e=>setSearch(e.target.value)} />
                    <TextField select label="Type" value={type} onChange={e=>setType(e.target.value)} sx={{minWidth:160}}>
                        <MenuItem value="all">Any</MenuItem>
                        <MenuItem value="purchase">Purchase</MenuItem>
                        <MenuItem value="transfer">Transfer</MenuItem>
                        <MenuItem value="redemption">Redemption</MenuItem>
                        <MenuItem value="adjustment">Adjustment</MenuItem>
                    </TextField>
                    <Button variant="contained" onClick={() => { setPage(1); load(); }}>Filter</Button>
                    <Button variant="contained" color="success" onClick={() => setAdjOpen(true)} sx={{minWidth:180}}>
                        Create Adjustment
                    </Button>
                </Stack>
            </div>

            <div className="section-card">
                {loading ? <div style={{padding:24, textAlign:'center'}}><CircularProgress /></div> : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Customer</TableCell>
                                <TableCell>Flags</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell>{tx.id}</TableCell>
                                    <TableCell>{tx.type}</TableCell>
                                    <TableCell>{tx.amount}</TableCell>
                                    <TableCell>{tx.utorid}</TableCell>
                                    <TableCell>{tx.suspicious ? <Chip color="error" label="Suspicious" /> : '-'}</TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <Button size="small" onClick={() => handleView(tx.id)}>View</Button>
                                            <Button size="small" onClick={() => handleToggleFlag(tx)}>{tx.suspicious ? 'Unmark' : 'Flag'}</Button>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                <div style={{display:'flex', justifyContent:'center', padding:12}}>
                    <Pagination count={totalPages} page={page} onChange={(e,v)=>setPage(v)} />
                </div>
            </div>

            <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Transaction detail</DialogTitle>
                <DialogContent>
                    {detail ? (
                        <div>
                            <Typography><strong>ID:</strong> {detail.id}</Typography>
                            <Typography><strong>Type:</strong> {detail.type}</Typography>
                            <Typography><strong>Amount:</strong> {detail.amount}</Typography>
                            <Typography><strong>Remark:</strong> {detail.remark}</Typography>
                        </div>
                    ) : <CircularProgress />}
                </DialogContent>
                <DialogActions>
                    <Button onClick={()=>setOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Adjustment dialog */}
            <Dialog open={adjOpen} onClose={()=>setAdjOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Create adjustment</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{mt:1}}>
                        <TextField label="Customer UTORid" value={adjUtorid} onChange={e=>setAdjUtorid(e.target.value)} fullWidth />
                        <TextField label="Related transaction id" value={adjRelatedId} onChange={e=>setAdjRelatedId(e.target.value)} fullWidth />
                        <TextField label="Amount (points)" type="number" value={adjAmount} onChange={e=>setAdjAmount(e.target.value)} fullWidth />
                        <TextField label="Remark" value={adjRemark} onChange={e=>setAdjRemark(e.target.value)} fullWidth />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={()=>setAdjOpen(false)} disabled={adjLoading}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateAdjustment} disabled={adjLoading}>{adjLoading ? 'Creating...' : 'Create'}</Button>
                </DialogActions>
            </Dialog>
        </PageShell>
    );
};

export default ManagerTransactions;
