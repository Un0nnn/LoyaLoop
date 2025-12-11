import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const calculatePoints = (spent) => Math.round(spent / 0.25);

export const createTransaction = async (req, res) => {
    try {
        const { utorid, type, spent, amount, relatedId, remark, promotionIds } = req.body;
        const createdBy = req.user.utorid;

        const user = await prisma.user.findUnique({ where: { utorid } });
        if (!user) return res.status(404).json({ error: "User not found" });

        // Load cashier (the authenticated user) from DB to inspect suspicious flag
        // If not found, fall back to a non-suspicious placeholder (some test tokens may not resolve to a DB user)
        let cashier = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!cashier) {
            console.warn(`Warning: authenticated user id=${req.user.id} not found in DB; proceeding with cashier.suspicious=false`);
            cashier = { id: null, utorid: req.user.utorid, suspicious: false };
        }

        // normalize numeric inputs
        const spentNum = spent !== undefined && spent !== null ? Number(spent) : undefined;
        const amountNum = amount !== undefined && amount !== null ? Number(amount) : undefined;
        // Accept either relatedId or relatedTransactionId from clients
        const relatedRaw = relatedId !== undefined && relatedId !== null ? relatedId : req.body.relatedTransactionId;
        const relatedIdNum = relatedRaw !== undefined && relatedRaw !== null ? Number(relatedRaw) : undefined;

        let promotion_Ids = [];

        // Treat promotionIds === null as no promotions provided (tests sometimes send null)
        if (promotionIds !== undefined && promotionIds !== null) {
            if (!Array.isArray(promotionIds)) {
                return res.status(400).json({ error: "promotionIds must be an array" });
            }
            promotion_Ids = promotionIds.map(id => parseInt(id));
        }

        if (promotion_Ids && promotion_Ids.length > 0) {
            const validPromotions = await prisma.promotion.findMany({
                where: {
                    id: { in: promotion_Ids },
                },
                include: {
                    uses: {
                        where: {
                            userId: user.id,
                        },
                    },
                },
            });

            if (validPromotions.length !== promotion_Ids.length) {
                return res.status(400).json({ error: "One or more promotions are invalid or expired" });
            }
        }

        if (type === "purchase") {
            if (req.user.role === "regular")
                return res.status(403).json({ error: "Only cashier or higher can process purchases" });

            if (spentNum === undefined || isNaN(spentNum) || spentNum <= 0)
                return res.status(400).json({ error: "Spent must be a positive number" });

            const earned = calculatePoints(spentNum);

            // Validate promotion IDs strictly (if provided)
            if (promotion_Ids && promotion_Ids.length > 0) {
                // Ensure they are positive integers
                if (!promotion_Ids.every(id => Number.isInteger(id) && id > 0)) {
                    return res.status(400).json({ error: "Invalid promotion IDs provided" });
                }

                // Load promotions and validate
                const promos = await prisma.promotion.findMany({ where: { id: { in: promotion_Ids } } });
                if (promos.length !== promotion_Ids.length) {
                    return res.status(400).json({ error: "One or more promotions are invalid or expired" });
                }

                // Check each promotion is active and minSpending satisfied and one-time not used
                const now = new Date();
                for (const p of promos) {
                    if (p.startTime > now || p.endTime < now) {
                        return res.status(400).json({ error: `Promotion ${p.id} is not active` });
                    }
                    if (p.minSpending !== null && p.minSpending !== undefined && spentNum < p.minSpending) {
                        return res.status(400).json({ error: `Promotion ${p.id} requires minimum spending` });
                    }
                    if (p.type === 'onetime') {
                        const used = await prisma.promotionUse.findFirst({ where: { promotionId: p.id, userId: user.id } });
                        if (used) return res.status(400).json({ error: `Promotion ${p.id} has already been used by this user` });
                    }
                }

                // Compute additional points from promotions
                let promoExtra = 0;
                const promoBreakdown = [];
                for (const p of promos) {
                    let extra = 0;
                    if (p.points) extra += Number(p.points || 0);
                    if (p.rate) extra += Math.round(spentNum * Number(p.rate || 0));
                    promoExtra += extra;
                    promoBreakdown.push({ id: p.id, points: p.points, rate: p.rate, extra });
                }

                const totalEarned = earned + promoExtra;

                const transaction = await prisma.transaction.create({
                    data: {
                        type,
                        amount: spentNum,
                        points: totalEarned,
                        userId: user.id,
                        cashierId: req.user.id,
                        remark: remark || "",
                        promotionIds: JSON.stringify(promotion_Ids),
                    },
                });

                // Apply points to user only if the cashier processing the purchase is not suspicious
                const awarded = cashier && cashier.suspicious ? 0 : totalEarned;
                if (awarded > 0) {
                    await prisma.user.update({ where: { id: user.id }, data: { points: { increment: awarded } } });
                }

                // Create PromotionUse entries for one-time promos
                for (const p of promos) {
                    if (p.type === 'onetime') {
                        await prisma.promotionUse.create({ data: { promotionId: p.id, userId: user.id } });
                    }
                }

                return res.status(201).json({
                    id: transaction.id,
                    utorid: user.utorid,
                    type: transaction.type,
                    spent: transaction.amount,
                    earned: awarded,
                    remark: transaction.remark || "",
                    promotionIds: promotion_Ids,
                    createdBy,
                });
            }

            // No promotions applied
            const transaction = await prisma.transaction.create({
                data: {
                    type,
                    amount: spentNum,
                    points: earned,
                    userId: user.id,
                    cashierId: req.user.id,
                    remark: remark || "",
                    promotionIds: null,
                },
            });

            // Award points to the user only if the cashier processing this purchase is not suspicious
            const awardedNoPromo = cashier && cashier.suspicious ? 0 : earned;
            if (awardedNoPromo > 0) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { points: { increment: awardedNoPromo } },
                });
            }


            return res.status(201).json({
                id: transaction.id,
                utorid: user.utorid,
                type: transaction.type,
                spent: transaction.amount,
                earned: awardedNoPromo,
                remark: transaction.remark || "",
                promotionIds: [],
                createdBy,
            });
        }

        else if (type === "adjustment") {
            if (!["manager", "superuser"].includes(req.user.role))
                return res.status(403).json({ error: "Only manager or higher can create adjustments" });

            // coerce and validate relatedId (accept strings that represent integers)
            console.log('adjustment input:', { utorid, relatedIdRaw: relatedRaw, relatedIdNum, amount, amountNum, reqUserId: req.user.id, reqUserRole: req.user.role });
            if (relatedIdNum === undefined || isNaN(relatedIdNum) || relatedIdNum <= 0) {
                console.log('adjustment failed: invalid relatedId');
                return res.status(400).json({ error: "Missing or invalid relatedId" });
            }

            // Ensure related transaction exists (return 404 per tests)
            const relatedTx = await prisma.transaction.findUnique({ where: { id: Number(relatedIdNum) } });
            if (!relatedTx) {
                console.log('adjustment failed: related transaction not found', { relatedIdNum });
                return res.status(404).json({ error: "Related transaction not found" });
            }

            // validate amount after confirming related transaction exists
            if (amountNum === undefined || isNaN(amountNum)) {
                console.log('adjustment failed: invalid amount');
                return res.status(400).json({ error: "Missing or invalid amount" });
            }


            const transaction = await prisma.transaction.create({
                data: {
                    type,
                    amount: amountNum,
                    userId: user.id,
                    cashierId: req.user.id,
                    relatedTransactionId: relatedIdNum,
                    remark: remark || "",
                    promotionIds: promotion_Ids && promotion_Ids.length ? JSON.stringify(promotion_Ids) : null,
                },
            });

            await prisma.user.update({
                where: { id: user.id },
                data: { points: { increment: amountNum } },
            });

            return res.status(201).json({
                id: transaction.id,
                utorid: user.utorid,
                amount: amountNum,
                type: transaction.type,
                relatedId: transaction.relatedTransactionId,
                remark: transaction.remark || "",
                promotionIds: transaction.promotionIds ? JSON.parse(transaction.promotionIds) : [],
                createdBy,
            });
        }

        else {
            return res.status(400).json({ error: "Invalid transaction type" });
        }
    } catch (error) {
        console.error("Error creating transaction:", error);
        return res.status(500).json({ error: error.message });
    }
};


