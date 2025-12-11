import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Alert,
    Paper,
    CircularProgress,
    InputAdornment,
    IconButton,
    FormControlLabel,
    Checkbox
} from "@mui/material";

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import QrCode2Outlined from '@mui/icons-material/QrCode2Outlined';

import { useAuth } from "../../context/auth";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const { login, currentUser } = useAuth();
    const navigate = useNavigate();
    const [utorid, setUtorid] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);

    useEffect(() => {
        if (currentUser) navigate('/home');
    }, [currentUser, navigate]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Frontend validation
        if (!utorid || !utorid.trim()) {
            setError("Please enter your username");
            setLoading(false);
            return;
        }

        if (!password || !password.trim()) {
            setError("Please enter your password");
            setLoading(false);
            return;
        }

        if (utorid.trim().length < 3) {
            setError("Username must be at least 3 characters");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        try {
            await login(utorid.trim(), password);
            // Success - user will be redirected by useEffect
        } catch (err) {
            console.error('Login error:', err);

            // Handle different types of errors
            const errorResponse = err?.response?.data?.error;
            const errorMessage = err?.message;
            const statusCode = err?.response?.status;

            if (statusCode === 401) {
                setError("Invalid username or password. Please try again.");
            } else if (statusCode === 400) {
                setError(errorResponse || "Invalid login credentials. Please check your input.");
            } else if (statusCode === 403) {
                setError("Access denied. Your account may be suspended. Please contact support.");
            } else if (statusCode === 429) {
                setError("Too many login attempts. Please try again later.");
            } else if (statusCode === 500) {
                setError("Server error. Please try again in a few moments.");
            } else if (statusCode === 503) {
                setError("Service temporarily unavailable. Please try again later.");
            } else if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
                setError("Connection timeout. Please check your internet connection and try again.");
            } else if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')) {
                setError("Network error. Please check your internet connection.");
            } else if (errorResponse) {
                // Use server error message if available
                setError(errorResponse);
            } else if (errorMessage) {
                setError(errorMessage);
            } else {
                setError("Login failed. Please check your credentials and try again.");
            }
        } finally {
            setLoading(false);
        }
    }

    const textFieldStyles = {
        '& .MuiInputLabel-root': { color: '#dbeafe', fontWeight: 500 },
        '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: 10,
            color: '#ffffff',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
            '&.Mui-focused fieldset': { borderColor: 'rgba(6,182,212,0.6)', boxShadow: '0 6px 20px rgba(2,132,199,0.06)' }
        },
        '& .MuiOutlinedInput-input': { color: '#ffffff', padding: '12px 12px' },
        '& .MuiInputBase-input': { color: '#ffffff' },
        '& .MuiInputLabel-root.Mui-focused': { color: '#ffffff' }
    };

    const toggleShowPassword = () => setShowPassword((s) => !s);

    return (
        <div className="auth-layout auth-layout--dark">
            <div className="auth-inner">
                <Paper
                    elevation={0}
                    className="auth-panel auth-panel--dark"
                    role="region"
                    aria-label="Login panel"
                    sx={{
                        background: 'linear-gradient(180deg, #020617, #020617)',
                        color: '#fff',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        px: 4,
                        py: 3,
                        width: { xs: '92%', sm: 460 },
                        boxShadow: '0 30px 60px rgba(2,6,23,0.6)'
                    }}
                >
                    <Box sx={{display:'flex', flexDirection:'column', alignItems:'center', gap:0.5, mb:1.5}}>
                        <Box sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 10px 22px rgba(124,58,237,0.35)',
                            marginBottom: '6px'
                        }}>
                            <QrCode2Outlined sx={{ color: '#fff', fontSize: 28 }} />
                        </Box>
                        <span className="auth-hero__badge">LoyaLoop</span>
                        <h3 className="auth-hero__title" style={{marginTop:6, marginBottom:6, fontSize:'1rem'}}>Manage points & rewards</h3>
                    </Box>

                    <Box component="form" onSubmit={handleSubmit} noValidate autoComplete="on" sx={{display:'flex', flexDirection:'column', gap:2}}>
                        <Typography variant="h6" fontWeight="600" color="#ffffff">Sign in</Typography>

                        <TextField
                            label="Username"
                            name="username"
                            autoComplete="username"
                            variant="outlined"
                            fullWidth
                            value={utorid}
                            onChange={(e) => setUtorid(e.target.value)}
                            onFocus={(e) => {
                                if (e && e.target) {
                                    // select contents so typing replaces the value
                                    try { e.target.select(); } catch (err) { }
                                }
                            }}
                            inputProps={{ 'aria-label': 'username' }}
                            sx={{ ...textFieldStyles, '& .MuiInputLabel-root': { fontSize: '0.95rem', color: 'rgba(230,238,248,0.9)' } }}
                            InputProps={{ sx: { borderRadius: 1 } }}
                        />

                        <TextField
                            label="Password"
                            name="current-password"
                            autoComplete="current-password"
                            type={showPassword ? 'text' : 'password'}
                            variant="outlined"
                            fullWidth
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={(e) => {
                                if (e && e.target) {
                                    try { e.target.select(); } catch (err) { }
                                }
                            }}
                            inputProps={{ 'aria-label': 'password' }}
                            InputProps={{
                                sx: { borderRadius: 1 },
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={toggleShowPassword} edge="end" sx={{color:'#cfefff'}}>
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            sx={{ ...textFieldStyles, '& .MuiInputLabel-root': { fontSize: '0.95rem', color: 'rgba(230,238,248,0.9)' } }}
                        />

                        <Box sx={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:2}}>
                            <FormControlLabel
                                 control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} sx={{color:'rgba(255,255,255,0.8)'}} />}
                                 label={<Typography variant="body2" sx={{color:'#dbeafe'}}>Remember me</Typography>}
                                 sx={{mt:0}}
                             />
                            <Button size="small" variant="text" sx={{color:'#dbeafe', textTransform:'none'}} onClick={() => navigate('/auth/resets')}>Need help?</Button>
                        </Box>

                        {error && (
                            <Alert severity="error" role="alert" aria-live="assertive">{error}</Alert>
                        )}

                        <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{py:1.5, fontSize:'1rem', letterSpacing:0.2}}>
                            {loading ? <CircularProgress size={22} sx={{ color: "white" }} /> : 'Sign In'}
                        </Button>

                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 0 }}>
                            <Typography variant="body2" color="#e2e8f0">Don't have an account?</Typography>
                        </Box>
                    </Box>
                </Paper>
            </div>
         </div>
     );
 };

 export default Login;
