import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Typography, Box, Button, Grid, Card, CardContent, Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useAuth } from '../../context/auth';
import PageShell from '../../components/PageShell.comp';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import EventIcon from '@mui/icons-material/Event';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CampaignIcon from '@mui/icons-material/Campaign';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const Home = () => {
    const { currentUser, activeInterface } = useAuth();
    const navigate = useNavigate();
    const points = currentUser?.points ?? 0;
    const [signInDialogOpen, setSignInDialogOpen] = useState(false);
    const [intendedDestination, setIntendedDestination] = useState('');

    // Use activeInterface if available, otherwise fall back to currentUser.role
    const effectiveRole = activeInterface || currentUser?.role;

    // Handler for guest clicks on feature links
    const handleGuestLinkClick = (e, destination) => {
        if (!currentUser) {
            e.preventDefault();
            setIntendedDestination(destination);
            setSignInDialogOpen(true);
        }
    };

    const handleSignInFromDialog = () => {
        setSignInDialogOpen(false);
        navigate('/login', { state: { from: intendedDestination } });
    };

    const handleCloseDialog = () => {
        setSignInDialogOpen(false);
        setIntendedDestination('');
    };

    // Role-specific welcome messages
    const getWelcomeMessage = () => {
        if (!currentUser) {
            return 'Manage your loyalty points, discover promotions, join events, and unlock exclusive rewards — all in one place.';
        }

        switch (effectiveRole) {
            case 'regular':
                return 'Track your points balance, view recent transactions, participate in events, and redeem rewards.';
            case 'cashier':
                return 'Quick access to transaction creation, redemption processing, and user registration.';
            case 'organizer':
                return 'Manage events, add guests, award points, and organize community activities.';
            case 'manager':
            case 'superuser':
                return 'Comprehensive overview of users, events, promotions, and all system transactions.';
            default:
                return 'Welcome to the CSSU Rewards Portal.';
        }
    };

    // Role-based features according to requirements
    const features = useMemo(() => {
        if (!currentUser) {
            // Guest users see limited features
            return [
                {
                    icon: <LocalOfferIcon sx={{ fontSize: 40 }} />,
                    title: 'Promotions',
                    description: 'Discover latest deals and bonus point opportunities',
                    link: '/promotions',
                    color: '#EC4899'
                },
                {
                    icon: <EventIcon sx={{ fontSize: 40 }} />,
                    title: 'Events',
                    description: 'Browse upcoming events and activities',
                    link: '/events',
                    color: '#10B981'
                },
            ];
        }

        const role = effectiveRole;

        // REGULAR USER FEATURES (Landing Page: Dashboard showing points balance and recent transactions)
        if (role === 'regular') {
            return [
                {
                    icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
                    title: 'Dashboard',
                    description: 'View your points balance and recent transactions',
                    link: '/dashboard',
                    color: '#7C3AED'
                },
                {
                    icon: <SwapHorizIcon sx={{ fontSize: 40 }} />,
                    title: 'Transfer Points',
                    description: 'Send points instantly to other users',
                    link: '/transfer',
                    color: '#06B6D4'
                },
                {
                    icon: <EmojiEventsIcon sx={{ fontSize: 40 }} />,
                    title: 'Request Redemption',
                    description: 'Request to redeem your points for rewards',
                    link: '/redemption',
                    color: '#7C3AED'
                },
                {
                    icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
                    title: 'My Transactions',
                    description: 'View your complete transaction history',
                    link: '/transactions',
                    color: '#8B5CF6'
                },
                {
                    icon: <EventIcon sx={{ fontSize: 40 }} />,
                    title: 'Events',
                    description: 'RSVP to events and earn points',
                    link: '/events',
                    color: '#10B981'
                },
                {
                    icon: <LocalOfferIcon sx={{ fontSize: 40 }} />,
                    title: 'Promotions',
                    description: 'View available promotions and bonus offers',
                    link: '/promotions',
                    color: '#EC4899'
                },
            ];
        }

        // CASHIER FEATURES (Landing Page: Quick access to transaction creation and redemption processing)
        if (role === 'cashier') {
            return [
                {
                    icon: <PointOfSaleIcon sx={{ fontSize: 40 }} />,
                    title: 'Create Purchase',
                    description: 'Process purchase transactions with promotions',
                    link: '/cashier/create',
                    color: '#3B82F6'
                },
                {
                    icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
                    title: 'Process Redemptions',
                    description: 'Process pending redemption requests',
                    link: '/cashier/process',
                    color: '#14B8A6'
                },
                {
                    icon: <PeopleAltIcon sx={{ fontSize: 40 }} />,
                    title: 'Create User Account',
                    description: 'Register new users in the system',
                    link: '/cashier/users/create',
                    color: '#7C3AED'
                },
                {
                    icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
                    title: 'My Dashboard',
                    description: 'View your points balance and transactions',
                    link: '/dashboard',
                    color: '#7C3AED'
                },
            ];
        }

        // ORGANIZER FEATURES (Landing Page: Access to event management)
        if (role === 'organizer') {
            return [
                {
                    icon: <EventIcon sx={{ fontSize: 40 }} />,
                    title: 'Event List',
                    description: 'View all events and add guests',
                    link: '/events',
                    color: '#059669'
                },
                {
                    icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
                    title: 'Dashboard',
                    description: 'View your points balance and transactions',
                    link: '/dashboard',
                    color: '#7C3AED'
                },
            ];
        }

        // MANAGER/SUPERUSER FEATURES (Landing Page: Overview of events, promotions, and user management)
        if (role === 'manager' || role === 'superuser') {
            return [
                {
                    icon: <PeopleAltIcon sx={{ fontSize: 40 }} />,
                    title: 'User Management',
                    description: 'View, verify, and manage user accounts',
                    link: '/manager/users',
                    color: '#7C3AED'
                },
                {
                    icon: <CampaignIcon sx={{ fontSize: 40 }} />,
                    title: 'Event Management',
                    description: 'Create, update and manage all events',
                    link: '/manager/events',
                    color: '#10B981'
                },
                {
                    icon: <LocalOfferIcon sx={{ fontSize: 40 }} />,
                    title: 'Promotion Management',
                    description: 'Create, update and manage promotions',
                    link: '/manager/promotions',
                    color: '#EC4899'
                },
                {
                    icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
                    title: 'All Transactions',
                    description: 'View and manage all system transactions',
                    link: '/manager/transactions',
                    color: '#8B5CF6'
                },
                {
                    icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
                    title: 'My Dashboard',
                    description: 'View your personal points and transactions',
                    link: '/dashboard',
                    color: '#7C3AED'
                },
            ];
        }

        // Fallback (shouldn't happen)
        return [];
    }, [currentUser, effectiveRole]);

    return (
        <PageShell title="" subtitle="">
            {/* Hero Section */}
            <Box sx={{
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(6, 182, 212, 0.10) 100%)',
                borderRadius: '24px',
                padding: { xs: '40px 24px', md: '60px 48px' },
                marginBottom: 5,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <Box sx={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(124, 58, 237, 0.2), transparent)',
                    filter: 'blur(60px)'
                }} />

                <Grid container spacing={4} alignItems="center">
                    <Grid item xs={12} md={7}>
                        <Chip
                            label="Welcome Back"
                            size="small"
                            sx={{
                                mb: 2,
                                background: 'rgba(124, 58, 237, 0.2)',
                                color: '#E9D5FF',
                                fontWeight: 600
                            }}
                        />
                        <Typography variant="h2" sx={{
                            fontWeight: 800,
                            mb: 2,
                            fontSize: { xs: '2rem', md: '3rem' },
                            background: 'linear-gradient(135deg, #fff 0%, #E0E7FF 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            {currentUser?.name ? `Hello, ${currentUser.name}!` : 'CSSU Rewards Portal'}
                        </Typography>
                        <Typography variant="h6" sx={{
                            mb: 3,
                            color: 'rgba(255, 255, 255, 0.75)',
                            maxWidth: 600,
                            fontSize: { xs: '1rem', md: '1.25rem' }
                        }}>
                            {getWelcomeMessage()}
                        </Typography>

                        {!currentUser ? (
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <Button
                                    component={Link}
                                    to="/login"
                                    variant="contained"
                                    size="large"
                                    sx={{
                                        background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                                        px: 4,
                                        py: 1.5,
                                        fontSize: '1.1rem',
                                        fontWeight: 700,
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #6D28D9, #4C1D95)',
                                        }
                                    }}
                                >
                                    Sign In
                                </Button>
                            </Stack>
                        ) : (
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <Button
                                    component={Link}
                                    to="/dashboard"
                                    variant="contained"
                                    size="large"
                                    sx={{
                                        background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                                        px: 4,
                                        py: 1.5,
                                        fontSize: '1.1rem',
                                        fontWeight: 700,
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #6D28D9, #4C1D95)',
                                        }
                                    }}
                                >
                                    Open Dashboard
                                </Button>
                                <Button
                                    component={Link}
                                    to="/profile"
                                    variant="outlined"
                                    size="large"
                                    sx={{
                                        borderColor: 'rgba(255, 255, 255, 0.3)',
                                        color: '#fff',
                                        px: 4,
                                        py: 1.5,
                                        fontSize: '1.1rem',
                                        fontWeight: 700,
                                        '&:hover': {
                                            borderColor: 'rgba(255, 255, 255, 0.5)',
                                            background: 'rgba(255, 255, 255, 0.05)'
                                        }
                                    }}
                                >
                                    View Profile
                                </Button>
                            </Stack>
                        )}
                    </Grid>

                    {currentUser && (
                        <Grid item xs={12} md={5}>
                            <Card sx={{
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '20px',
                                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                            }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Stack spacing={2}>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{
                                                color: 'rgba(255, 255, 255, 0.7)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1em',
                                                fontSize: '0.75rem',
                                                mb: 1
                                            }}>
                                                Your Points Balance
                                            </Typography>
                                            <Typography variant="h2" sx={{
                                                fontWeight: 800,
                                                background: 'linear-gradient(135deg, #7C3AED, #9333EA)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent'
                                            }}>
                                                {points}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                                points available
                                            </Typography>
                                        </Box>

                                        <Box sx={{
                                            p: 2,
                                            background: 'rgba(255, 255, 255, 0.06)',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255, 255, 255, 0.08)'
                                        }}>
                                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 0.5 }}>
                                                <strong>Account:</strong> {currentUser.name}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', textTransform: 'capitalize' }}>
                                                <strong>Active Interface:</strong> {effectiveRole}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            </Box>

            {/* Features Grid */}
            <Box sx={{ mb: 5 }}>
                <Typography variant="h4" sx={{
                    fontWeight: 700,
                    mb: 1,
                    fontSize: { xs: '1.5rem', md: '2rem' }
                }}>
                    {currentUser ?
                        (effectiveRole === 'manager' || effectiveRole === 'superuser' ?
                            'Management Overview' :
                            effectiveRole === 'cashier' ?
                                'Quick Actions' :
                                effectiveRole === 'organizer' ?
                                    'Event Management' :
                                    'Your Features')
                        : 'Explore Features'}
                </Typography>
                <Typography variant="body1" sx={{
                    color: 'var(--text-muted)',
                    mb: 4
                }}>
                    {currentUser ?
                        (effectiveRole === 'manager' || effectiveRole === 'superuser' ?
                            'Manage users, events, promotions, and view all system activity' :
                            effectiveRole === 'cashier' ?
                                'Process transactions and manage redemptions quickly' :
                                effectiveRole === 'organizer' ?
                                    'Create and manage events, add guests, and award points' :
                                    'Access your most-used features right from the home page')
                        : 'Discover what you can do with the CSSU Rewards Portal'}
                </Typography>

                <Grid container spacing={3}>
                    {features.map((feature, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <Card
                                component={currentUser ? Link : 'div'}
                                to={currentUser ? feature.link : undefined}
                                onClick={(e) => handleGuestLinkClick(e, feature.link)}
                                sx={{
                                    height: '100%',
                                    background: 'var(--card)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '18px',
                                    transition: 'all 0.3s ease',
                                    textDecoration: 'none',
                                    display: 'block',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                                        borderColor: 'rgba(255, 255, 255, 0.15)',
                                    }
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{
                                        width: 60,
                                        height: 60,
                                        borderRadius: '14px',
                                        background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}10)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mb: 2,
                                        color: feature.color
                                    }}>
                                        {feature.icon}
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                        {feature.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                                        {feature.description}
                                    </Typography>
                                    {!currentUser && (
                                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <LockOutlinedIcon sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.5)' }} />
                                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                                Sign in required
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* Info Section */}
            <Box sx={{ mb: 5 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card sx={{
                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            borderRadius: '18px',
                            height: '100%'
                        }}>
                            <CardContent sx={{ p: 4 }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                                    Earn More Points
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                                    Participate in events, complete transactions, and take advantage of promotions to maximize your rewards.
                                </Typography>
                                <Button
                                    component={currentUser ? Link : 'button'}
                                    to={currentUser ? "/events" : undefined}
                                    onClick={(e) => handleGuestLinkClick(e, '/events')}
                                    variant="contained"
                                    sx={{
                                        background: 'rgba(16, 185, 129, 0.9)',
                                        '&:hover': {
                                            background: 'rgba(5, 150, 105, 1)'
                                        }
                                    }}
                                >
                                    Browse Events
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card sx={{
                            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(219, 39, 119, 0.1))',
                            border: '1px solid rgba(236, 72, 153, 0.2)',
                            borderRadius: '18px',
                            height: '100%'
                        }}>
                            <CardContent sx={{ p: 4 }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                                    Special Offers
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                                    Check out our latest promotions and limited-time offers. Don't miss out on bonus point opportunities!
                                </Typography>
                                <Button
                                    component={currentUser ? Link : 'button'}
                                    to={currentUser ? "/promotions" : undefined}
                                    onClick={(e) => handleGuestLinkClick(e, '/promotions')}
                                    variant="contained"
                                    sx={{
                                        background: 'rgba(236, 72, 153, 0.9)',
                                        '&:hover': {
                                            background: 'rgba(219, 39, 119, 1)'
                                        }
                                    }}
                                >
                                    View Promotions
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>

            {/* Sign In Required Dialog */}
            <Dialog
                open={signInDialogOpen}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        background: 'var(--card)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '18px',
                        backdropFilter: 'blur(20px)'
                    }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    pb: 2
                }}>
                    <Box sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(124, 58, 237, 0.1))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#7C3AED'
                    }}>
                        <LockOutlinedIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            Sign In Required
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'var(--text-muted)', mt: 0.5 }}>
                            Please sign in to continue
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ pt: 2, pb: 3 }}>
                    <Typography variant="body1" sx={{ color: 'var(--text-muted)', mb: 2 }}>
                        This feature requires you to be signed in to your account.
                        Sign in now to access all features of the CSSU Rewards Portal.
                    </Typography>
                    <Box sx={{
                        p: 2,
                        background: 'rgba(124, 58, 237, 0.1)',
                        borderRadius: '12px',
                        border: '1px solid rgba(124, 58, 237, 0.2)'
                    }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                            <strong>What you'll get:</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mt: 1, ml: 3 }}>
                            • Track your loyalty points<br />
                            • Participate in events<br />
                            • Redeem exclusive rewards<br />
                            • View transaction history<br />
                            • Access special promotions
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        onClick={handleCloseDialog}
                        variant="outlined"
                        sx={{
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'var(--text)',
                            '&:hover': {
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                background: 'rgba(255, 255, 255, 0.05)'
                            }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSignInFromDialog}
                        variant="contained"
                        startIcon={<LockOutlinedIcon />}
                        sx={{
                            background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                            fontWeight: 600,
                            '&:hover': {
                                background: 'linear-gradient(135deg, #6D28D9, #4C1D95)',
                            }
                        }}
                    >
                        Sign In Now
                    </Button>
                </DialogActions>
            </Dialog>
        </PageShell>
    )
}

export default Home;