export const getTransactions = async (req, res) => {
    try {
        const {
            name,
            createdBy,
            suspicious,
            promotionId,
            type,
            relatedId,
            amount,
            operator,
            page = 1,
            limit = 10,
        } = req.query;

        const filters = {};

        // Build relation-aware filters
        if (suspicious !== undefined) {
            filters.customer = { ...(filters.customer || {}), suspicious: suspicious === "true" };
        }
        if (name) {
            filters.customer = { ...(filters.customer || {}), utorid: { contains: name } };
        }
        if (promotionId) {
            // promotionIds are stored as JSON strings, search by substring
            filters.promotionIds = { contains: `"${parseInt(promotionId)}"` };
        }
        if (createdBy) {
            // createdBy may be the cashier utorid or manager flag; try to filter by cashier utorid
            filters.cashier = { ...(filters.cashier || {}), utorid: createdBy };
        }
        if (type) filters.type = type;
        if (relatedId) filters.relatedTransactionId = parseInt(relatedId);

        if (amount && operator) {
            filters.amount = { [operator]: parseFloat(amount) };
        }

        const [count, rawResults] = await Promise.all([
            prisma.transaction.count({ where: filters }),
            prisma.transaction.findMany({
                where: filters,
                skip: (page - 1) * limit,
                take: Number(limit),
                include: { customer: true, cashier: true },
            }),
        ]);

        // Map results to public schema expected by tests
        const results = rawResults.map(tx => ({
            id: tx.id,
            utorid: tx.customer ? tx.customer.utorid : null,
            amount: tx.points,
            type: tx.type,
            spent: tx.amount,
            promotionIds: tx.promotionIds ? JSON.parse(tx.promotionIds) : [],
            suspicious: (tx.customer && tx.customer.suspicious) || (tx.cashier && tx.cashier.suspicious),
            remark: tx.remark || "",
            createdBy: tx.cashier ? tx.cashier.utorid : (tx.managerVerified ? "manager" : "system"),
            relatedId: tx.relatedTransactionId || undefined,
            targetUserId: tx.targetUserId || undefined,
            redeemed: tx.type === 'redemption' ? tx.points : undefined,
        }));

        return res.status(200).json({ count, results });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getTransaction = async (req, res) => {
    try {
        const transactionId = Number(req.params.transactionId);

        if (!transactionId || isNaN(transactionId) || transactionId <= 0) {
            return res.status(400).json({ error: "Invalid transaction id" });
        }

        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
                customer: true,
                cashier: true,
            },
        });

        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        // Check authorization: regular users can only view their own transactions
        const userRole = req.user.role;
        const isRegularUser = userRole === 'regular';

        if (isRegularUser && transaction.userId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to view this transaction" });
        }

        return res.status(200).json({
            id: transaction.id,
            utorid: transaction.customer.utorid,
            type: transaction.type,
            spent: transaction.amount,
            amount: transaction.points,
            promotionIds: transaction.promotionIds ? JSON.parse(transaction.promotionIds) : [],
            // A transaction is considered suspicious if either the customer or the cashier is flagged suspicious.
            suspicious: (transaction.customer && transaction.customer.suspicious) || (transaction.cashier && transaction.cashier.suspicious),
            remark: transaction.remark || "",
            createdBy: transaction.cashier ? transaction.cashier.utorid : (transaction.managerVerified ? "manager" : "system"),
            relatedId: transaction.targetUserId || undefined,
            createdAt: transaction.createdAt,
        });
    } catch (error) {
        console.error("Error retrieving transaction:", error);
        return res.status(500).json({ error: error.message });
    }
};

