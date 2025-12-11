import React from "react";
import PropTypes from 'prop-types';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

const ConfirmDialog = ({ open, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, loading = false }) => (
    <Dialog
        open={open}
        onClose={loading ? undefined : onCancel}
        fullWidth
        maxWidth="xs"
        PaperProps={{
            sx: {
                background: 'linear-gradient(180deg, #0c101c, #181c28)',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)'
            }
        }}
    >
        {title && (
            <DialogTitle sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                color: '#fff',
                pb: 1
            }}>
                {title}
            </DialogTitle>
        )}
        {message && (
            <DialogContent>
                <DialogContentText sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.9rem',
                    lineHeight: 1.6
                }}>
                    {message}
                </DialogContentText>
            </DialogContent>
        )}
        <DialogActions sx={{ p: 2.5, pt: 1, gap: 1 }}>
            <Button
                onClick={onCancel}
                disabled={loading}
                sx={{
                    textTransform: 'none',
                    color: 'rgba(255, 255, 255, 0.9)',
                    '&:hover': {
                        background: 'rgba(255, 255, 255, 0.05)'
                    }
                }}
            >
                {cancelText}
            </Button>
            <Button
                variant="contained"
                onClick={onConfirm}
                disabled={loading}
                sx={{
                    textTransform: 'none',
                    background: 'rgba(239, 68, 68, 0.9)',
                    '&:hover': {
                        background: 'rgba(239, 68, 68, 1)'
                    }
                }}
            >
                {loading ? 'Working…' : confirmText}
            </Button>
        </DialogActions>
    </Dialog>
);

ConfirmDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    title: PropTypes.string,
    message: PropTypes.string,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    loading: PropTypes.bool,
};

export default ConfirmDialog;
