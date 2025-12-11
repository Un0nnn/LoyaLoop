import React from 'react';
import PageShell from '../../components/PageShell.comp';
import { Typography, Grid, Paper, TextField, MenuItem, Chip, Stack } from '@mui/material';

const Transactions = () => {
// ...existing data setup...
    return (
        <PageShell title="Transactions" subtitle="Full ledger with filters and quick insights.">
            <div className="section-card section-card--glow">
                <Stack direction={{xs:'column', md:'row'}} spacing={2}>
                    <TextField label="Search" placeholder="Amount, peer" fullWidth variant="outlined" />
                    <TextField select label="Type" defaultValue="all" fullWidth>
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="Purchase">Purchase</MenuItem>
                        <MenuItem value="Redemption">Redemption</MenuItem>
                        <MenuItem value="Transfer">Transfer</MenuItem>
                    </TextField>
                    <TextField select label="Order by" defaultValue="recent" fullWidth>
                        <MenuItem value="recent">Most recent</MenuItem>
                        <MenuItem value="points">Points</MenuItem>
                    </TextField>
                </Stack>
            </div>

            <Grid container spacing={2} sx={{mt:2}}>
                {tx.map(t => (
                    <Grid item xs={12} md={6} key={t.id}>
                        <div className="section-card">
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <div>
                                    <Typography variant="h6">{t.peer}</Typography>
                                    <Typography color="text.secondary">{t.date}</Typography>
                                </div>
                                <Chip label={t.type} color={typeColor(t.type)} />
                            </Stack>
                            <Typography sx={{mt:1}}>Points: <strong>{t.points>0?`+${t.points}`:t.points}</strong></Typography>
                            <Typography variant="body2" color="text.secondary">Amount: ${t.amount}</Typography>
                        </div>
                    </Grid>
                ))}
            </Grid>
        </PageShell>
    );
};

export default Transactions;

