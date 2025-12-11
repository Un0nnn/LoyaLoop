import React, {useEffect, useState} from 'react';
import { Stack, TextField, Button, Typography } from '@mui/material';
import PageShell from '../../components/PageShell.comp';
import transactionService from '../../services/transaction.service';
import { useNotification } from '../../context/notification';
import promotionService from "../../services/promotion.service";

const CashierCreate = () => {
    const [utorid, setUtorid] = useState('');
    const [amount, setAmount] = useState(0);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [promotion, setPromotion] = useState('');
    const [promos, setPromos] = useState([]);
    const [selectedPromo, setSelectedPromo] = useState(null);
    const [updatedAmount, setUpdatedAmount] = useState(0);
    const { showMessage } = useNotification();

    useEffect(() => {
        const loadPromos = async () => {
            try {
                const resp = await promotionService.getPromotions();
                const list = Array.isArray(resp) ? resp : (resp?.results || resp?.data?.promotions || resp?.data || []);
                setPromos(list);
                console.log(list)
            } catch (err) {
                console.error(err);
                showMessage('Failed to load promotions', 'error');
            }
        };
        loadPromos();
    }, []);

    useEffect(() => {
        if (promotion && amount) {
            const found = promos.find(item => item.name === promotion)
            if (found) {
                setSelectedPromo(found);
                if (found.rate && found.minSpending) {
                    console.log(found.minSpending, found.rate)
                    if (amount >= found.minSpending) {
                        console.log(found.minSpending)
                        const discount = amount * (found.rate / 100);
                        console.log(discount)
                        setUpdatedAmount(amount - discount);
                    }
                    else {
                        showMessage(`This promotion requires minimum spending of ${found.minSpending}`)
                    }
                }
                else if (found.rate) {
                    console.log(found.rate)
                    const discount = amount * (found.rate / 100);
                    console.log(discount)
                    setUpdatedAmount(amount - discount);
                }
                else {
                    setUpdatedAmount(amount);
                }
            }
            else {
                setUpdatedAmount(amount);
                setSelectedPromo(null);
            }
        }
        else {
            setUpdatedAmount(amount);
            setSelectedPromo(null);
        }
    }, [promotion, amount, promos]);

    const handleSubmit = async () => {
        if (!utorid || !amount) {
            showMessage('Please provide customer UTORid and amount', 'warning');
            return;
        }
        let promotionIds = [];
        if (promotion) {
            const found = promos.find(item => item.name === promotion)
            if (!found) {
                showMessage("Please provide valid promotion code");
                return;
            }
            else {
                promotionIds.push(found.id);
            }
        }
        setLoading(true);
        try {
            // create a 'purchase' transaction: spent is the money amount; backend will calculate points
            await transactionService.createTransaction(utorid, 'purchase', parseFloat(updatedAmount), undefined, null, notes, promotionIds);
            showMessage('Transaction submitted', 'success');
            setUtorid('');
            setAmount(0);
            setNotes('');
            setPromotion(null);
            setSelectedPromo(null);
            setUpdatedAmount(0);
        } catch (err) {
            console.error(err);
            showMessage('Failed to submit transaction: ' + (err?.message || err?.toString()), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageShell title="Create transaction" subtitle="Issue a new points transaction for a member.">
            <div className="glass-panel centered-panel">
                <Typography variant="body2" color="text.secondary">Fill out the member and transaction details below.</Typography>
                <Stack spacing={2} className="form-panel">
                    <TextField label="Customer UTORid" fullWidth required value={utorid} onChange={(e) => setUtorid(e.target.value)} />
                    <TextField label="Amount" type="number" fullWidth required value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <TextField label="Promotion" type="string" fullWidth value={promotion} onChange={(e) => setPromotion(e.target.value)} />
                    { selectedPromo && updatedAmount !== null && (
                        <Stack >
                            <Typography>Promotion applied: {selectedPromo.name}</Typography>
                            <Typography>New amount: {updatedAmount}</Typography>
                            <Typography>New points: {selectedPromo.points} </Typography>
                        </Stack>
                    )
                    }
                    <TextField label="Notes" fullWidth multiline rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                    <Button variant="contained" size="large" sx={{alignSelf:'flex-start'}} onClick={handleSubmit} disabled={loading}>{loading ? 'Submitting...' : 'Submit transaction'}</Button>
                </Stack>
            </div>
        </PageShell>
    )
}

export default CashierCreate;
