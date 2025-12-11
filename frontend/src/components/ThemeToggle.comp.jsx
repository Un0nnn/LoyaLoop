import { LightModeOutlined, DarkModeOutlined } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import React from 'react';
import { useThemeMode } from '../context/themeMode';

const ThemeToggle = () => {
    const { mode, toggleMode } = useThemeMode();

    return (
        <div className="theme-toggle">
            <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                <IconButton size="small" onClick={toggleMode} aria-label="Toggle theme">
                    {mode === 'dark' ? <LightModeOutlined fontSize="small" /> : <DarkModeOutlined fontSize="small" />}
                </IconButton>
            </Tooltip>
        </div>
    );
};

export default ThemeToggle;

