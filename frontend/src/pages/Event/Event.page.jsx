import React, { useEffect, useState, useCallback } from 'react';
import { Typography, Button, Stack, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Divider, Card, CardContent, Avatar, List, ListItem, ListItemAvatar, ListItemText, ListItemSecondaryAction, IconButton, CircularProgress, Box, Grid } from '@mui/material';
import PageShell from '../../components/PageShell.comp';
import eventService from '../../services/event.service';
import userService from '../../services/user.service';
import { useNotification } from '../../context/notification';
import SafeHtml from '../../components/SafeHtml.comp';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import { Event as EventIcon, LocationOn, AccessTime, People, Stars, PersonAdd, Delete, Edit, CheckCircle, Cancel, EmojiEvents, CalendarToday } from '@mui/icons-material';

const Event = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { showMessage } = useNotification();
    const { currentUser, activeInterface } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rsvpLoading, setRsvpLoading] = useState(false);
    const [removingGuestId, setRemovingGuestId] = useState(null);
    const [guestDialogOpen, setGuestDialogOpen] = useState(false);
    const [guestUtorid, setGuestUtorid] = useState('');
    const [awardDialogOpen, setAwardDialogOpen] = useState(false);
    const [awardAmount, setAwardAmount] = useState('');
    const [awardToUtorid, setAwardToUtorid] = useState('');
    const [organizerDialogOpen, setOrganizerDialogOpen] = useState(false);
    const [organizerUtorid, setOrganizerUtorid] = useState('');
    const [guestUsers, setGuestUsers] = useState({});

    // Determine effective role
    const effectiveRole = activeInterface || currentUser?.role || 'regular';
    const isRegularUser = effectiveRole === 'regular' || effectiveRole === 'cashier';
    const canManageEvents = effectiveRole === 'manager' || effectiveRole === 'organizer' || effectiveRole === 'superuser';

    // Check if event has ended
    const hasEnded = event ? new Date(event.endTime) < new Date() : false;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const resp = await eventService.getEventById(eventId);

            // For regular users, check if event is explicitly unpublished (published === false)
            // If published field is undefined/null/missing, allow access (default to published)
            if (isRegularUser && resp.published === false) {
                showMessage('This event is not available', 'error');
                navigate('/events');
                return;
            }

            setEvent(resp);
            // fetch utorid for guests when possible - only if not regular user
            if (!isRegularUser && resp && Array.isArray(resp.guests) && resp.guests.length > 0) {
                const map = {};
                await Promise.all(resp.guests.map(async (g) => {
                    try {
                        const uresp = await userService.getUser(g.userId);
                        const userObj = uresp?.data || uresp;
                        map[g.id] = { utorid: userObj?.utorid || null, name: userObj?.name || null, id: g.userId };
                    } catch (e) {
                        // ignore
                        map[g.id] = { utorid: null, name: null, id: g.userId };
                    }
                }));
                setGuestUsers(map);
            }
        } catch (err) {
            console.error(err);
            showMessage('Failed to load event', 'error');
        } finally { setLoading(false); }
    }, [eventId, isRegularUser, showMessage, navigate]);

    useEffect(() => { if (eventId) load(); }, [eventId, effectiveRole, load]);

    const handleRSVP = async () => {
        setRsvpLoading(true);
        try {
            await eventService.addSelfAsGuest(event.id);
            showMessage('RSVP successful', 'success');
            await load();
        } catch (err) {
            console.error(err);
            const errorMsg = err?.response?.data?.error || err?.message || err?.toString();
            showMessage('Failed to RSVP: ' + errorMsg, 'error');
        } finally { setRsvpLoading(false); }
    };

    const handleAddGuest = async () => {
        if (!guestUtorid) return showMessage('Enter UTORid', 'warning');

        // Trim the utorid to avoid whitespace issues
        const trimmedUtorid = guestUtorid.trim();
        if (!trimmedUtorid) return showMessage('Enter a valid UTORid', 'warning');

        try {
            await eventService.addEventGuest(event.id, trimmedUtorid);
            showMessage(`Successfully added ${trimmedUtorid} as guest`, 'success');
            setGuestDialogOpen(false);
            setGuestUtorid('');
            await load();
        } catch (err) {
            console.error(err);

            // Handle specific error cases
            const errorMsg = err?.response?.data?.error || err?.message || err?.toString();

            if (errorMsg.includes('User not found') || err?.response?.status === 404) {
                showMessage(`User "${trimmedUtorid}" not found. Please check the UTORid and try again.`, 'error');
            } else if (errorMsg.includes('Unique constraint') || errorMsg.includes('already') || errorMsg.includes('duplicate')) {
                showMessage(`User "${trimmedUtorid}" is already added as a guest for this event.`, 'warning');
            } else if (errorMsg.includes('Event is full')) {
                showMessage('Event is at full capacity. Cannot add more guests.', 'error');
            } else if (errorMsg.includes('Event has ended')) {
                showMessage('Cannot add guests to an event that has already ended.', 'error');
            } else if (errorMsg.includes('Not authorized')) {
                showMessage('You do not have permission to add guests to this event.', 'error');
            } else if (errorMsg.includes('Remove user as organizer first')) {
                showMessage(`Cannot add "${trimmedUtorid}" as guest because they are an organizer. Remove them as organizer first.`, 'warning');
            } else {
                showMessage('Failed to add guest: ' + errorMsg, 'error');
            }

            // Don't close dialog on error so user can correct the input
        }
    };

    const handleRemoveGuest = async (guest) => {
        setRemovingGuestId(guest.id);
        try {
            await eventService.removeEventGuest(event.id, undefined, guest.userId);
            showMessage('Guest removed successfully', 'success');
            await load();
        } catch (err) {
            console.error(err);
            const errorMsg = err?.response?.data?.error || err?.message || err?.toString();

            // Handle specific error cases
            if (errorMsg.includes('Event has ended')) {
                showMessage('Cannot remove guests from an event that has already ended', 'warning');
            } else if (errorMsg.includes('Not authorized')) {
                showMessage('You do not have permission to remove guests from this event', 'error');
            } else if (errorMsg.includes('Guest not found')) {
                showMessage('Guest not found for this event', 'error');
            } else {
                showMessage('Failed to remove guest: ' + errorMsg, 'error');
            }
        } finally {
            setRemovingGuestId(null);
        }
    };

    const handleAddOrganizer = async () => {
        if (!organizerUtorid) return showMessage('Enter UTORid', 'warning');

        const trimmedUtorid = organizerUtorid.trim();
        if (!trimmedUtorid) return showMessage('Enter a valid UTORid', 'warning');

        try {
            await eventService.addEventOrganizer(event.id, trimmedUtorid);
            showMessage(`Successfully added ${trimmedUtorid} as organizer`, 'success');
            setOrganizerDialogOpen(false);
            setOrganizerUtorid('');
            await load();
        } catch (err) {
            console.error(err);
            const errorMsg = err?.response?.data?.error || err?.message || err?.toString();

            // Handle specific error cases
            if (errorMsg.includes('User not found') || err?.response?.status === 404) {
                showMessage(`User "${trimmedUtorid}" not found. Please check the UTORid.`, 'error');
            } else if (errorMsg.includes('already an organizer')) {
                showMessage(`User "${trimmedUtorid}" is already an organizer for this event.`, 'warning');
            } else if (errorMsg.includes('Remove user as guest first')) {
                showMessage(`Cannot add "${trimmedUtorid}" as organizer because they are a guest. Remove them as guest first.`, 'warning');
            } else if (errorMsg.includes('Event has ended')) {
                showMessage('Cannot add organizers to ended events.', 'error');
            } else if (errorMsg.includes('Not authorized')) {
                showMessage('You do not have permission to add organizers.', 'error');
            } else {
                showMessage('Failed to add organizer: ' + errorMsg, 'error');
            }
        }
    };

    const handleRemoveOrganizer = async (userId) => {
        try {
            await eventService.removeEventOrganizer(event.id, userId);
            showMessage('Organizer removed successfully', 'success');
            await load();
        } catch (err) {
            console.error(err);
            const errorMsg = err?.response?.data?.error || err?.message || err?.toString();

            // Handle specific error cases
            if (errorMsg.includes('Organizer not found') || err?.response?.status === 404) {
                showMessage('Organizer not found for this event.', 'error');
            } else if (errorMsg.includes('Not authorized')) {
                showMessage('You do not have permission to remove organizers.', 'error');
            } else {
                showMessage('Failed to remove organizer: ' + errorMsg, 'error');
            }
        }
    };

    const handleAward = async () => {
        // Comprehensive frontend validation
        if (!awardToUtorid || !awardToUtorid.trim()) {
            showMessage('Please enter the recipient UTORid', 'warning');
            return;
        }

        const trimmedUtorid = awardToUtorid.trim();

        // Validate UTORid format
        if (trimmedUtorid.length < 3) {
            showMessage('UTORid must be at least 3 characters', 'warning');
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(trimmedUtorid)) {
            showMessage('UTORid can only contain letters, numbers, and underscores', 'warning');
            return;
        }

        const amt = Number(awardAmount);
        if (!awardAmount || isNaN(amt)) {
            showMessage('Please enter a valid point amount', 'warning');
            return;
        }

        if (amt <= 0) {
            showMessage('Point amount must be greater than 0', 'warning');
            return;
        }

        if (amt > 10000) {
            showMessage('Cannot award more than 10,000 points at once', 'warning');
            return;
        }

        if (!Number.isInteger(amt)) {
            showMessage('Point amount must be a whole number', 'warning');
            return;
        }

        try {
            await eventService.createEventTransaction(event.id, 'event', trimmedUtorid, amt, 'Award from organizer');
            showMessage(`Successfully awarded ${amt} points to ${trimmedUtorid}`, 'success');
            setAwardDialogOpen(false);
            setAwardAmount('');
            setAwardToUtorid('');
            await load();
        } catch (err) {
            console.error('Award points error:', err);

            const errorResponse = err?.response?.data?.error;
            const statusCode = err?.response?.status;

            // Handle specific error cases
            if (statusCode === 404) {
                if (errorResponse?.includes('User') || errorResponse?.includes('not found')) {
                    showMessage(`User "${trimmedUtorid}" not found. Please verify the UTORid is correct.`, 'error');
                } else if (errorResponse?.includes('Event')) {
                    showMessage('Event not found. The event may have been deleted.', 'error');
                } else {
                    showMessage('User or event not found. Please check the UTORid.', 'error');
                }
            } else if (statusCode === 400) {
                if (errorResponse?.includes('guest') || errorResponse?.includes('attendee')) {
                    showMessage(`${trimmedUtorid} is not registered as a guest for this event. Please add them as a guest first.`, 'error');
                } else if (errorResponse?.includes('ended')) {
                    showMessage('Cannot award points - event has ended.', 'error');
                } else if (errorResponse?.includes('started')) {
                    showMessage('Cannot award points - event has not started yet.', 'error');
                } else {
                    showMessage(errorResponse || 'Invalid request. Please check your input.', 'error');
                }
            } else if (statusCode === 403) {
                showMessage('You do not have permission to award points for this event.', 'error');
            } else if (statusCode === 410) {
                showMessage('Event has ended. Points can no longer be awarded.', 'error');
            } else if (statusCode === 500) {
                showMessage('Server error while awarding points. Please try again.', 'error');
            } else if (err?.code === 'ERR_NETWORK') {
                showMessage('Network error. Please check your connection and try again.', 'error');
            } else if (errorResponse) {
                showMessage('Failed to award points: ' + errorResponse, 'error');
            } else {
                showMessage('Failed to award points: ' + (err?.message || 'Unknown error occurred'), 'error');
            }
        }
    };

    const handleAwardToGuest = async (utorid) => {
        // Validate point amount
        const amt = Number(awardAmount);
        if (!awardAmount || isNaN(amt)) {
            showMessage('Please enter a valid point amount', 'warning');
            return;
        }

        if (amt <= 0) {
            showMessage('Point amount must be greater than 0', 'warning');
            return;
        }

        if (amt > 10000) {
            showMessage('Cannot award more than 10,000 points at once', 'warning');
            return;
        }

        if (!Number.isInteger(amt)) {
            showMessage('Point amount must be a whole number', 'warning');
            return;
        }

        const recipient = utorid || awardToUtorid;
        if (!recipient) {
            showMessage('Recipient UTORid is missing', 'error');
            return;
        }

        try {
            await eventService.createEventTransaction(event.id, 'event', recipient, amt, 'Award to guest');
            showMessage(`Successfully awarded ${amt} points to ${recipient}`, 'success');
            setAwardDialogOpen(false);
            setAwardAmount('');
            setAwardToUtorid('');
            await load();
        } catch (err) {
            console.error('Award points to guest error:', err);

            const errorResponse = err?.response?.data?.error;
            const statusCode = err?.response?.status;

            // Handle specific error cases
            if (statusCode === 404) {
                if (errorResponse?.includes('User')) {
                    showMessage(`User "${recipient}" not found in the system.`, 'error');
                } else if (errorResponse?.includes('guest') || errorResponse?.includes('attendee')) {
                    showMessage(`${recipient} is not registered as a guest for this event.`, 'error');
                } else {
                    showMessage('User or guest record not found.', 'error');
                }
            } else if (statusCode === 400) {
                if (errorResponse?.includes('ended')) {
                    showMessage('Cannot award points - event has ended.', 'error');
                } else if (errorResponse?.includes('already awarded') || errorResponse?.includes('duplicate')) {
                    showMessage(`Points have already been awarded to ${recipient} for this event.`, 'warning');
                } else {
                    showMessage(errorResponse || 'Invalid request. Please check your input.', 'error');
                }
            } else if (statusCode === 403) {
                showMessage('You do not have permission to award points for this event.', 'error');
            } else if (statusCode === 410) {
                showMessage('Event has ended. Points can no longer be awarded.', 'error');
            } else if (statusCode === 500) {
                showMessage('Server error while awarding points. Please try again.', 'error');
            } else if (err?.code === 'ERR_NETWORK') {
                showMessage('Network error. Please check your connection and try again.', 'error');
            } else if (errorResponse) {
                showMessage('Failed to award points: ' + errorResponse, 'error');
            } else {
                showMessage('Failed to award points: ' + (err?.message || 'Unknown error occurred'), 'error');
            }
        }
    };

    const handleEdit = () => {
        navigate(`/events/${eventId}/edit`);
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete the event "${event.name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await eventService.deleteEvent(event.id);
            showMessage('Event deleted successfully', 'success');
            navigate('/events');
        } catch (err) {
            console.error(err);
            const errorMsg = err?.response?.data?.error || err?.message || err?.toString();
            showMessage('Failed to delete event: ' + errorMsg, 'error');
        }
    };

    const handleCancelRSVP = async () => {
        setRsvpLoading(true);
        try {
            await eventService.removeSelfAsGuest(event.id);
            showMessage('RSVP cancelled', 'success');
            await load();
        } catch (err) {
            console.error(err);
            showMessage('Failed to cancel RSVP: ' + (err?.message || err?.toString()), 'error');
        } finally { setRsvpLoading(false); }
    };

    if (loading) {
        return (
            <PageShell title="Event Details" subtitle="Loading event information...">
                <div className="section-card" style={{ textAlign: 'center', padding: 64 }}>
                    <CircularProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Loading event details...
                    </Typography>
                </div>
            </PageShell>
        );
    }

    if (!event) {
        return (
            <PageShell title="Event Not Found" subtitle="This event could not be found.">
                <div className="section-card" style={{ textAlign: 'center', padding: 64 }}>
                    <EventIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>Event Not Found</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        The event you're looking for doesn't exist or has been removed.
                    </Typography>
                    <Button variant="contained" onClick={() => navigate('/events')}>
                        Back to Events
                    </Button>
                </div>
            </PageShell>
        );
    }

    const isOrganizerOrManager = canManageEvents && currentUser && (
        currentUser.role === 'manager' ||
        currentUser.role === 'superuser' ||
        effectiveRole === 'manager' ||
        effectiveRole === 'superuser' ||
        effectiveRole === 'organizer' ||
        (event.organizers && event.organizers.some(o => o.userId === currentUser.id))
    );

    const isUserRegistered = currentUser && event.guests && event.guests.some(g => g.userId === currentUser.id);
    const eventStarted = new Date(event.startTime) <= new Date();
    const eventEnded = new Date(event.endTime) <= new Date();
    const isFull = event.capacity && event.guests && event.guests.length >= event.capacity;

    return (
        <PageShell title={event.name}>
            {/* Event Header Card */}
            <Card className="section-card section-card--glow" sx={{ mb: 4 }}>
                <CardContent sx={{ p: 4 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start" justifyContent="space-between">
                        <Stack spacing={2} sx={{ flex: 1 }}>
                            <Stack direction="row" spacing={2} flexWrap="wrap">
                                <Chip
                                    icon={<CalendarToday />}
                                    label={eventEnded ? 'Ended' : eventStarted ? 'In Progress' : 'Upcoming'}
                                    color={eventEnded ? 'default' : eventStarted ? 'warning' : 'success'}
                                />
                                {isFull && <Chip icon={<People />} label="Full" color="error" />}
                                {event.capacity && (
                                    <Chip
                                        icon={<People />}
                                        label={`${event.guests?.length || 0}/${event.capacity} attendees`}
                                    />
                                )}
                                {!event.capacity && (
                                    <Chip
                                        icon={<People />}
                                        label={`${event.guests?.length || 0} attendees`}
                                    />
                                )}
                                {event.pointsAllocated > 0 && (
                                    <Chip
                                        icon={<Stars />}
                                        label={`${event.pointsAllocated} points`}
                                        color="primary"
                                    />
                                )}
                            </Stack>

                            <Stack spacing={1.5}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <AccessTime color="action" />
                                    <Typography variant="body1">
                                        <strong>Start:</strong> {new Date(event.startTime).toLocaleString()}
                                    </Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <AccessTime color="action" />
                                    <Typography variant="body1">
                                        <strong>End:</strong> {new Date(event.endTime).toLocaleString()}
                                    </Typography>
                                </Stack>
                                {event.location && (
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <LocationOn color="action" />
                                        <Typography variant="body1">
                                            {event.location}
                                        </Typography>
                                    </Stack>
                                )}
                            </Stack>
                        </Stack>

                        <Stack spacing={2}>
                            {!eventEnded && (
                                <>
                                    {!currentUser ? (
                                        <Button
                                            variant="contained"
                                            startIcon={<CheckCircle />}
                                            onClick={() => navigate('/login', { state: { from: `/events/${event.id}` } })}
                                            size="large"
                                        >
                                            Sign In to RSVP
                                        </Button>
                                    ) : isUserRegistered ? (
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            startIcon={<Cancel />}
                                            onClick={handleCancelRSVP}
                                            disabled={rsvpLoading}
                                            size="large"
                                        >
                                            {rsvpLoading ? 'Cancelling...' : 'Cancel RSVP'}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="contained"
                                            startIcon={<CheckCircle />}
                                            onClick={handleRSVP}
                                            disabled={rsvpLoading || isFull}
                                            size="large"
                                        >
                                            {rsvpLoading ? 'Processing...' : isFull ? 'Event Full' : 'RSVP Now'}
                                        </Button>
                                    )}
                                </>
                            )}
                            {isOrganizerOrManager && (
                                <Stack direction="row" spacing={2}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Edit />}
                                        onClick={handleEdit}
                                    >
                                        Edit Event
                                    </Button>
                                    {(currentUser?.role === 'manager' || currentUser?.role === 'superuser' || effectiveRole === 'manager' || effectiveRole === 'superuser') && (
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            startIcon={<Delete />}
                                            onClick={handleDelete}
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </Stack>
                            )}
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>

            <Grid container spacing={4}>
                {/* Left Column */}
                <Grid item xs={12} md={8}>
                    {/* Description Section */}
                    <div className="section-card" style={{ marginBottom: 32 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <EventIcon /> Event Description
                        </Typography>
                        <Divider sx={{ mb: 3 }} />
                        <Box sx={{ '& p': { marginBottom: 2 }, '& ul': { marginLeft: 2 } }}>
                            <SafeHtml html={event.description} />
                        </Box>
                    </div>

                    {/* Guests Section */}
                    <Card className="section-card section-card--glow" sx={{ mb: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                                <Typography variant="h6" sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    fontWeight: 700,
                                    fontSize: '1.25rem'
                                }}>
                                    <People sx={{ color: 'primary.main' }} />
                                    Attendees ({event.guests?.length || 0})
                                </Typography>
                                {isOrganizerOrManager && (
                                    <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<PersonAdd />}
                                        onClick={() => setGuestDialogOpen(true)}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            borderRadius: '8px',
                                            px: 2,
                                        }}
                                    >
                                        Add Guest
                                    </Button>
                                )}
                            </Stack>

                            {!event.guests || event.guests.length === 0 ? (
                                <Box sx={{
                                    textAlign: 'center',
                                    py: 6,
                                    px: 3,
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: '12px',
                                    border: '1px dashed rgba(255, 255, 255, 0.1)'
                                }}>
                                    <People sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.2)', mb: 2 }} />
                                    <Typography variant="body1" color="text.secondary" gutterBottom>
                                        No attendees yet
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Be the first to RSVP!
                                    </Typography>
                                </Box>
                            ) : isRegularUser ? (
                                // Regular users see simplified attendee count only
                                <Box sx={{
                                    textAlign: 'center',
                                    py: 4,
                                    px: 3,
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: '12px'
                                }}>
                                    <People sx={{ fontSize: 48, color: 'rgba(124, 58, 237, 0.5)', mb: 2 }} />
                                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                                        {event.guests.length} {event.guests.length === 1 ? 'Person' : 'People'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {isUserRegistered ? "You're registered for this event" : 'Registered for this event'}
                                    </Typography>
                                    {event.capacity && (
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                            {event.capacity - event.guests.length} spots remaining
                                        </Typography>
                                    )}
                                </Box>
                            ) : (
                                // Managers/Organizers see detailed attendee list
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                                    gap: 2
                                }}>
                                    {event.guests.map((guest) => (
                                        <Card
                                            key={guest.id}
                                            sx={{
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                                borderRadius: '12px',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                    border: '1px solid rgba(124, 58, 237, 0.3)',
                                                    transform: 'translateY(-2px)',
                                                }
                                            }}
                                        >
                                            <CardContent sx={{ p: 2 }}>
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Avatar
                                                        sx={{
                                                            bgcolor: guest.attendanceConfirmed ? 'success.main' : 'primary.main',
                                                            width: 48,
                                                            height: 48,
                                                            fontSize: '1.25rem',
                                                            fontWeight: 700,
                                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                                                        }}
                                                    >
                                                        {guestUsers[guest.id]?.name?.charAt(0)?.toUpperCase() ||
                                                         guestUsers[guest.id]?.utorid?.charAt(0)?.toUpperCase() || 'U'}
                                                    </Avatar>

                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography
                                                            variant="subtitle1"
                                                            sx={{
                                                                fontWeight: 600,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {guestUsers[guest.id]?.name || guestUsers[guest.id]?.utorid || `User #${guest.userId}`}
                                                        </Typography>

                                                        {guestUsers[guest.id]?.utorid && (
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                sx={{ display: 'block' }}
                                                            >
                                                                {guestUsers[guest.id].utorid}
                                                            </Typography>
                                                        )}

                                                        <Chip
                                                            size="small"
                                                            label={guest.attendanceConfirmed ? 'Confirmed' : 'Pending'}
                                                            color={guest.attendanceConfirmed ? 'success' : 'warning'}
                                                            sx={{
                                                                height: 22,
                                                                mt: 0.5,
                                                                fontSize: '0.7rem',
                                                                fontWeight: 600
                                                            }}
                                                        />
                                                    </Box>
                                                </Stack>

                                                {isOrganizerOrManager && (
                                                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<EmojiEvents />}
                                                            onClick={() => {
                                                                setAwardToUtorid(guestUsers[guest.id]?.utorid || '');
                                                                setAwardDialogOpen(true);
                                                            }}
                                                            disabled={hasEnded}
                                                            sx={{
                                                                flex: 1,
                                                                textTransform: 'none',
                                                                borderRadius: '8px',
                                                                fontSize: '0.8rem'
                                                            }}
                                                        >
                                                            Award
                                                        </Button>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleRemoveGuest(guest)}
                                                            disabled={hasEnded || removingGuestId === guest.id}
                                                            sx={{
                                                                border: '1px solid rgba(244, 67, 54, 0.3)',
                                                                borderRadius: '8px',
                                                                '&:hover': {
                                                                    background: 'rgba(244, 67, 54, 0.1)',
                                                                    border: '1px solid rgba(244, 67, 54, 0.5)',
                                                                }
                                                            }}
                                                        >
                                                            {removingGuestId === guest.id ? <CircularProgress size={16} /> : <Delete fontSize="small" />}
                                                        </IconButton>
                                                    </Stack>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Column */}
                <Grid item xs={12} md={4}>
                    {/* Organizers Section - Only visible to organizers/managers */}
                    {!isRegularUser && (
                        <div className="section-card" style={{ marginBottom: 32 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <EmojiEvents /> Organizers
                                </Typography>
                                {isOrganizerOrManager && (
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => setOrganizerDialogOpen(true)}
                                    >
                                        <PersonAdd />
                                    </IconButton>
                                )}
                            </Stack>
                            <Divider sx={{ mb: 2 }} />

                            {!event.organizers || event.organizers.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                    No organizers assigned
                                </Typography>
                            ) : (
                                <List dense>
                                    {event.organizers.map((organizer, index) => (
                                        <React.Fragment key={organizer.id}>
                                            <ListItem>
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                                                        {organizer.utorid?.charAt(0) || 'O'}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={organizer.utorid || `User #${organizer.userId}`}
                                                    primaryTypographyProps={{ variant: 'body2' }}
                                                />
                                                {isOrganizerOrManager && (
                                                    <ListItemSecondaryAction>
                                                        <IconButton
                                                            size="small"
                                                            edge="end"
                                                            color="error"
                                                            onClick={() => handleRemoveOrganizer(organizer.userId)}
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </ListItemSecondaryAction>
                                                )}
                                            </ListItem>
                                            {index < event.organizers.length - 1 && <Divider variant="inset" component="li" />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            )}
                        </div>
                    )}

                    {/* Management Actions */}
                    {isOrganizerOrManager && (
                        <div className="section-card">
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Stars /> Management Actions
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Stack spacing={2}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<EmojiEvents />}
                                    onClick={() => {
                                        setAwardToUtorid('');
                                        setAwardDialogOpen(true);
                                    }}
                                >
                                    Award Points to All
                                </Button>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<Edit />}
                                    onClick={handleEdit}
                                >
                                    Edit Event Details
                                </Button>
                            </Stack>
                        </div>
                    )}
                </Grid>
            </Grid>

            {/* Add Guest Dialog */}
            <Dialog open={guestDialogOpen} onClose={() => setGuestDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.3rem' }}>
                    Add Guest to Event
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Enter the UTORid of the person you want to add as a guest to this event.
                    </Typography>
                    <TextField
                        label="UTORid"
                        placeholder="e.g., john_doe"
                        value={guestUtorid}
                        onChange={(e) => setGuestUtorid(e.target.value)}
                        fullWidth
                        autoFocus
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setGuestDialogOpen(false)} variant="outlined">
                        Cancel
                    </Button>
                    <Button onClick={handleAddGuest} variant="contained" disabled={!guestUtorid}>
                        Add Guest
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Organizer Dialog */}
            <Dialog open={organizerDialogOpen} onClose={() => setOrganizerDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.3rem' }}>
                    Add Event Organizer
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Enter the UTORid of the person you want to add as an organizer for this event.
                    </Typography>
                    <TextField
                        label="UTORid"
                        placeholder="e.g., jane_smith"
                        value={organizerUtorid}
                        onChange={(e) => setOrganizerUtorid(e.target.value)}
                        fullWidth
                        autoFocus
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOrganizerDialogOpen(false)} variant="outlined">
                        Cancel
                    </Button>
                    <Button onClick={handleAddOrganizer} variant="contained" disabled={!organizerUtorid}>
                        Add Organizer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Award Points Dialog */}
            <Dialog open={awardDialogOpen} onClose={() => setAwardDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.3rem' }}>
                    Award Points to Guest
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Stack spacing={3}>
                        <Typography variant="body2" color="text.secondary">
                            Award points to a guest who attended this event. The guest must be on the attendee list.
                        </Typography>
                        <TextField
                            label="Recipient UTORid"
                            placeholder="Enter guest's UTORid"
                            value={awardToUtorid}
                            onChange={(e) => setAwardToUtorid(e.target.value)}
                            fullWidth
                            required
                            helperText="Must be a guest on the attendee list"
                        />
                        <TextField
                            label="Points Amount"
                            type="number"
                            placeholder="e.g., 50"
                            value={awardAmount}
                            onChange={(e) => setAwardAmount(e.target.value)}
                            fullWidth
                            required
                            inputProps={{ min: 1 }}
                            helperText="Enter the number of points to award"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button
                        onClick={() => {
                            setAwardDialogOpen(false);
                            setAwardAmount('');
                            setAwardToUtorid('');
                        }}
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => awardToUtorid ? handleAwardToGuest(awardToUtorid) : handleAward()}
                        variant="contained"
                        disabled={!awardAmount || Number(awardAmount) <= 0}
                    >
                        Award Points
                    </Button>
                </DialogActions>
            </Dialog>
        </PageShell>
    );
};

export default Event;
