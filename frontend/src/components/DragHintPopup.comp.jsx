import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Fade, Paper, Button, Stack } from '@mui/material';
import { Close, DragIndicator, KeyboardAlt } from '@mui/icons-material';

const DragHintPopup = () => {
    const [show, setShow] = useState(false);
    const HINT_STORAGE_KEY = 'dragHintDismissed';

    useEffect(() => {
        // Check if user has seen this hint before
        const dismissed = localStorage.getItem(HINT_STORAGE_KEY);

        if (!dismissed) {
            // Show hint after 1 second delay
            const timer = setTimeout(() => {
                setShow(true);
            }, 1000);

            return () => {
                clearTimeout(timer);
            };
        }
    }, []);

    const handleClose = () => {
        setShow(false);
    };

    const handleDontShowAgain = () => {
        setShow(false);
        // Save dismissal after fade completes
        setTimeout(() => {
            localStorage.setItem(HINT_STORAGE_KEY, 'true');
        }, 500);
    };

    if (!show && localStorage.getItem(HINT_STORAGE_KEY)) {
        return null;
    }

    return (
        <Fade in={show} timeout={500}>
            <Paper
                elevation={8}
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    width: 320,
                    maxWidth: 'calc(100vw - 48px)',
                    background: 'linear-gradient(180deg, #0c101c, #181c28)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 20px 45px rgba(6, 10, 20, 0.5)',
                    zIndex: 9999,
                    overflow: 'hidden'
                }}
            >
                <Box sx={{ position: 'relative', zIndex: 1, p: 2 }}>
                    {/* Close button */}
                    <IconButton
                        size="small"
                        onClick={handleClose}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&:hover': {
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: '#fff'
                            }
                        }}
                    >
                        <Close fontSize="small" />
                    </IconButton>

                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, pr: 3 }}>
                        <Box sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            background: 'rgba(124, 58, 237, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(124, 58, 237, 0.3)'
                        }}>
                            <DragIndicator sx={{ fontSize: 20, color: '#7C3AED' }} />
                        </Box>
                        <Box>
                            <Typography sx={{
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                color: '#fff',
                                lineHeight: 1.2
                            }}>
                                Draggable Components
                            </Typography>
                            <Typography sx={{
                                fontSize: '0.7rem',
                                color: 'rgba(255, 255, 255, 0.6)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                fontWeight: 600
                            }}>
                                Pro Tip
                            </Typography>
                        </Box>
                    </Box>

                    {/* Content */}
                    <Typography sx={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '0.85rem',
                        lineHeight: 1.5,
                        mb: 1.5
                    }}>
                        Reposition Sidebar and User Info anywhere on screen
                    </Typography>

                    {/* Instructions */}
                    <Box sx={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        borderRadius: '10px',
                        p: 1.5,
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Box sx={{
                                minWidth: 28,
                                height: 24,
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                color: '#fff',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                fontFamily: 'monospace'
                            }}>
                                Alt
                            </Box>
                            <Typography sx={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: 'rgba(255, 255, 255, 0.9)'
                            }}>
                                Hold Alt key
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                                minWidth: 28,
                                height: 24,
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid rgba(255, 255, 255, 0.15)'
                            }}>
                                <KeyboardAlt sx={{ fontSize: 14, color: '#fff' }} />
                            </Box>
                            <Typography sx={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: 'rgba(255, 255, 255, 0.9)'
                            }}>
                                Click & drag to move
                            </Typography>
                        </Box>
                    </Box>

                    {/* Action buttons */}
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            fullWidth
                            onClick={handleClose}
                            sx={{
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                color: 'rgba(255, 255, 255, 0.9)',
                                textTransform: 'none',
                                fontSize: '0.8rem',
                                '&:hover': {
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                    background: 'rgba(255, 255, 255, 0.05)'
                                }
                            }}
                        >
                            Got it
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            fullWidth
                            onClick={handleDontShowAgain}
                            sx={{
                                background: 'rgba(124, 58, 237, 0.9)',
                                textTransform: 'none',
                                fontSize: '0.8rem',
                                '&:hover': {
                                    background: 'rgba(124, 58, 237, 1)'
                                }
                            }}
                        >
                            Don't show again
                        </Button>
                    </Stack>
                </Box>
            </Paper>
        </Fade>
    );
};

export default DragHintPopup;

