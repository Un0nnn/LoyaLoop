// New file: QR viewer component that shows QR codes for user or redemption payloads
import React from 'react';
import { Card, CardContent, Typography, Box, Button, TextField, Stack } from '@mui/material';
import { useNotification } from '../context/notification';
import { ContentCopy, OpenInNew } from '@mui/icons-material';

const QRViewer = ({ type = 'user', payload = '', size = 220 }) => {
    // payload should be a short string identifying the user or redemption
    const displayPayload = payload || (type === 'user' ? 'user:unknown' : 'redemption:unknown');
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(displayPayload)}`;
    const { showMessage } = useNotification();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(displayPayload);
            showMessage('Copied QR payload to clipboard', 'success');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Card sx={{
            display: 'inline-block',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'none'
        }}>
            <CardContent sx={{
                textAlign: 'center',
                p: 3
            }}>
                <Typography
                    variant="subtitle1"
                    sx={{
                        mb: 2,
                        fontWeight: 700,
                        color: '#fff',
                        fontSize: '1rem'
                    }}
                >
                    {type === 'user' ? 'My QR Code' : 'Redemption QR Code'}
                </Typography>

                <Box sx={{
                    background: '#fff',
                    borderRadius: '12px',
                    p: 2,
                    mb: 2,
                    display: 'inline-block'
                }}>
                    <Box
                        component="img"
                        src={qrUrl}
                        alt="QR code"
                        sx={{
                            width: size,
                            height: size,
                            display: 'block'
                        }}
                    />
                </Box>

                <TextField
                    size="small"
                    fullWidth
                    value={displayPayload}
                    InputProps={{ readOnly: true }}
                    sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                            fontSize: '0.85rem',
                            fontFamily: 'monospace'
                        }
                    }}
                />

                <Stack direction="row" spacing={1} justifyContent="center">
                    <Button
                        variant="outlined"
                        onClick={handleCopy}
                        startIcon={<ContentCopy sx={{ fontSize: 16 }} />}
                        sx={{
                            textTransform: 'none',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontSize: '0.85rem',
                            '&:hover': {
                                borderColor: 'rgba(124, 58, 237, 0.5)',
                                background: 'rgba(124, 58, 237, 0.08)'
                            }
                        }}
                    >
                        Copy
                    </Button>
                    <Button
                        variant="contained"
                        href={qrUrl}
                        target="_blank"
                        rel="noreferrer"
                        endIcon={<OpenInNew sx={{ fontSize: 16 }} />}
                        sx={{
                            textTransform: 'none',
                            background: 'rgba(124, 58, 237, 0.9)',
                            fontSize: '0.85rem',
                            '&:hover': {
                                background: 'rgba(124, 58, 237, 1)'
                            }
                        }}
                    >
                        Open
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default QRViewer;
