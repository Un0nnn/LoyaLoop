import React, { useEffect, useState } from 'react';
import PageShell from '../../components/PageShell.comp';
import { Typography, Button, Stack, Chip, Divider } from '@mui/material';
import eventService from '../../services/event.service';
import { useNotification } from '../../context/notification';
import { useNavigate } from 'react-router-dom';
import { Add, Refresh, Event as EventIcon, Edit, Visibility, People } from '@mui/icons-material';

const ManagerEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const { showMessage } = useNotification();
    const navigate = useNavigate();

    const load = async () => {
        setLoading(true);
        try {
            const resp = await eventService.getEvents();
            const list = Array.isArray(resp) ? resp : (resp?.results || resp?.data || []);
            setEvents(list);
        } catch (err) {
            console.error(err);
            showMessage('Failed to load events', 'error');
        } finally { setLoading(false); }
    };

    useEffect(()=>{ load(); }, []);

    const handleCreateNew = () => navigate('/events/create');
    const handleView = (id) => navigate(`/events/${id}`);
    const handleEdit = (id) => navigate(`/events/${id}/edit`);

    return(
        <PageShell title="Events Management" subtitle="Create and manage program events.">
            {/* Action Bar */}
            <div className="section-card section-card--glow" style={{marginBottom:24}}>
                <Stack direction={{xs:'column', md:'row'}} spacing={2} alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EventIcon /> Event Management
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={load}
                            disabled={loading}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handleCreateNew}
                            size="large"
                        >
                            Create New Event
                        </Button>
                    </Stack>
                </Stack>
            </div>

            {/* Events Grid */}
            <div className="section-grid">
                {loading && events.length === 0 ? (
                    <div className="section-card">
                        <Typography variant="body2" color="text.secondary">
                            Loading events...
                        </Typography>
                    </div>
                ) : events.length === 0 ? (
                    <div className="section-card" style={{gridColumn: '1 / -1', textAlign: 'center', padding: '48px'}}>
                        <EventIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>No events yet</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{mb: 3}}>
                            Create your first event to start engaging your community
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handleCreateNew}
                        >
                            Create Your First Event
                        </Button>
                    </div>
                ) : (
                    events.map(e=> (
                        <div key={e.id} className="section-card">
                            <Stack spacing={2}>
                                <div style={{display:'flex', justifyContent:'space-between', alignItems: 'start'}}>
                                    <div style={{flex: 1}}>
                                        <Typography variant="h6" gutterBottom>
                                            {e.name || e.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{mb: 1}}>
                                            {e.location && `📍 ${e.location}`}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {e.startTime && `🗓️ ${new Date(e.startTime).toLocaleDateString()}`}
                                            {e.startTime && ` at ${new Date(e.startTime).toLocaleTimeString()}`}
                                        </Typography>
                                    </div>
                                    <Chip
                                        icon={<People />}
                                        label={`${e.numGuests ?? 0} attendees`}
                                        size="small"
                                    />
                                </div>

                                {e.description && (
                                    <>
                                        <Divider />
                                        <Typography variant="body2" color="text.secondary" sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                        }}>
                                            {e.description}
                                        </Typography>
                                    </>
                                )}

                                <Divider />
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        size="small"
                                        startIcon={<Visibility />}
                                        onClick={() => handleView(e.id)}
                                    >
                                        View
                                    </Button>
                                    <Button
                                        size="small"
                                        startIcon={<Edit />}
                                        onClick={() => handleEdit(e.id)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        size="small"
                                        startIcon={<People />}
                                        onClick={() => handleView(e.id)}
                                    >
                                        Guests
                                    </Button>
                                </Stack>
                            </Stack>
                        </div>
                    ))
                )}
            </div>
        </PageShell>
    )
}

export default ManagerEvents;