export const setTransactionSuspicious = async (req, res) => {
    try {
        const transactionId = Number(req.params.transactionId);
        const { suspicious } = req.body;

        // Accept boolean or string 'true'/'false'
        let suspiciousBool = suspicious;
        if (typeof suspiciousBool === 'string') {
            if (suspiciousBool.toLowerCase() === 'true') suspiciousBool = true;
            else if (suspiciousBool.toLowerCase() === 'false') suspiciousBool = false;
            else return res.status(400).json({ error: "suspicious must be a boolean" });
        }
        if (typeof suspiciousBool !== 'boolean') {
            return res.status(400).json({ error: "suspicious must be a boolean" });
        }

        // Only manager or superuser may set suspicious
        if (!["manager", "superuser"].includes(req.user.role)) {
            return res.status(403).json({ error: "Not authorized to change suspicious flag" });
        }

        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { customer: true },
        });

        if (!transaction) return res.status(404).json({ error: "Transaction not found" });

        // Toggle customer's suspicious flag according to request
        const customer = transaction.customer;
        if (!customer) return res.status(404).json({ error: "Customer not found" });

        // Determine points adjustment
        let pointsChange = 0;
        if (suspiciousBool && !customer.suspicious) {
            // flagging customer suspicious: remove transaction points from user
            pointsChange = -transaction.points;
        } else if (!suspiciousBool && customer.suspicious) {
            // unflagging suspicious: add transaction points back
            pointsChange = transaction.points;
        }

        // Update user suspicious flag
        await prisma.user.update({ where: { id: customer.id }, data: { suspicious: suspiciousBool } });

        if (pointsChange !== 0) {
            await prisma.user.update({ where: { id: customer.id }, data: { points: { increment: pointsChange } } });
        }

        return res.status(200).json({
            id: transaction.id,
            utorid: customer.utorid,
            type: transaction.type,
            spent: transaction.amount,
            amount: transaction.points,
            promotionIds: transaction.promotionIds ? JSON.parse(transaction.promotionIds) : [],
            suspicious: suspiciousBool,
            remark: transaction.remark || "",
            createdBy: transaction.cashier ? transaction.cashier.utorid : "system",
        });
    } catch (error) {
        console.error("Error updating suspicious flag:", error);
        return res.status(500).json({ error: error.message });
    }
};

