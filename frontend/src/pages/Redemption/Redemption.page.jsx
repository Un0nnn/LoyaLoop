import React, { useState } from 'react';
import { Typography, TextField, Button, List, ListItem, ListItemText, Stack } from '@mui/material';
import PageShell from '../../components/PageShell.comp';
import QRViewer from '../../components/QRViewer.comp';
import { useAuth } from '../../context/auth';
import transactionService from '../../services/transaction.service';
import { useNotification } from '../../context/notification';

const Redemption = () => {
    const { currentUser } = useAuth();

    // sample available redemptions
    const items = [
        {id:1, name:'Mug', points: 50},
        {id:2, name:'T-Shirt', points: 150},
        {id:3, name:'Water Bottle', points: 30},
        {id:4, name:'Notebook', points: 25},
    ];

    const [selected, setSelected] = useState(null);
    const [reason, setReason] = useState('');
    const { showMessage } = useNotification();

    const handleRequest = (item) => setSelected(item);

    const handleSubmit = async () => {
        if (!selected) { showMessage('Select an item first', 'warning'); return; }

        // Check if user has enough points
        const userPoints = currentUser?.points ?? 0;
        if (userPoints < selected.points) {
            showMessage(`Insufficient points. You need ${selected.points} points but have ${userPoints}`, 'error');
            return;
        }

        try {
            // Pass the points amount, not the item ID
            await transactionService.createRedemption('redemption', selected.points, reason || `Redeem ${selected.name}`);
            showMessage('Redemption requested successfully', 'success');
            setSelected(null);
            setReason('');
        } catch (err) {
            console.error(err);
            const errorMsg = err?.response?.data?.error || err?.message || err?.toString();
            showMessage('Failed to request redemption: ' + errorMsg, 'error');
        }
    };

    return (
        <PageShell title="Redemptions" subtitle="Request items and track pending QR codes.">
            <div className="card-grid">
                <div className="glass-panel">
                    <Typography variant="h6">Request a redemption</Typography>
                    <Typography color="text.secondary" sx={{mb:2}}>Available points: {currentUser?.points ?? 0}</Typography>
                    <List className="list-timeline">
                        {items.map(item => (
                            <ListItem
                                key={item.id}
                                className="list-timeline__item"
                                secondaryAction={
                                    <Button
                                        variant="outlined"
                                        onClick={() => handleRequest(item)}
                                        disabled={selected?.id === item.id}
                                    >
                                        {selected?.id === item.id ? 'Selected' : 'Select'}
                                    </Button>
                                }
                            >
                                <ListItemText
                                    primary={item.name}
                                    secondary={`${item.points} points`}
                                />
                            </ListItem>
                        ))}
                    </List>
                    <Stack direction={{xs:'column', sm:'row'}} spacing={2} sx={{mt:2}}>
                        <TextField
                            label="Remark (optional)"
                            fullWidth
                            value={reason}
                            onChange={(e)=>setReason(e.target.value)}
                            placeholder={selected ? `Redeem ${selected.name}` : 'Add a remark'}
                        />
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={!selected}
                        >
                            Submit Request
                        </Button>
                    </Stack>
                    {selected && (
                        <Typography variant="body2" color="primary" sx={{mt:2, fontWeight:600}}>
                            Selected: {selected.name} ({selected.points} points)
                        </Typography>
                    )}
                </div>
                <div className="glass-panel glass-panel--accent">
                    <Typography variant="h6">Pending redemption QR</Typography>
                    <Typography color="text.secondary">Display this at pickup.</Typography>
                    <div style={{marginTop:24, display:'flex', justifyContent:'center'}}>
                        <div style={{width:220}}>
                            <QRViewer type="redemption" payload={selected ? `redemption:${selected.id}` : "redemption:demo"} />
                        </div>
                    </div>
                </div>
            </div>
        </PageShell>
    );
}

export default Redemption;
