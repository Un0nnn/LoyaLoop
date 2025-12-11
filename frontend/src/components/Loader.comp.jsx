import React from 'react';
import { Box, CircularProgress } from '@mui/material';

const Loader = (props) => {
    const { loading } = props;

    if (!loading) return null;

    return (
        <Box sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            zIndex: 10000
        }}>
            <Box sx={{
                background: 'linear-gradient(180deg, #0c101c, #181c28)',
                borderRadius: '14px',
                padding: 4,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 20px 45px rgba(6, 10, 20, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
            }}>
                <CircularProgress
                    size={48}
                    thickness={4}
                    sx={{
                        color: '#7C3AED',
                        '& .MuiCircularProgress-circle': {
                            strokeLinecap: 'round'
                        }
                    }}
                />
            </Box>
        </Box>
    );
};

export default Loader;