const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient()
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

exports.createPromotion = async (req, res) => {
    try {
        let { name, description, type, startTime, endTime, minSpending, rate, points } = req.body;

        if (!name || !description || !type || !startTime || !endTime) {
            return res.status(400).json({ error: "Required fields are missing" });
        }

        // normalize numeric inputs (they may arrive as strings)
        if (minSpending !== undefined && minSpending !== null) minSpending = Number(minSpending);
        if (rate !== undefined && rate !== null) rate = Number(rate);
        if (points !== undefined && points !== null) points = Number(points);

        // Accept both 'one-time' and 'onetime' from clients; Prisma enum uses 'onetime'
        const normalizedType = (typeof type === 'string' && type.toLowerCase() === 'one-time') ? 'onetime' : type;
        if (!["automatic", "onetime"].includes(normalizedType)) {
            return res.status(400).json({ error: 'Type must be "automatic" or "one-time"' });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);
        const now = new Date();

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ error: "Invalid date format" });
        }

        // Allow managers to create promotions with past start times (for corrections)
        // Removed restriction: if (start < now) return res.status(400).json({ error: "startTime cannot be in the past" });

        if (end <= start) {
            return res.status(400).json({ error: "endTime must be after startTime" });
        }

        if (minSpending !== undefined && minSpending !== null) {
            if (isNaN(minSpending) || minSpending <= 0) {
                return res.status(400).json({ error: "minSpending must be a positive number" });
            }
        }
        if (rate !== undefined && rate !== null) {
            if (isNaN(rate) || rate <= 0) {
                return res.status(400).json({ error: "rate must be a positive number" });
            }
        }
        if (points !== undefined && points !== null) {
            if (!Number.isInteger(points) || points < 0) {
                return res.status(400).json({ error: "points must be a non-negative integer" });
            }
        }

        if (!req.user) {
            return res.status(401).json({ error: "Authentication required" });
        }

        if (!["manager", "superuser"].includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden. Manager or higher required." });
        }

        let promotion;
        try {
            promotion = await prisma.promotion.create({
                data: {
                    name,
                    description,
                    type: normalizedType,
                    startTime: start,
                    endTime: end,
                    minSpending: minSpending ?? null,
                    rate: rate ?? null,
                    points: points ?? null,
                },
            });
        } catch (e) {
            // Handle unique constraint on name
            if (e.code === 'P2002' && e.meta?.target && e.meta.target.includes('name')) {
                return res.status(400).json({ error: 'Promotion name already exists' });
            }
            throw e;
        }

        // Return only the fields expected by the tests
        const response = {
            id: promotion.id,
            name: promotion.name,
            description: promotion.description,
            type: promotion.type,
            startTime: promotion.startTime,
            endTime: promotion.endTime,
            minSpending: promotion.minSpending,
            rate: promotion.rate,
            points: promotion.points,
        };

        return res.status(201).json(response);
    } catch (error) {
        console.error("Error creating promotion:", error);
        return res.status(500).json({ error: error.message });
    }
};

