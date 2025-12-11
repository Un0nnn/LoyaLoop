import React, { useState, useEffect } from 'react';
import PageShell from '../../components/PageShell.comp';
import { Typography, Button, Avatar, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Card, CardContent, Divider, Box, Grid, Chip, InputAdornment } from '@mui/material';
import { useAuth } from '../../context/auth';
import { Link, useNavigate } from 'react-router-dom';
import userService from '../../services/user.service';
import { useNotification } from '../../context/notification';
import { Edit, Lock, Logout, Person, Email, Cake, Badge, Shield, CameraAlt, Verified, Delete } from '@mui/icons-material';

const Profile = () => {
    const { currentUser, logout, setCurrentUser } = useAuth();
    const { showMessage } = useNotification();
    const navigate = useNavigate();

    const [editOpen, setEditOpen] = useState(false);
    const [name, setName] = useState(currentUser?.name || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [birthday, setBirthday] = useState(currentUser?.birthday ? (new Date(currentUser.birthday)).toISOString().split('T')[0] : '');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar || currentUser?.avatarUrl || '');
    const [saving, setSaving] = useState(false);
    const [pwdDialogOpen, setPwdDialogOpen] = useState(false);
    const [oldPwd, setOldPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [pwdLoading, setPwdLoading] = useState(false);

    useEffect(() => {
        setName(currentUser?.name || '');
        setEmail(currentUser?.email || '');
        setBirthday(currentUser?.birthday ? (new Date(currentUser.birthday)).toISOString().split('T')[0] : '');
        setAvatarPreview(currentUser?.avatar || currentUser?.avatarUrl || '');
    }, [currentUser]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const openEdit = () => setEditOpen(true);
    const closeEdit = () => {
        setEditOpen(false);
        // reset temporary state
        setAvatarFile(null);
        setAvatarPreview(currentUser?.avatar || currentUser?.avatarUrl || '');
    };

    const handleAvatarChange = (e) => {
        const f = e.target.files && e.target.files[0];
        if (f) {
            setAvatarFile(f);
            try {
                const url = URL.createObjectURL(f);
                setAvatarPreview(url);
            } catch (err) {
                setAvatarPreview('');
            }
        }
    };

    const handleSave = async () => {
        // basic validation
        if (!name || name.trim().length === 0) return showMessage('Name is required', 'warning');
        setSaving(true);
        try {
            const resp = await userService.updateMe(name, email || undefined, birthday || undefined, avatarFile);
            // userService.updateMe returns updated user object
            // Update auth context with new values
            setCurrentUser(resp);
            showMessage('Profile updated', 'success');
            setEditOpen(false);
            setAvatarFile(null);
        } catch (err) {
            console.error('Failed to update profile', err);
            const msg = err?.response?.data?.error || err?.message || 'Failed to update profile';
            showMessage(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!oldPwd || !newPwd) return showMessage('Please enter both old and new password', 'warning');
        setPwdLoading(true);
        try {
            await userService.updateMePassword(oldPwd, newPwd);
            showMessage('Password updated', 'success');
            setPwdDialogOpen(false);
            setOldPwd(''); setNewPwd('');
        } catch (err) {
            console.error('Failed to change password', err);
            const msg = err?.response?.data?.error || err?.message || 'Failed to change password';
            showMessage(msg, 'error');
        } finally { setPwdLoading(false); }
    };

    if (!currentUser) {
        return (
            <PageShell title="Profile" subtitle="Sign in to manage your profile.">
                <div className="section-card" style={{ textAlign: 'center', padding: 64 }}>
                    <Person sx={{ fontSize: 64, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>Not Signed In</Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Please sign in to view and edit your profile.
                    </Typography>
                    <Button component={Link} to="/login" variant="contained" size="large">
                        Go to Login
                    </Button>
                </div>
            </PageShell>
        );
    }

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'superuser': return 'error';
            case 'manager': return 'warning';
            case 'organizer': return 'info';
            case 'cashier': return 'success';
            default: return 'default';
        }
    };

    return (
        <PageShell title="My Profile" subtitle="Manage your account information and preferences">
            <Grid container spacing={4}>
                {/* Left Column - Profile Card */}
                <Grid item xs={12} md={4}>
                    <Card className="section-card section-card--glow">
                        <CardContent sx={{ p: 4, textAlign: 'center' }}>
                            <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                                <Avatar
                                    sx={{
                                        width: 120,
                                        height: 120,
                                        border: '4px solid rgba(124, 58, 237, 0.2)',
                                        fontSize: '3rem',
                                        background: 'linear-gradient(135deg, #7C3AED, #5B21B6)'
                                    }}
                                    src={avatarPreview}
                                >
                                    {(currentUser?.name || 'U')[0].toUpperCase()}
                                </Avatar>
                                {currentUser?.verified && (
                                    <Chip
                                        icon={<Verified />}
                                        label="Verified"
                                        color="success"
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: -10,
                                            fontSize: '0.7rem'
                                        }}
                                    />
                                )}
                            </Box>

                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                                {currentUser?.name || 'Guest User'}
                            </Typography>

                            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                                <Chip
                                    icon={<Badge />}
                                    label={currentUser?.utorid}
                                    size="small"
                                    variant="outlined"
                                />
                            </Stack>

                            <Chip
                                icon={<Shield />}
                                label={currentUser?.role || 'user'}
                                color={getRoleBadgeColor(currentUser?.role)}
                                sx={{
                                    textTransform: 'capitalize',
                                    fontWeight: 600,
                                    mb: 3
                                }}
                            />

                            <Divider sx={{ my: 3 }} />

                            <Stack spacing={2}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<Edit />}
                                    onClick={openEdit}
                                    size="large"
                                >
                                    Edit Profile
                                </Button>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<Lock />}
                                    onClick={() => setPwdDialogOpen(true)}
                                    size="large"
                                >
                                    Change Password
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    fullWidth
                                    startIcon={<Logout />}
                                    onClick={handleLogout}
                                    size="large"
                                >
                                    Logout
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Column - Profile Details */}
                <Grid item xs={12} md={8}>
                    <div className="section-card">
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                            <Person /> Personal Information
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        <Stack spacing={3}>
                            {/* Name */}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Person fontSize="small" /> Full Name
                                </Typography>
                                <Typography variant="body1" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
                                    {currentUser?.name || 'Not set'}
                                </Typography>
                            </Box>

                            {/* Email */}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Email fontSize="small" /> Email Address
                                </Typography>
                                <Typography variant="body1" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
                                    {currentUser?.email || 'Not set'}
                                </Typography>
                            </Box>

                            {/* Birthday */}
                            {currentUser?.birthday && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Cake fontSize="small" /> Birthday
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
                                        {new Date(currentUser.birthday).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </Typography>
                                </Box>
                            )}

                            {/* UTORid */}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Badge fontSize="small" /> UTORid
                                </Typography>
                                <Typography variant="body1" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
                                    {currentUser?.utorid}
                                </Typography>
                            </Box>

                            {/* Role */}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Shield fontSize="small" /> Account Role
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Chip
                                        label={currentUser?.role || 'user'}
                                        color={getRoleBadgeColor(currentUser?.role)}
                                        sx={{ textTransform: 'capitalize' }}
                                    />
                                    {currentUser?.verified && (
                                        <Chip
                                            icon={<Verified />}
                                            label="Verified Account"
                                            color="success"
                                            variant="outlined"
                                            size="small"
                                        />
                                    )}
                                </Stack>
                            </Box>

                            {/* Account Status */}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Account Status
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    <Chip
                                        label="Active"
                                        color="success"
                                        size="small"
                                    />
                                    {currentUser?.suspicious && (
                                        <Chip
                                            label="Flagged for Review"
                                            color="warning"
                                            size="small"
                                        />
                                    )}
                                </Stack>
                            </Box>
                        </Stack>
                    </div>
                </Grid>
            </Grid>

            {/* Edit Profile Dialog */}
            <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="md">
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem', pb: 1 }}>
                    Edit Profile
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Stack spacing={3}>
                        {/* Avatar Section */}
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Profile Picture
                            </Typography>
                            <Box sx={{ position: 'relative', display: 'inline-block', mt: 2 }}>
                                <Avatar
                                    src={avatarPreview}
                                    sx={{
                                        width: 100,
                                        height: 100,
                                        border: '3px solid rgba(124, 58, 237, 0.3)',
                                        fontSize: '2.5rem'
                                    }}
                                >
                                    {(name || currentUser?.name || 'U')[0].toUpperCase()}
                                </Avatar>
                                <input
                                    accept="image/*"
                                    id="avatar-file-input"
                                    type="file"
                                    style={{ display: 'none' }}
                                    onChange={handleAvatarChange}
                                />
                            </Box>
                            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                                <label htmlFor="avatar-file-input">
                                    <Button
                                        variant="outlined"
                                        component="span"
                                        startIcon={<CameraAlt />}
                                    >
                                        Choose Photo
                                    </Button>
                                </label>
                                {avatarPreview && (
                                    <Button
                                        variant="text"
                                        color="error"
                                        startIcon={<Delete />}
                                        onClick={() => {
                                            setAvatarFile(null);
                                            setAvatarPreview('');
                                        }}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </Stack>
                        </Box>

                        <Divider />

                        {/* Form Fields */}
                        <TextField
                            label="Full Name"
                            fullWidth
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Person />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            label="Email Address (UofT)"
                            fullWidth
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            helperText="Your University of Toronto email address"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Email />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            label="Birthday"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={birthday}
                            onChange={(e) => setBirthday(e.target.value)}
                            helperText="Optional - used for special birthday rewards"
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Cake />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={closeEdit} disabled={saving} size="large" variant="outlined">
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving}
                        size="large"
                    >
                        {saving ? 'Saving Changes...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Change Password Dialog */}
            <Dialog open={pwdDialogOpen} onClose={() => setPwdDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem', pb: 1 }}>
                    Change Password
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Stack spacing={3}>
                        <Typography variant="body2" color="text.secondary">
                            Enter your current password and choose a new secure password.
                        </Typography>

                        <TextField
                            label="Current Password"
                            type="password"
                            value={oldPwd}
                            onChange={e => setOldPwd(e.target.value)}
                            fullWidth
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            label="New Password"
                            type="password"
                            value={newPwd}
                            onChange={e => setNewPwd(e.target.value)}
                            fullWidth
                            required
                            helperText="Choose a strong password with at least 8 characters"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button
                        onClick={() => setPwdDialogOpen(false)}
                        disabled={pwdLoading}
                        size="large"
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleChangePassword}
                        disabled={pwdLoading}
                        size="large"
                    >
                        {pwdLoading ? 'Updating...' : 'Change Password'}
                    </Button>
                </DialogActions>
            </Dialog>
        </PageShell>
    );
};

export default Profile;
