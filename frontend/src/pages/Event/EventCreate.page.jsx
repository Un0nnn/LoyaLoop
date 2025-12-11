import React, { useState } from 'react';
import PageShell from '../../components/PageShell.comp';
import { TextField, Button, Stack, Typography, Alert, Divider, FormHelperText, InputAdornment } from '@mui/material';
import eventService from '../../services/event.service';
import { useNotification } from '../../context/notification';
import { useNavigate } from 'react-router-dom';
import { Event, LocationOn, People, Stars, DateRange, AccessTime } from '@mui/icons-material';

const EventCreate = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [capacity, setCapacity] = useState('');
    const [points, setPoints] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const { showMessage } = useNotification();
    const navigate = useNavigate();

    const validateForm = () => {
        const newErrors = {};

        if (!name.trim()) {
            newErrors.name = 'Event name is required';
        }

        if (!description.trim()) {
            newErrors.description = 'Event description is required';
        }

        if (!location.trim()) {
            newErrors.location = 'Location is required';
        }

        if (!startTime) {
            newErrors.startTime = 'Start time is required';
        }

        if (!endTime) {
            newErrors.endTime = 'End time is required';
        }

        if (startTime && endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);
            if (end <= start) {
                newErrors.endTime = 'End time must be after start time';
            }
        }

        if (points && (isNaN(points) || Number(points) < 0)) {
            newErrors.points = 'Points must be a positive number';
        }

        if (capacity && (isNaN(capacity) || Number(capacity) < 1)) {
            newErrors.capacity = 'Capacity must be at least 1';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreate = async () => {
        if (!validateForm()) {
            showMessage('Please fix the form errors', 'warning');
            return;
        }

        setLoading(true);
        try {
            const resp = await eventService.createEvent(
                name.trim(),
                description.trim(),
                location.trim(),
                startTime,
                endTime,
                capacity ? Number(capacity) : null,
                points ? Number(points) : 0
            );
            showMessage('Event created successfully!', 'success');
            navigate(`/events/${resp.id || resp.data?.id}`);
        } catch (err) {
            console.error(err);
            const errorMsg = err?.response?.data?.error || err?.message || 'Failed to create event';
            showMessage(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/manager/events');
    };

    return (
        <PageShell title="Create Event" subtitle="Create a new event and start engaging your community.">
            <div className="section-card">
                <Stack spacing={3}>
                    {/* Basic Information Section */}
                    <div>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Event /> Event Information
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        <Stack spacing={3}>
                            <TextField
                                label="Event Name"
                                placeholder="e.g., Annual Tech Conference 2025"
                                value={name}
                                onChange={e => {
                                    setName(e.target.value);
                                    if (errors.name) setErrors({...errors, name: ''});
                                }}
                                fullWidth
                                required
                                error={!!errors.name}
                                helperText={errors.name || 'Give your event a clear, descriptive name'}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Event />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                label="Description"
                                placeholder="Describe your event in detail..."
                                value={description}
                                onChange={e => {
                                    setDescription(e.target.value);
                                    if (errors.description) setErrors({...errors, description: ''});
                                }}
                                fullWidth
                                required
                                multiline
                                minRows={4}
                                error={!!errors.description}
                                helperText={errors.description || 'Provide a detailed description of what attendees can expect'}
                            />

                            <TextField
                                label="Location"
                                placeholder="e.g., Main Campus Auditorium, Room 201"
                                value={location}
                                onChange={e => {
                                    setLocation(e.target.value);
                                    if (errors.location) setErrors({...errors, location: ''});
                                }}
                                fullWidth
                                required
                                error={!!errors.location}
                                helperText={errors.location || 'Specify the venue or meeting location'}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LocationOn />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Stack>
                    </div>

                    {/* Date & Time Section */}
                    <div>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <DateRange /> Date & Time
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                            <TextField
                                label="Start Time"
                                type="datetime-local"
                                InputLabelProps={{ shrink: true }}
                                value={startTime}
                                onChange={e => {
                                    setStartTime(e.target.value);
                                    if (errors.startTime) setErrors({...errors, startTime: ''});
                                }}
                                fullWidth
                                required
                                error={!!errors.startTime}
                                helperText={errors.startTime || 'When does the event begin?'}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <AccessTime />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                label="End Time"
                                type="datetime-local"
                                InputLabelProps={{ shrink: true }}
                                value={endTime}
                                onChange={e => {
                                    setEndTime(e.target.value);
                                    if (errors.endTime) setErrors({...errors, endTime: ''});
                                }}
                                fullWidth
                                required
                                error={!!errors.endTime}
                                helperText={errors.endTime || 'When does the event end?'}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <AccessTime />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Stack>
                    </div>

                    {/* Capacity & Rewards Section */}
                    <div>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <People /> Capacity & Rewards
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                            <TextField
                                label="Capacity (Optional)"
                                type="number"
                                placeholder="e.g., 100"
                                value={capacity}
                                onChange={e => {
                                    setCapacity(e.target.value);
                                    if (errors.capacity) setErrors({...errors, capacity: ''});
                                }}
                                fullWidth
                                error={!!errors.capacity}
                                helperText={errors.capacity || 'Maximum number of attendees (leave empty for unlimited)'}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <People />
                                        </InputAdornment>
                                    ),
                                }}
                                inputProps={{ min: 1 }}
                            />

                            <TextField
                                label="Points Reward"
                                type="number"
                                placeholder="e.g., 50"
                                value={points}
                                onChange={e => {
                                    setPoints(e.target.value);
                                    if (errors.points) setErrors({...errors, points: ''});
                                }}
                                fullWidth
                                error={!!errors.points}
                                helperText={errors.points || 'Points awarded to attendees (default: 0)'}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Stars />
                                        </InputAdornment>
                                    ),
                                }}
                                inputProps={{ min: 0 }}
                            />
                        </Stack>

                        <FormHelperText sx={{ mt: 2, ml: 2 }}>
                            Tip: Set a capacity to limit registrations and points to reward participation
                        </FormHelperText>
                    </div>

                    {/* Summary Alert */}
                    {name && startTime && endTime && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            <Typography variant="body2">
                                <strong>Event Summary:</strong> {name} will take place {location && `at ${location} `}
                                from {new Date(startTime).toLocaleString()} to {new Date(endTime).toLocaleString()}
                                {capacity && ` with a capacity of ${capacity} attendees`}
                                {points && ` rewarding ${points} points`}.
                            </Typography>
                        </Alert>
                    )}

                    {/* Action Buttons */}
                    <Divider sx={{ my: 2 }} />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end">
                        <Button
                            variant="outlined"
                            onClick={handleCancel}
                            disabled={loading}
                            size="large"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleCreate}
                            disabled={loading}
                            size="large"
                        >
                            {loading ? 'Creating Event...' : 'Create Event'}
                        </Button>
                    </Stack>
                </Stack>
            </div>
        </PageShell>
    );
};

export default EventCreate;
