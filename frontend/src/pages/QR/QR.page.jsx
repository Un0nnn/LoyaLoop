import React from 'react';
import { useSearchParams } from 'react-router-dom';
import QRViewer from '../../components/QRViewer.comp';
import { Typography } from '@mui/material';
import { useAuth } from '../../context/auth';
import PageShell from '../../components/PageShell.comp';

const QR = () => {
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') || 'user'; // 'user' or 'redemption'
    const id = searchParams.get('id') || null;
    const { currentUser } = useAuth();

    // Build payload based on mode
    let payload = '';
    if (mode === 'user') {
        // prefer provided id, else use current user
        payload = id ? `user:${id}` : (currentUser ? `user:${currentUser.utorid || currentUser.id || 'unknown'}` : 'user:unknown');
    } else {
        payload = id ? `redemption:${id}` : 'redemption:unknown';
    }

    return (
        <PageShell title={mode === 'user' ? 'My QR code' : 'Redemption QR'} subtitle={mode === 'user' ? 'Share this code to initiate transactions.' : 'Show this code to complete redemption.'}>
            <div className="glass-panel centered-panel" style={{textAlign:'center'}}>
                <Typography variant="body2" color="text.secondary" sx={{mb:2}}>Payload: {payload}</Typography>
                <QRViewer type={mode} payload={payload} />
            </div>
        </PageShell>
    );
}

export default QR;