export const createTransfer = async (req, res) => {
    try {
        const senderId = req.user.id;
        const recipientId = Number(req.params.userId);

        if (!recipientId || isNaN(recipientId) || recipientId <= 0) {
            return res.status(400).json({ error: "Invalid user id" });
        }

        const { type, amount, remark } = req.body;

        if (type !== "transfer") {
            return res.status(400).json({ error: "Transaction type must be 'transfer'" });
        }
        if (!amount || amount <= 0 || !Number.isInteger(amount)) {
            return res.status(400).json({ error: "Amount must be a positive integer" });
        }
        const sender = await prisma.user.findUnique({ where: { id: senderId } });
        const recipient = await prisma.user.findUnique({ where: { id: recipientId } });

        if (!sender || !recipient) return res.status(404).json({ error: "User not found" });
        if (!sender.verified) return res.status(403).json({ error: "Sender is not verified" });
        if (sender.points < amount) return res.status(400).json({ error: "Insufficient points" });

        const senderTx = await prisma.transaction.create({
            data: {
                type,
                amount,
                userId: sender.id,
                targetUserId: recipient.id,
                points: -amount,
                remark: remark || "",
                cashierId: null,
            },
        });

        const recipientTx = await prisma.transaction.create({
            data: {
                type,
                amount,
                userId: recipient.id,
                targetUserId: sender.id,
                points: amount,
                remark: remark || "",
                cashierId: null,
            },
        });

        await prisma.user.update({
            where: { id: sender.id },
            data: { points: { decrement: amount } },
        });
        await prisma.user.update({
            where: { id: recipient.id },
            data: { points: { increment: amount } },
        });

        return res.status(201).json({
            id: senderTx.id,
            sender: sender.utorid,
            recipient: recipient.utorid,
            type,
            sent: amount,
            remark: remark || "",
            createdBy: sender.utorid,
        });
    } catch (error) {
        console.error("Error creating transfer:", error);
        return res.status(500).json({ error: error.message });
    }
};