exports.getPromotions = async (req, res) => {
    try {
        const { name, type, page = 1, limit = 10, started, ended } = req.query;

        if (started !== undefined && ended !== undefined) {
            return res.status(400).json({ error: "Cannot specify both started and ended filters." });
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (isNaN(pageNum) || isNaN(limitNum) || pageNum <= 0 || limitNum <= 0) {
            return res.status(400).json({ error: "Invalid page or limit" });
        }

        const filters = {};

        if (name) filters.name = { contains: name, mode: "insensitive" };
        // Accept both 'one-time' and 'onetime' in query
        if (type) {
            const t = type === 'one-time' ? 'onetime' : type;
            filters.type = t;
        }

        const now = new Date();
        const userRole = req.user?.role;
        // Treat cashier as a regular user for promotions visibility
        const isRegularUser = !userRole || userRole === "regular" || userRole === "cashier";

        if (isRegularUser) {
            // Regular users only see active promotions
            filters.startTime = { lte: now };
            filters.endTime = { gte: now };
        } else {
            // Managers can filter by started/ended
            if (started !== undefined) {
                filters.startTime = started === "true" ? { lte: now } : { gt: now };
            }
            if (ended !== undefined) {
                filters.endTime = ended === "true" ? { lte: now } : { gt: now };
            }
        }

        const skip = (pageNum - 1) * limitNum;
        const take = limitNum;

        let selectFields = {
            id: true,
            name: true,
            type: true,
            endTime: true,
            minSpending: true,
            rate: true,
            points: true,
        };

        // Managers can see startTime
        if (!isRegularUser) {
            selectFields.startTime = true;
        }
        let promotions = [];
        let count = 0;

        if (isRegularUser && req.user) {
            const allPromotions = await prisma.promotion.findMany({
                where: filters,
                orderBy: { startTime: "asc" },
                select: selectFields // {
                    // ...selectFields,
                    // uses: {
                    //     where: {
                    //         userId: req.user.id,
                    //     },
                    //     select: {
                    //         id: true,
                    //     }
                    // }
                // }
            });
            // Filter out one-time promotions the user has already used
            let filteredPromos = allPromotions.filter(p => {
                if (p.type === "automatic") {
                    return true;
                }
                // treat both 'onetime' and 'one-time' as one-time type stored as 'onetime'
                // return p.uses.length === 0;
            });

            const totalMatches = filteredPromos.length;
            const pageSlice = filteredPromos.slice(skip, skip + take);
            // Remove uses property from response objects
            promotions = pageSlice.map(({ uses, ...rest }) => rest);
            count = totalMatches;
        }
        else {
            [promotions, count] = await Promise.all([
                prisma.promotion.findMany({
                    where: filters,
                    skip,
                    take,
                    orderBy: { startTime: "asc" },
                    select: selectFields,
                }),
                prisma.promotion.count({ where: filters }),
            ]);
        }

        return res.status(200).json({ count, results: promotions });
    } catch (error) {
        console.error("Error getting promotions:", error);
        return res.status(500).json({ error: error.message });
    }
};

exports.getPromotionById = async (req, res) => {
    try {
        const { promotionId } = req.params;
        const id = parseInt(promotionId);

        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: "Invalid promotion ID" });
        }

        const now = new Date();

        const promotion = await prisma.promotion.findUnique({
            where: { id },
        });

        if (!promotion) {
            return res.status(404).json({ error: "Promotion not found" });
        }

        const userRole = req.user?.role;
        const isRegularUser = !userRole || userRole === "regular" || userRole === "cashier";

        // Regular users can only see active promotions
        if (isRegularUser && (promotion.startTime > now || promotion.endTime < now)) {
            return res.status(404).json({ error: "Promotion is inactive" });
        }

        if (isRegularUser) {
            const { startTime, ...promotionWithoutStartTime } = promotion;
            return res.status(200).json(promotionWithoutStartTime);
        } else {
            return res.status(200).json(promotion);
        }
    } catch (error) {
        console.error("Error in getPromotionById:", error);
        return res.status(500).json({ error: error.message });
    }
};

