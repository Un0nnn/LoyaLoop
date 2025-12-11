import React, { useEffect, useState, useCallback } from 'react';
import PageShell from '../../components/PageShell.comp';
import { TextField, Button, Stack } from '@mui/material';
import eventService from '../../services/event.service';
import { useNotification } from '../../context/notification';
import { useNavigate, useParams } from 'react-router-dom';

const EventEdit = () => {
    const { eventId } = useParams();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [capacity, setCapacity] = useState('');
    const [points, setPoints] = useState('');
    const [loading, setLoading] = useState(false);
    const { showMessage } = useNotification();
    const navigate = useNavigate();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const resp = await eventService.getEventById(eventId);
            setName(resp.name || '');
            setDescription(resp.description || '');
            setLocation(resp.location || '');
            setStartTime(resp.startTime ? new Date(resp.startTime).toISOString().slice(0,16) : '');
            setEndTime(resp.endTime ? new Date(resp.endTime).toISOString().slice(0,16) : '');
            setCapacity(resp.capacity ?? '');
            setPoints(resp.pointsRemain ?? resp.pointsAwarded ?? '');
        } catch (err) {
            console.error(err);
            showMessage('Failed to load event', 'error');
        } finally { setLoading(false); }
    }, [eventId, showMessage]);

    useEffect(() => { if (eventId) load(); }, [eventId, load]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await eventService.updateEvent(eventId, name, description, location, startTime || undefined, endTime || undefined, capacity === '' ? null : Number(capacity), points === '' ? null : Number(points));
            showMessage('Event updated', 'success');
            navigate(`/events/${eventId}`);
        } catch (err) {
            console.error(err);
            showMessage('Failed to update event: ' + (err?.message || err?.toString()), 'error');
        } finally { setLoading(false); }
    };

    return (
        <PageShell title="Edit event" subtitle="Update event details.">
            <div className="section-card centered-panel">
                <Stack spacing={2} sx={{width:'100%'}}>
                    <TextField label="Name" value={name} onChange={e=>setName(e.target.value)} fullWidth />
                    <TextField label="Description" value={description} onChange={e=>setDescription(e.target.value)} fullWidth multiline minRows={3} />
                    <TextField label="Location" value={location} onChange={e=>setLocation(e.target.value)} fullWidth />
                    <TextField label="Start time" type="datetime-local" InputLabelProps={{shrink:true}} value={startTime} onChange={e=>setStartTime(e.target.value)} />
                    <TextField label="End time" type="datetime-local" InputLabelProps={{shrink:true}} value={endTime} onChange={e=>setEndTime(e.target.value)} />
                    <TextField label="Capacity" type="number" value={capacity} onChange={e=>setCapacity(e.target.value)} />
                    <TextField label="Points allocated" type="number" value={points} onChange={e=>setPoints(e.target.value)} />
                    <div style={{display:'flex', gap:12}}>
                        <Button variant="contained" onClick={handleSave} disabled={loading}>{loading? 'Saving...': 'Save'}</Button>
                        <Button variant="outlined" onClick={() => navigate(`/events/${eventId}`)}>Cancel</Button>
                    </div>
                </Stack>
            </div>
        </PageShell>
    );
};

export default EventEdit;
