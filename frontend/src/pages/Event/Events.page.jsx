import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell from '../../components/PageShell.comp';
import { Button, Stack, TextField, Pagination, CircularProgress, Typography, Card, CardContent, CardMedia, CardActions, Box, Grid, Select, MenuItem, FormControl, InputLabel, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { CalendarToday, PlaceOutlined, PeopleAltOutlined, EventOutlined, Add, FiberManualRecord } from '@mui/icons-material';
import eventService from '../../services/event.service';
import { useNotification } from '../../context/notification';
import { useAuth } from '../../context/auth';
import SafeHtml from '../../components/SafeHtml.comp';

const Events = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { showMessage } = useNotification();
    const { currentUser, activeInterface } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    // Initialize from URL params
    const [status, setStatus] = useState(searchParams.get('status') || 'all');
    const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
    const [limit] = useState(12);
    const [totalPages, setTotalPages] = useState(1);

    // Determine if user is regular (not manager/organizer/superuser)
    const effectiveRole = activeInterface || currentUser?.role || 'regular';
    const isRegularUser = effectiveRole === 'regular' || effectiveRole === 'cashier';
    const canManageEvents = effectiveRole === 'manager' || effectiveRole === 'organizer' || effectiveRole === 'superuser';

    // Helper function to determine event status
    const getEventStatus = (event) => {
        const now = new Date();
        const startTime = new Date(event.startTime);
        const endTime = new Date(event.endTime);

        if (now < startTime) {
            return 'upcoming';
        } else if (now >= startTime && now <= endTime) {
            return 'live';
        } else {
            return 'ended';
        }
    };

    // Update URL when filters change
    useEffect(() => {
        const params = {};
        if (status !== 'all') params.status = status;
        if (page > 1) params.page = page.toString();

        setSearchParams(params, { replace: true });
    }, [status, page, setSearchParams]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            // Map status filter to backend parameters
            let started = undefined;
            let ended = undefined;

            if (status === 'live') {
                started = 'true';  // Event has started
                ended = 'false';   // But not ended
            } else if (status === 'upcoming') {
                started = 'false'; // Event hasn't started
            } else if (status === 'ended') {
                ended = 'true';    // Event has ended
            }

            const resp = await eventService.getEvents(
                undefined,  // No search
                undefined,
                started,
                ended,
                undefined,
                undefined,
                page,
                limit
            );
            const list = Array.isArray(resp) ? resp : (resp?.results || resp?.data || []);
            const total = resp?.count ?? resp?.total ?? list.length;
            setEvents(list);
            setTotalPages(Math.max(1, Math.ceil(total / limit)));
        } catch (err) {
            console.error(err);
            showMessage('Failed to load events', 'error');
        } finally { setLoading(false); }
    }, [status, page, limit, showMessage]);

    // Load events when page, search, or status changes
    useEffect(() => {
        load();
    }, [load]);

    // Reset to page 1 when status changes
    useEffect(() => {
        if (page !== 1) {
            setPage(1);
        }
    }, [status]);

    const handleView = (eventId) => navigate(`/events/${eventId}`);
    const handleCreate = () => navigate('/events/create');

    return (
        <PageShell title="Events" subtitle={canManageEvents ? "Create and manage events" : "Discover and join exclusive member events"}>
            {/* Filter Bar with Create Button */}
            <Card className="section-card section-card--glow" sx={{mb: 3}}>
                <CardContent>
                    <Stack direction={{xs:'column', md:'row'}} spacing={2} alignItems="center">
                        <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 150 } }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={status}
                                label="Status"
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <MenuItem value="all">All Events</MenuItem>
                                <MenuItem value="live">Live Now</MenuItem>
                                <MenuItem value="upcoming">Upcoming</MenuItem>
                                <MenuItem value="ended">Ended</MenuItem>
                            </Select>
                        </FormControl>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setStatus('all');
                                setPage(1);
                            }}
                            sx={{ minWidth: { xs: 'auto', md: 100 } }}
                        >
                            Clear Filter
                        </Button>
                        {canManageEvents && (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<Add />}
                                onClick={handleCreate}
                                sx={{ minWidth: { xs: 'auto', md: 150 }, ml: 'auto' }}
                            >
                                Create Event
                            </Button>
                        )}
                    </Stack>
                </CardContent>
            </Card>

            {/* Events Grid */}
            <div className="section-card">
                {loading ? (
                    <div style={{padding: 48, textAlign: 'center'}}>
                        <CircularProgress />
                        <Typography variant="body2" color="text.secondary" sx={{mt: 2}}>
                            Loading events...
                        </Typography>
                    </div>
                ) : events.length === 0 ? (
                    <div className="empty-state">
                        <EventOutlined sx={{ fontSize: 64, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>No events found</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {status !== 'all' ? 'Try changing the filter or check back later' : 'Check back later for upcoming events'}
                        </Typography>
                    </div>
                ) : (
                    <Grid container spacing={3}>
                        {events.map(event => (
                            <Grid item xs={12} sm={6} md={4} key={event.id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        background: 'var(--card)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: '18px',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 12px 40px rgba(124, 58, 237, 0.2)',
                                            border: '1px solid rgba(124, 58, 237, 0.3)',
                                        }
                                    }}
                                >
                                    {/* Event Image */}
                                    {event.image && (
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={event.image}
                                            alt={event.name || event.title}
                                            sx={{
                                                objectFit: 'cover',
                                                borderTopLeftRadius: '18px',
                                                borderTopRightRadius: '18px'
                                            }}
                                        />
                                    )}

                                    {/* Points Badge */}
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 16,
                                        right: 16,
                                        background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                                        padding: '8px 16px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        fontWeight: 700,
                                        color: '#fff',
                                        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                                    }}>
                                        <span style={{fontSize: '18px'}}>★</span>
                                        {event.points || 0} pts
                                    </Box>

                                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                        {/* Event Name */}
                                        <Typography
                                            variant="h6"
                                            component="h3"
                                            gutterBottom
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: '1.1rem',
                                                mb: 1.5
                                            }}
                                        >
                                            {event.name || event.title}
                                        </Typography>

                                        {/* Status Badge */}
                                        <Box sx={{ mb: 2 }}>
                                            {(() => {
                                                const eventStatus = getEventStatus(event);
                                                const statusConfig = {
                                                    live: {
                                                        label: 'Live Now',
                                                        color: '#10B981',
                                                        bgColor: 'rgba(16, 185, 129, 0.15)',
                                                        icon: <FiberManualRecord sx={{ fontSize: 12 }} />
                                                    },
                                                    upcoming: {
                                                        label: 'Upcoming',
                                                        color: '#06B6D4',
                                                        bgColor: 'rgba(6, 182, 212, 0.15)',
                                                        icon: null
                                                    },
                                                    ended: {
                                                        label: 'Ended',
                                                        color: '#94A3B8',
                                                        bgColor: 'rgba(148, 163, 184, 0.15)',
                                                        icon: null
                                                    }
                                                };
                                                const config = statusConfig[eventStatus];

                                                return (
                                                    <Chip
                                                        icon={config.icon}
                                                        label={config.label}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: config.bgColor,
                                                            color: config.color,
                                                            fontWeight: 600,
                                                            fontSize: '0.75rem',
                                                            height: '24px',
                                                            '& .MuiChip-icon': {
                                                                color: config.color,
                                                                animation: eventStatus === 'live' ? 'pulse 2s ease-in-out infinite' : 'none',
                                                                marginLeft: '8px'
                                                            },
                                                            '@keyframes pulse': {
                                                                '0%, 100%': { opacity: 1 },
                                                                '50%': { opacity: 0.5 }
                                                            }
                                                        }}
                                                    />
                                                );
                                            })()}
                                        </Box>

                                        {/* Event Meta */}
                                        <Stack spacing={1.5}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <CalendarToday sx={{ fontSize: 18, color: 'rgba(124, 58, 237, 0.8)' }} />
                                                <Typography variant="body2">
                                                    {event.startTime ? new Date(event.startTime).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    }) : 'Date TBD'}
                                                </Typography>
                                            </Stack>

                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <PlaceOutlined sx={{ fontSize: 18, color: 'rgba(6, 182, 212, 0.8)' }} />
                                                <Typography variant="body2" sx={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {event.location || 'Location TBD'}
                                                </Typography>
                                            </Stack>

                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <PeopleAltOutlined sx={{ fontSize: 18, color: 'rgba(16, 185, 129, 0.8)' }} />
                                                <Typography variant="body2">
                                                    {event.numGuests ?? event.attendees ?? 0} attending
                                                </Typography>
                                            </Stack>
                                        </Stack>
                                    </CardContent>

                                    <CardActions sx={{ p: 3, pt: 0 }}>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            onClick={() => handleView(event.id)}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                py: 1.5,
                                                borderRadius: '12px',
                                                background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                                                '&:hover': {
                                                    background: 'linear-gradient(135deg, #6D28D9, #5B21B6)',
                                                    transform: 'scale(1.02)',
                                                }
                                            }}
                                        >
                                            View Details
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(e, v) => setPage(v)}
                        color="primary"
                        size="large"
                        showFirstButton
                        showLastButton
                    />
                </Box>
            )}
        </PageShell>
    );
};

export default Events;