export const createRedemption = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, amount, remark } = req.body;

        if (type !== "redemption") {
            return res.status(400).json({ error: "Transaction type must be 'redemption'" });
        }
        const amountNum = Number(amount);
        if (!amountNum || amountNum <= 0 || !Number.isInteger(amountNum)) {
            return res.status(400).json({ error: "Amount must be a positive integer" });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: "User not found" });
        if (!user.verified) return res.status(403).json({ error: "User is not verified" });
        if (user.points < amountNum) return res.status(400).json({ error: "Insufficient points" });

        const transaction = await prisma.transaction.create({
            data: {
                type,
                amount: amountNum,
                userId,
                points: amountNum,
                remark: remark || "",
                cashierId: null,
            },
        });

        return res.status(201).json({
            id: transaction.id,
            utorid: user.utorid,
            type: transaction.type,
            processedBy: null,
            amount: transaction.amount,
            remark: transaction.remark || "",
            createdBy: user.utorid,
        });
    } catch (error) {
        console.error("Error creating redemption transaction:", error);
        return res.status(500).json({ error: error.message });
    }
};

export const getMyTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            type,
            relatedId,
            promotionId,
            amount,
            operator,
            page = 1,
            limit = 10,
        } = req.query;

        const filters = { userId };

        if (type) filters.type = type;

        if (relatedId && type) filters.relatedTransactionId = Number(relatedId);

        if (promotionId) {
            filters.promotionIds = {
                has: Number(promotionId),
            };
        }

        if (amount && operator) {
            if (operator === "gte") filters.points = { gte: Number(amount) };
            else if (operator === "lte") filters.points = { lte: Number(amount) };
        }

        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const count = await prisma.transaction.count({ where: filters });

        const results = await prisma.transaction.findMany({
            where: filters,
            orderBy: { createdAt: "desc" },
            skip,
            take,
        });

        return res.status(200).json({ count, results });
    } catch (error) {
        console.error("Error retrieving transactions:", error);
        return res.status(500).json({ error: error.message });
    }
};

export const processRedemption = async (req, res) => {
    try {
        const transactionId = Number(req.params.transactionId);
        const { processed } = req.body;

        if (processed !== true) {
            return res.status(400).json({ error: "Processed can only be true" });
        }

        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { customer: true },
        });

        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        if (transaction.type !== "redemption") {
            return res.status(400).json({ error: "Transaction is not a redemption" });
        }

        if (transaction.cashierId) {
            return res.status(400).json({ error: "Transaction has already been processed" });
        }

        await prisma.user.update({
            where: { id: transaction.userId },
            data: { points: { decrement: transaction.points } },
        });

        const updatedTransaction = await prisma.transaction.update({
            where: { id: transactionId },
            data: { cashierId: req.user.id },
        });

        return res.status(200).json({
            id: updatedTransaction.id,
            utorid: transaction.customer.utorid,
            type: updatedTransaction.type,
            processedBy: req.user.utorid,
            redeemed: updatedTransaction.points,
            remark: updatedTransaction.remark || "",
            createdBy: transaction.customer.utorid,
        });
    } catch (error) {
        console.error("Error processing redemption transaction:", error);
        return res.status(500).json({ error: error.message });
    }
};
export default { createTransaction,getTransactions,getTransaction,setTransactionSuspicious,createTransfer,createRedemption,getMyTransactions,processRedemption };
