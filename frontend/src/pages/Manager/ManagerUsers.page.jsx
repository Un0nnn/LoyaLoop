import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell from '../../components/PageShell.comp';
import {
    Typography,
    TextField,
    Button,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Chip,
    Stack,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Pagination,
    CircularProgress,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Container
} from '@mui/material';
import userService from '../../services/user.service';
import authService from '../../services/auth.service';
import { clearCache } from '../../services/api';
import { useNotification } from '../../context/notification';
import { ArrowUpward, ArrowDownward, Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../../context/auth';
import ConfirmDialog from '../../components/ConfirmDialog.comp';

const ManagerUsers = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [users, setUsers] = useState([]);
    const [loadingList, setLoadingList] = useState(false);

    // Initialize state from URL params
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [role, setRole] = useState(searchParams.get('role') || '');
    const [status, setStatus] = useState(searchParams.get('status') || '');

    const [loadingId, setLoadingId] = useState(null);
    const { showMessage } = useNotification();
    const { token } = useAuth();

    // Add user form state
    const [showAdd, setShowAdd] = useState(false);
    const [addUtorid, setAddUtorid] = useState('');
    const [addName, setAddName] = useState('');
    const [addEmail, setAddEmail] = useState('');
    const [addRole, setAddRole] = useState('regular');
    const [addLoading, setAddLoading] = useState(false);
    const [addPassword, setAddPassword] = useState('');
    const [addPasswordError, setAddPasswordError] = useState('');
    const [createdResetToken, setCreatedResetToken] = useState(null);
    const [tokenDialogOpen, setTokenDialogOpen] = useState(false);

    // pagination & sorting - initialize from URL
    const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
    const [limit, setLimit] = useState(parseInt(searchParams.get('limit')) || 10);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'name');
    const [sortDir, setSortDir] = useState(searchParams.get('sortDir') || 'asc');

    // Confirm dialog state
    const [confirmingUser, setConfirmingUser] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    // Update URL when filters change
    useEffect(() => {
        const params = {};
        if (search) params.search = search;
        if (role) params.role = role;
        if (status) params.status = status;
        if (page > 1) params.page = page.toString();
        if (limit !== 10) params.limit = limit.toString();
        if (sortBy !== 'name') params.sortBy = sortBy;
        if (sortDir !== 'asc') params.sortDir = sortDir;

        setSearchParams(params, { replace: true });
    }, [search, role, status, page, limit, sortBy, sortDir, setSearchParams]);

    const buildQuery = () => {
        const q = {
            page,
            limit,
        };
        if (role) q.role = role;
        if (status) q.verified = status === 'verified' ? true : status === 'pending' ? false : undefined;
        if (search) q.name = search;
        if (sortBy) q.sort = `${sortDir === 'asc' ? '' : '-'}${sortBy}`;
        return q;
    };

    const fetchUsers = async () => {
        setLoadingList(true);
        // If there's no backend token available, we cannot load server-side users.
        // This usually happens when using demo login. Prompt user to sign in for backend operations.
        const sessionToken = typeof window !== 'undefined' ? sessionStorage.getItem('authToken') : null;
        if (!token && !sessionToken) {
            setUsers([]);
            setLoadingList(false);
            showMessage('Not authenticated with backend; please sign in to load users', 'warning');
            return;
        }
        try {
            const q = buildQuery();
            const resp = await userService.getUsers(q.role, q.verified, undefined, q.name, q.page, q.limit);

            // Backend returns { results: [...], count } or { data: [...] } or an array
            let list;
            if (Array.isArray(resp)) list = resp;
            else if (Array.isArray(resp.results)) list = resp.results;
            else if (Array.isArray(resp.data)) list = resp.data;
            else if (Array.isArray(resp?.data?.results)) list = resp.data.results;
            else if (Array.isArray(resp?.users)) list = resp.users;
            else list = [];

            const total = resp?.count || resp?.total || resp?.meta?.total || 0;
            // use returned list directly (server-side deletions are authoritative)
            const visible = list;
            setUsers(visible);
            // If we have a recently-created user id from this session, ensure it's present in the list
            try {
                const recent = sessionStorage.getItem('recentUserId');
                if (recent) {
                    const present = visible.find(u => String(u.id) === String(recent));
                    if (!present) {
                        // try to fetch it directly and prepend
                        try {
                            const fresh = await userService.getUser(Number(recent));
                            if (fresh) {
                                setUsers(prev => {
                                    const without = (prev || []).filter(u => String(u.id) !== String(fresh.id) && u.utorid !== fresh.utorid);
                                    return [fresh, ...without];
                                });
                            }
                        } catch (e) {
                            // ignore fetch error
                        }
                    }
                    sessionStorage.removeItem('recentUserId');
                }
            } catch (e) { /* ignore storage errors */ }
            setTotalPages(Math.max(1, Math.ceil((total || list.length) / limit)));
        } catch (err) {
            console.error(err);
            showMessage('Failed to load users', 'error');
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, sortBy, sortDir]);

    const handleVerify = async (user) => {
        setLoadingId(user.id);
        try {
            await userService.updateUser(user.id, undefined, true, undefined, undefined);
            showMessage(`${user.name} verified`, 'success');
            setUsers(users.map(u => u.id === user.id ? { ...u, verified: true } : u));
        } catch (err) {
            console.error(err);
            showMessage('Failed to verify: ' + (err?.message || err?.toString()), 'error');
        } finally {
            setLoadingId(null);
        }
    };


    const handlePromote = async (user) => {
        setLoadingId(user.id);
        try {
            const roleHierarchy = { regular: 'cashier', cashier: 'manager' };
            const newRole = roleHierarchy[user.role] || user.role;
            if (newRole === user.role) {
                showMessage('User is already at maximum promotable role', 'info');
                setLoadingId(null);
                return;
            }
            await userService.updateUser(user.id, undefined, undefined, undefined, newRole);
            showMessage(`${user.name} promoted to ${newRole}`, 'success');
            setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error(err);
            showMessage('Failed to promote: ' + (err?.message || err?.toString()), 'error');
        } finally {
            setLoadingId(null);
        }
    };

    const handleUnpromote = async (user) => {
        setLoadingId(user.id);
        try {
            const roleHierarchy = { manager: 'cashier', cashier: 'regular' };
            const newRole = roleHierarchy[user.role] || user.role;
            if (newRole === user.role) {
                showMessage('User is already at lowest role', 'info');
                setLoadingId(null);
                return;
            }
            await userService.updateUser(user.id, undefined, undefined, undefined, newRole);
            showMessage(`${user.name} demoted to ${newRole}`, 'success');
            setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error(err);
            showMessage('Failed to demote: ' + (err?.message || err?.toString()), 'error');
        } finally {
            setLoadingId(null);
        }
    };

    const handleToggleSuspicious = async (user) => {
        setLoadingId(user.id);
        try {
            const newSuspicious = !user.suspicious;
            await userService.updateUser(user.id, undefined, undefined, newSuspicious, undefined);
            showMessage(`${user.name} marked as ${newSuspicious ? 'suspicious' : 'not suspicious'}`, 'success');
            setUsers(users.map(u => u.id === user.id ? { ...u, suspicious: newSuspicious } : u));
        } catch (err) {
            console.error(err);
            showMessage('Failed to update suspicious status: ' + (err?.message || err?.toString()), 'error');
        } finally {
            setLoadingId(null);
        }
    };

    // Delete (permanently) a user on the server and update UI

    const handleDelete = async () => {
        if (!confirmingUser) return;
        setConfirmLoading(true);
        try {
            const sessionToken = typeof window !== 'undefined' ? sessionStorage.getItem('authToken') : null;
            await userService.deleteUser(confirmingUser.id, sessionToken);
            setUsers(prev => prev.filter(u => u.id !== confirmingUser.id));
            showMessage('User deleted', 'success');
        } catch (err) {
            console.error(err);
            showMessage('Failed to delete user', 'error');
        } finally {
            setConfirmLoading(false);
            setConfirmingUser(null);
        }
    };

    const clearFilters = () => { setSearch(''); setRole(''); setStatus(''); setPage(1); };

    const sortIcon = useMemo(() => sortDir === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />, [sortDir]);

    const handleAddUser = async () => {
        setAddLoading(true);
        setAddPasswordError('');
        const sessionToken = typeof window !== 'undefined' ? sessionStorage.getItem('authToken') : null;
        if (!token && !sessionToken) {
            const msg = 'Not authenticated with backend; please sign in to create users.';
            setAddPasswordError(msg);
            showMessage(msg, 'error');
            setAddLoading(false);
            return;
        }
        try {
            // client-side password validation using exact backend regex
            if (addPassword) {
                // exact backend regex from authController.resetPasswordWithToken
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,20}$/;
                if (!passwordRegex.test(addPassword)) {
                    const msg = 'User password does not meet requirements';
                    setAddPasswordError(msg);
                    showMessage(msg, 'error');
                    setAddLoading(false);
                    return;
                }
            }

            const created = await userService.createUser(addUtorid.trim(), addName.trim(), addEmail.trim());
            showMessage(`User ${created?.utorid || addUtorid} created`, 'success');

            // Invalidate GET cache so subsequent fetchUsers calls get fresh data
            try { clearCache(); } catch (e) { /* ignore */ }

            // If a password was provided, use the returned resetToken to set it immediately
            if (addPassword && created?.resetToken) {
                try {
                    await authService.resetWithToken(created.resetToken, addUtorid.trim(), addPassword);
                    showMessage('User created — password set', 'success');
                } catch (err) {
                    console.error('Failed to set password via reset token', err);
                    // If backend rejects the password despite client-side validation, roll back user creation to avoid
                    // leaving an account without the intended password.
                    const serverMsg = err?.response?.data?.error || err?.message || '';
                    if (err?.response?.status === 400 || /password/i.test(serverMsg)) {
                        // Attempt to delete the partially-created user
                        try {
                            await userService.deleteUser(created.id);
                            showMessage('Password rejected by server; user creation rolled back', 'error');
                        } catch (delErr) {
                            console.error('Failed to rollback user after password error', delErr);
                            showMessage('Password rejected by server; user created but rollback failed. Please delete manually.', 'error');
                        }
                        setAddLoading(false);
                        return;
                    }
                    // Other failures: show token dialog so admin can set password later
                    showMessage('User created; password was not set. Reset token provided below.', 'warning');
                    setCreatedResetToken(created.resetToken);
                    setTokenDialogOpen(true);
                }
            } else {
                // No password provided — user created and reset token is available for setting password
                if (created?.resetToken) {
                    showMessage('User created; password not set. Reset token provided below.', 'info');
                    setCreatedResetToken(created.resetToken);
                    setTokenDialogOpen(true);
                }
            }

            // If the creator chose a non-regular role, try to set it (manager checks apply on backend)
            if (addRole && addRole !== 'regular' && created?.id) {
                try {
                    await userService.updateUser(created.id, undefined, undefined, undefined, addRole);
                    // reflect role locally by re-fetching
                } catch (e) {
                    console.warn('Failed to set role on create:', e);
                    // notify but don't block
                    showMessage('User created but failed to set role: ' + (e?.response?.data?.error || e?.message || ''), 'warning');
                }
            }

            // reset form
            setAddUtorid(''); setAddName(''); setAddEmail(''); setAddRole('regular'); setAddPassword(''); setShowAdd(false);
            // persist the id to sessionStorage so it can be inserted after reload if needed
            try { if (created?.id) sessionStorage.setItem('recentUserId', String(created.id)); } catch (e) {}
            // Immediately refresh the list so the newly-created user appears according to current filters
            try { await fetchUsers(); } catch (e) { /* ignore */ }
         } catch (err) {
             console.error(err);
             showMessage('Failed to create user: ' + (err?.response?.data?.error || err?.message || err?.toString()), 'error');
         } finally {
             setAddLoading(false);
         }
     };

    const handleDismissTokenDialog = () => {
        setCreatedResetToken(null);
        setTokenDialogOpen(false);
    }

    // const visibleUsers = users;

    return (
        <Container>
        <PageShell title="User management" subtitle="Filter, review, and promote members.">
            {/* Create User Button - Independent Section */}
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowAdd(true)}
                    aria-label="Create user"
                    className="btn-create-user"
                    sx={{ textTransform: 'none', borderRadius: 2, px: 3, py: 1 }}
                >
                    Create user
                </Button>
            </div>

            {/* Filters Section */}
            <div className="section-card section-card--glow" style={{ marginBottom: 18 }}>
                <Stack className="compact-filters" direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="center">
                    <TextField size="small" label="Search" placeholder="Name or UTORid" fullWidth value={search} onChange={(e) => setSearch(e.target.value)} />

                    <FormControl sx={{ minWidth: 140 }} size="small">
                        <InputLabel>Role</InputLabel>
                        <Select variant="outlined" value={role} label="Role" onChange={(e) => setRole(e.target.value)}>
                            <MenuItem value="">Any</MenuItem>
                            <MenuItem value="regular">Regular</MenuItem>
                            <MenuItem value="cashier">Cashier</MenuItem>
                            <MenuItem value="manager">Manager</MenuItem>
                            <MenuItem value="superuser">Superuser</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 140 }} size="small">
                        <InputLabel>Status</InputLabel>
                        <Select variant="outlined" value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
                            <MenuItem value="">Any</MenuItem>
                            <MenuItem value="verified">Verified</MenuItem>
                            <MenuItem value="pending">Pending</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 140 }} size="small">
                        <InputLabel>Sort</InputLabel>
                        <Select variant="outlined" value={sortBy} label="Sort" onChange={(e) => setSortBy(e.target.value)}>
                            <MenuItem value="name">Name</MenuItem>
                            <MenuItem value="utorid">UTORid</MenuItem>
                            <MenuItem value="role">Role</MenuItem>
                        </Select>
                    </FormControl>

                    <Button size="small" variant="contained" onClick={() => { setPage(1); fetchUsers(); }} sx={{ px: 2 }}>Apply</Button>
                    <Button size="small" variant="outlined" onClick={clearFilters} sx={{ px: 2 }}>Clear</Button>
                 </Stack>

                {/* Add User Dialog - compact UI to reduce clutter */}
                <Dialog open={showAdd} onClose={() => setShowAdd(false)} fullWidth maxWidth="sm">
                    <DialogTitle>Add user</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField label="UTORid" size="small" value={addUtorid} onChange={(e) => setAddUtorid(e.target.value)} fullWidth />
                            <TextField label="Name" size="small" value={addName} onChange={(e) => setAddName(e.target.value)} fullWidth />
                            <TextField label="Email" size="small" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} fullWidth />
                            <TextField label="Password (optional)" size="small" value={addPassword} onChange={(e) => { setAddPassword(e.target.value); setAddPasswordError(''); }} fullWidth error={!!addPasswordError} helperText={addPasswordError || 'If provided, will be set immediately using backend reset token'} />
                            <FormControl size="small" fullWidth>
                                <InputLabel>Role</InputLabel>
                                <Select variant="outlined" value={addRole} label="Role" onChange={(e) => setAddRole(e.target.value)}>
                                    <MenuItem value="regular">Regular</MenuItem>
                                    <MenuItem value="cashier">Cashier</MenuItem>
                                    <MenuItem value="manager">Manager</MenuItem>
                                    <MenuItem value="superuser">Superuser</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button size="small" onClick={() => setShowAdd(false)} disabled={addLoading}>Cancel</Button>
                        <Button size="small" variant="contained" onClick={handleAddUser} disabled={addLoading || !addUtorid || !addName || !addEmail}>{addLoading ? 'Creating...' : 'Create'}</Button>
                    </DialogActions>
                </Dialog>

                {/* Token dialog shown after user creation when backend returns reset token */}
                <Dialog open={tokenDialogOpen} onClose={handleDismissTokenDialog} fullWidth maxWidth="xs">
                    <DialogTitle>User created</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" sx={{mt:1}}>The user account was created. The password was not set — use the reset token below to set a password for the user (copy & share, or set it yourself with the reset page).</Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{mt:2}}>
                            <TextField value={createdResetToken || ''} fullWidth disabled />
                            <Button onClick={() => { navigator.clipboard.writeText(createdResetToken || ''); showMessage('Copied token'); }}>Copy</Button>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleDismissTokenDialog}>Close</Button>
                    </DialogActions>
                </Dialog>

            </div>

            <div className="section-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Typography variant="h6">Users</Typography>
                        <Typography variant="caption" color="text.secondary">{loadingList ? 'Loading...' : `${users.length} shown`}</Typography>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                            <Select variant="outlined" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
                                <MenuItem value={5}>5</MenuItem>
                                <MenuItem value={10}>10</MenuItem>
                                <MenuItem value={25}>25</MenuItem>
                            </Select>
                        </FormControl>
                    </div>
                </div>

                <div className="table-container">
                    {loadingList ? (
                        <div style={{ padding: 36, display: 'flex', justifyContent: 'center' }}><CircularProgress /></div>
                    ) : (
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell onClick={() => setSortDir(s => s === 'asc' ? 'desc' : 'asc')} style={{ cursor: 'pointer' }}>
                                        User {sortBy === 'name' && <IconButton size="small">{sortIcon}</IconButton>}
                                    </TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>UTORid</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users && users.map(u => (
                                    <TableRow key={u.id}>
                                        <TableCell>
                                            <Stack spacing={0.4}>
                                                <Typography fontWeight={700}>{u.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{u.email || u.utorid}</Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell><Chip label={u.role} size="small" /></TableCell>
                                        <TableCell>
                                            {u.suspicious ? (
                                                <Chip label="Suspicious" color="error" size="small" />
                                            ) : (u.verified ? <Chip label="Verified" color="success" size="small" /> : <Chip label="Pending" size="small" />)}
                                        </TableCell>
                                        <TableCell>{u.utorid}</TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="wrap">
                                                {/* Verify - only show button if not verified */}
                                                {!u.verified && !u.suspicious && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        onClick={() => handleVerify(u)}
                                                        disabled={loadingId === u.id || loadingList}
                                                        sx={{ textTransform: 'none', minWidth: 70, fontSize: '0.75rem' }}
                                                    >
                                                        {loadingId === u.id ? '...' : 'Verify'}
                                                    </Button>
                                                )}

                                                {/* Promote/Unpromote */}
                                                {u.role !== 'regular' && u.role !== 'superuser' && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="warning"
                                                        onClick={() => handleUnpromote(u)}
                                                        disabled={loadingId === u.id || loadingList || u.suspicious}
                                                        sx={{ textTransform: 'none', minWidth: 70, fontSize: '0.75rem' }}
                                                    >
                                                        Demote
                                                    </Button>
                                                )}
                                                {u.role !== 'manager' && u.role !== 'superuser' && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        onClick={() => handlePromote(u)}
                                                        disabled={loadingId === u.id || loadingList || u.suspicious}
                                                        sx={{ textTransform: 'none', minWidth: 70, fontSize: '0.75rem' }}
                                                    >
                                                        Promote
                                                    </Button>
                                                )}

                                                {/* Suspicious/Not Suspicious */}
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color={u.suspicious ? "success" : "warning"}
                                                    onClick={() => handleToggleSuspicious(u)}
                                                    disabled={loadingId === u.id || loadingList}
                                                    sx={{ textTransform: 'none', minWidth: 90, fontSize: '0.75rem' }}
                                                >
                                                    {u.suspicious ? 'Mark Safe' : 'Suspicious'}
                                                </Button>

                                                {/* Delete */}
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="error"
                                                    onClick={() => setConfirmingUser(u)}
                                                    sx={{ textTransform: 'none', minWidth: 60, fontSize: '0.75rem' }}
                                                >
                                                    Delete
                                                </Button>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     )}
                 </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                    <div>
                        <Typography variant="caption" color="text.secondary">Page {page} of {totalPages}</Typography>
                    </div>
                    <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} color="primary" />
                </div>
            </div>

            <ConfirmDialog
                open={Boolean(confirmingUser)}
                title="Delete user"
                message={confirmingUser ? `Delete ${confirmingUser.name}? This will permanently remove the user from the system.` : ''}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDelete}
                onCancel={() => setConfirmingUser(null)}
                loading={confirmLoading}
            />
        </PageShell>
        </Container>
    );
};

export default ManagerUsers;