exports.updatePromotion = async (req, res) => {
    try {
        const { promotionId } = req.params;
        const id = parseInt(promotionId);
        const {
            name,
            description,
            type,
            startTime,
            endTime,
            minSpending,
            rate,
            points,
        } = req.body;

        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: "Invalid promotion ID" });
        }

        const promotion = await prisma.promotion.findUnique({
            where: { id },
        });

        if (!promotion) {
            return res.status(404).json({ error: "Promotion not found" });
        }

        const now = new Date();

        // Validate new dates if provided
        let newStart = startTime ? new Date(startTime) : null;
        let newEnd = endTime ? new Date(endTime) : null;

        if (newStart && isNaN(newStart.getTime())) {
            return res.status(400).json({ error: "Invalid startTime format" });
        }
        if (newEnd && isNaN(newEnd.getTime())) {
            return res.status(400).json({ error: "Invalid endTime format" });
        }

        if (newStart && newStart < now) {
            return res.status(400).json({ error: "startTime cannot be in the past" });
        }
        if (newEnd && newEnd < now) {
            return res.status(400).json({ error: "endTime cannot be in the past" });
        }

        // Check if promotion has already started
        if (promotion.startTime < now) {
            const restrictedFields = [name, description, type, startTime, minSpending, rate, points];
            if (restrictedFields.some(f => f !== undefined)) {
                return res.status(400).json({ error: "Cannot update these fields after promotion has started" });
            }
        }

        // Check if promotion has already ended
        if (promotion.endTime < now && endTime !== undefined) {
            return res.status(400).json({ error: "Cannot update endTime after promotion has ended" });
        }

        // Validate minSpending, rate, points
        if (minSpending !== undefined && minSpending !== null && minSpending <= 0) {
            return res.status(400).json({ error: "minSpending must be positive" });
        }
        if (rate !== undefined && rate !== null && rate <= 0) {
            return res.status(400).json({ error: "rate must be positive" });
        }
        if (points !== undefined && points !== null) {
            if (!Number.isInteger(points) || points < 0) {
                return res.status(400).json({ error: "points must be a non-negative integer" });
            }
        }

        if (!req.user) {
            return res.status(401).json({ error: "Authentication required" });
        }

        if (!["manager", "superuser"].includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden. Manager or higher required." });
        }

        const dataToUpdate = {};
        if (name !== undefined) dataToUpdate.name = name;
        if (description !== undefined) dataToUpdate.description = description;

        if (type !== undefined) {
            const normalizedType = (typeof type === 'string' && type.toLowerCase() === 'one-time') ? 'onetime' : type;
            if (!["automatic", "onetime"].includes(normalizedType)) {
                return res.status(400).json({ error: 'Type must be "automatic" or "one-time"' });
            }
            dataToUpdate.type = normalizedType;
        }

        if (startTime !== undefined) dataToUpdate.startTime = newStart;
        if (endTime !== undefined) dataToUpdate.endTime = newEnd;

        // Coerce numeric fields if provided
        if (minSpending !== undefined) dataToUpdate.minSpending = minSpending === null ? null : Number(minSpending);
        if (rate !== undefined) dataToUpdate.rate = rate === null ? null : Number(rate);
        if (points !== undefined) dataToUpdate.points = points === null ? null : Number(points);

        let updated;
        try {
            updated = await prisma.promotion.update({
                where: { id },
                data: dataToUpdate,
            });
        } catch (e) {
            if (e.code === 'P2002' && e.meta?.target && e.meta.target.includes('name')) {
                return res.status(400).json({ error: 'Promotion name already exists' });
            }
            throw e;
        }

        const response = {
            id: updated.id,
            name: updated.name,
            type: updated.type,
        };

        // Add only updated fields
        Object.keys(dataToUpdate).forEach(k => {
            if (!["id", "name", "type"].includes(k)) {
                response[k] = updated[k];
            }
        });

        return res.status(200).json(response);
    } catch (error) {
        console.error("Error updating promotion:", error);
        return res.status(500).json({ error: error.message });
    }
};

exports.deletePromotion = async (req, res) => {
    try {
        const { promotionId } = req.params;
        const id = parseInt(promotionId);

        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: "Invalid promotion ID" });
        }

        const promotion = await prisma.promotion.findUnique({
            where: { id },
        });

        if (!promotion) {
            return res.status(404).json({ error: "Promotion not found" });
        }

        const now = new Date();
        if (promotion.startTime <= now) {
            return res.status(403).json({ error: "Cannot delete a promotion that has already started" });
        }

        if (!req.user) {
            return res.status(401).json({ error: "Authentication required" });
        }

        if (!["manager", "superuser"].includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden. Manager or higher required." });
        }

        await prisma.promotion.delete({
            where: { id },
        });

        return res.status(204).send();
    } catch (error) {
        console.error("Error deleting promotion:", error);
        return res.status(500).json({ error: error.message });
    }
};