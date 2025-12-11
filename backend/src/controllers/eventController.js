import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
const prisma = new PrismaClient();
import { v4 as uuidv4 } from "uuid";
const jwt = require("jsonwebtoken");

export const createEvent = async (req, res) => {
    try {
        const { name, description, location, startTime, endTime, capacity, points } = req.body;

        if (!name || !description || !location || !startTime || !endTime || points === undefined) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (isNaN(start) || isNaN(end)) {
            return res.status(400).json({ error: "Invalid startTime or endTime format." });
        }

        if (end <= start) {
            return res.status(400).json({ error: "endTime must be after startTime." });
        }

        if (points <= 0 || !Number.isInteger(points)) {
            return res.status(400).json({ error: "Points must be a positive integer." });
        }

        if (capacity !== null && capacity !== undefined) {
            if (typeof capacity !== "number" || capacity <= 0) {
                return res.status(400).json({ error: "Capacity must be a positive number or null." });
            }
        }

        if (!req.user) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const newEvent = await prisma.event.create({
            data: {
                name,
                description,
                location,
                startTime: start,
                endTime: end,
                capacity: capacity ?? null,
                pointsAllocated: points,
                pointsAwarded: 0
            },
        });

        return res.status(201).json({
            id: newEvent.id,
            name: newEvent.name,
            description: newEvent.description,
            location: newEvent.location,
            startTime: newEvent.startTime,
            endTime: newEvent.endTime,
            capacity: newEvent.capacity,
            pointsRemain: newEvent.pointsAllocated - newEvent.pointsAwarded,
            pointsAwarded: newEvent.pointsAwarded,
            published: false,
            organizers: [],
            guests: [],
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getEvents = async (req, res) => {
    try {
        const {
            name,
            location,
            started,
            ended,
            showFull,
            published,
            page = 1,
            limit = 10,
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(pageNum) || isNaN(limitNum) || pageNum <= 0 || limitNum <= 0) {
            return res.status(400).json({ error: "Invalid page or limit" });
        }


        const filters = {};
        const now = new Date();

        // Build filters array for complex queries
        const andFilters = [];

        // Search in both name and description if name parameter is provided
        if (name) {
            andFilters.push({
                OR: [
                    { name: { contains: name, mode: "insensitive" } },
                    { description: { contains: name, mode: "insensitive" } }
                ]
            });
        }

        if (location) {
            andFilters.push({ location: { contains: location, mode: "insensitive" } });
        }

        if (started !== undefined) {
            andFilters.push({
                startTime: started === "true" ? { lte: now } : { gt: now }
            });
        }

        if (ended !== undefined) {
            andFilters.push({
                endTime: ended === "true" ? { lte: now } : { gt: now }
            });
        }

        // Role-aware published filtering: regular users see only published events by default
        const userRole = req.user?.role;
        if (published !== undefined) {
            andFilters.push({ published: published === "true" });
        } else if (userRole === "regular") {
            andFilters.push({ published: true });
        }

        // Combine all filters with AND
        if (andFilters.length > 0) {
            filters.AND = andFilters;
        }

        // Determine effective showFull: privileged users see full events by default
        const effectiveShowFull = (showFull !== undefined) ? (showFull === "true") : (userRole === "manager" || userRole === "superuser");

        // Fetch all candidate events (we'll filter full events in JS so count matches expectation)
        const allEvents = await prisma.event.findMany({
            where: filters,
            orderBy: { startTime: "asc" },
            include: { guests: true },
        });

        // Apply showFull filtering in JS
        const filtered = allEvents.filter((e) => {
            if (effectiveShowFull) return true;
            if (e.capacity === null || e.capacity === undefined) return true;
            const guestCount = Array.isArray(e.guests) ? e.guests.length : 0;
            return guestCount < (e.capacity || 0);
        });

        const count = filtered.length;

        // Pagination (slice)
        const skip = (pageNum - 1) * limitNum;
        const pageSlice = filtered.slice(skip, skip + limitNum);

        const isPrivileged = userRole === "manager" || userRole === "superuser";

        const results = pageSlice.map((e) => {
            const guestCount = Array.isArray(e.guests) ? e.guests.length : 0;
            const baseResult = {
                id: e.id,
                name: e.name,
                location: e.location,
                startTime: e.startTime,
                endTime: e.endTime,
                capacity: e.capacity,
                numGuests: guestCount,
            };

            if (isPrivileged) {
                baseResult.pointsRemain = Math.max(0, (e.pointsAllocated || 0) - (e.pointsAwarded || 0));
                baseResult.pointsAwarded = e.pointsAwarded;
                baseResult.published = e.published || false;
            }

            return baseResult;
        });

        return res.status(200).json({ count, results });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
};

export const getEventById = async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);
        const userId = req.user?.id;
        const userRole = req.user?.role;

        if (isNaN(eventId)) {
            return res.status(404).json({ error: "Event not found" });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                organizers: {
                    include: {
                        user: {
                            select: { id: true, utorid: true, name: true },
                        },
                    },
                },
                guests: {
                    select: { id: true, userId: true, attendanceConfirmed: true },
                },
            },
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Normalize organizers/guests to arrays to avoid runtime errors when include is missing
        const organizersArr = Array.isArray(event.organizers) ? event.organizers : [];
        const guestsArr = Array.isArray(event.guests) ? event.guests : [];

        const isOrganizer = organizersArr.some(o => (o && o.user && o.user.id === userId) || o.userId === userId);
        const isPrivileged = userRole === "manager" || userRole === "superuser";

        if (isPrivileged || isOrganizer) {
            const result = {
                id: event.id,
                name: event.name,
                description: event.description,
                location: event.location,
                startTime: event.startTime,
                endTime: event.endTime,
                capacity: event.capacity,
                pointsRemain: (event.pointsAllocated || 0) - (event.pointsAwarded || 0),
                pointsAwarded: event.pointsAwarded ?? 0,
                published: event.published || false,
                organizers: organizersArr.map(o => {
                    if (o && o.user) return { id: o.user.id, utorid: o.user.utorid, name: o.user.name };
                    // Fallback when user object wasn't included: use stored userId if present
                    return { id: o.userId || null, utorid: null, name: null };
                }),
                guests: guestsArr.map(g => ({
                    id: g.id,
                    userId: g.userId,
                    attendanceConfirmed: g.attendanceConfirmed,
                })),
            };
            return res.status(200).json(result);
        }

        const result = {
            id: event.id,
            name: event.name,
            description: event.description,
            location: event.location,
            startTime: event.startTime,
            endTime: event.endTime,
            capacity: event.capacity,
            organizers: organizersArr.map((o) => {
                if (o && o.user) return { id: o.user.id, utorid: o.user.utorid, name: o.user.name };
                return { id: o.userId || null, utorid: null, name: null };
            }),
            numGuests: guestsArr.length,
        };

        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
};

export const updateEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const {
            name,
            description,
            location,
            startTime,
            endTime,
            capacity,
            points,
            published,
        } = req.body;

        const event = await prisma.event.findUnique({
            where: { id: parseInt(eventId) },
            include: { organizers: true, guests: true },
        });

        if (!event) return res.status(404).json({ error: "Event not found" });

        const isOrganizer = Array.isArray(event.organizers) && event.organizers.some(o => (o.user && o.user.id === userId) || o.userId === userId);
        const isPrivileged = userRole === "manager" || userRole === "superuser";

        if (!isPrivileged && !isOrganizer) {
            return res.status(403).json({ error: "Not authorized to update this event" });
        }

        const updates = {};
        const now = new Date();

        if (points !== undefined && !isPrivileged) {
            return res.status(403).json({ error: "Only managers can update points" });
        }
        if (published !== undefined && !isPrivileged) {
            return res.status(403).json({ error: "Only managers can publish events" });
        }

        // Managers and superusers can update events at any time
        // Organizers have time-based restrictions
        if (startTime) {
            const newStart = new Date(startTime);
            if (!isPrivileged) {
                if (newStart < now)
                    return res.status(400).json({ error: "startTime cannot be in the past" });
                if (event.startTime < now)
                    return res.status(400).json({ error: "Cannot update startTime after event has started" });
            }
            updates.startTime = newStart;
        }

        if (endTime) {
            const newEnd = new Date(endTime);
            if (!isPrivileged) {
                if (newEnd < now)
                    return res.status(400).json({ error: "endTime cannot be in the past" });
                if (event.endTime < now)
                    return res.status(400).json({ error: "Cannot update endTime after event has ended" });
            }
            updates.endTime = newEnd;
        }

        // Managers can update event details even after it has ended
        if (!isPrivileged && event.endTime < now) {
            if (name || description || location) {
                return res.status(400).json({ error: "Cannot update event details after it has ended" });
            }
        }

        // Managers can update fields even after event has started
        if (isPrivileged || event.startTime >= now) {
            if (name) updates.name = name;
            if (description) updates.description = description;
            if (location) updates.location = location;
        } else {
            if (name || description || location) {
                return res.status(400).json({ error: "Cannot update these fields after event has started" });
            }
        }

        if (capacity !== undefined) {
            if (capacity !== null && capacity < 0) {
                return res.status(400).json({ error: "capacity must be positive" });
            }
            const confirmedGuests = event.guests.filter((g) => g.attendanceConfirmed).length;
            if (capacity !== null && confirmedGuests > capacity) {
                return res.status(400).json({ error: "Cannot reduce capacity below confirmed guests" });
            }
            // Managers can update capacity even after event has started
            if (!isPrivileged && event.startTime < now) {
                return res.status(400).json({ error: "Cannot update capacity after event has started" });
            }
            updates.capacity = capacity;
        }

        if (points !== undefined) {
            const pointsAwarded = event.pointsAwarded || 0;
            const newPointsRemain = points - pointsAwarded;
            if (newPointsRemain < 0) {
                return res.status(400).json({ error: "Remaining points cannot be negative" });
            }
            updates.pointsAllocated = points;
        }

        if (published !== undefined) {
            updates.published = published === true || published === "true"; // ✅ ensure boolean
        }

        const updatedEvent = await prisma.event.update({
            where: { id: parseInt(eventId) },
            data: updates,
        });

        const response = {
            id: updatedEvent.id,
            name: updatedEvent.name,
            location: updatedEvent.location,
        };

        if ("published" in updates) response.published = updatedEvent.published;
        if ("description" in updates) response.description = updatedEvent.description;
        if ("startTime" in updates) response.startTime = updatedEvent.startTime;
        if ("endTime" in updates) response.endTime = updatedEvent.endTime;
        if ("capacity" in updates) response.capacity = updatedEvent.capacity;
        if ("points" in updates) {
            response.pointsRemain =
                (updatedEvent.pointsAllocated || 0) - (updatedEvent.pointsAwarded || 0);
        }

        return res.status(200).json(response);
    } catch (error) {
        console.error("updateEvent error:", error);
        return res.status(500).json({ error: error.message });
    }
};


export const deleteEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userRole = req.user?.role;

        const idNum = parseInt(eventId);
        if (isNaN(idNum) || idNum <= 0) return res.status(400).json({ error: "Invalid event id" });

        const event = await prisma.event.findUnique({ where: { id: idNum } });
        if (!event) return res.status(404).json({ error: "Event not found" });

        if (!(userRole === "manager" || userRole === "superuser")) {
            return res.status(403).json({ error: "Not authorized to delete this event" });
        }

        // Managers and superusers can delete any event, including published ones
        // (Previously restricted: Cannot delete published event)

        // Delete dependent rows in a transaction to avoid FK constraint errors
        await prisma.$transaction(async (tx) => {
            await tx.eventGuest.deleteMany({ where: { eventId: idNum } });
            await tx.eventOrganizer.deleteMany({ where: { eventId: idNum } });
            // Transactions related to events are stored with relatedTransactionId = event.id
            await tx.transaction.deleteMany({ where: { relatedTransactionId: idNum } });
            await tx.event.delete({ where: { id: idNum } });
        });

        return res.status(204).send();
    } catch (error) {
        console.error('deleteEvent error:', error);
        return res.status(500).json({ error: error.message });
    }
};

export const addEventOrganizer = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { utorid } = req.body;

        if (!utorid) return res.status(400).json({ error: "utorid is required" });

        const user = await prisma.user.findUnique({ where: { utorid } });
        if (!user) return res.status(404).json({ error: "User not found" });

        const event = await prisma.event.findUnique({
            where: { id: parseInt(eventId) },
            include: { guests: true, organizers: true },
        });
        if (!event) return res.status(404).json({ error: "Event not found" });

        const userRole = req.user?.role;
        if (!(userRole === "manager" || userRole === "superuser")) {
            return res.status(403).json({ error: "Not authorized to add organizers" });
        }

        // Managers can add organizers even to ended events (for historical records)

        const isGuest = event.guests.some(g => g.userId === user.id);
        if (isGuest) return res.status(400).json({ error: "Remove user as guest first" });

        const alreadyOrganizer = event.organizers.some(o => o.userId === user.id);
        if (alreadyOrganizer) return res.status(400).json({ error: "User is already an organizer" });

        await prisma.eventOrganizer.create({
            data: { eventId: event.id, userId: user.id },
        });

        const updatedEvent = await prisma.event.findUnique({
            where: { id: event.id },
            include: {
                organizers: {
                    include: {
                        user: {
                            select: { id: true, utorid: true, name: true }
                        }
                    }
                },
            },
        });

        const organizers = updatedEvent.organizers.map(o => ({
            id: o.user.id,
            utorid: o.user.utorid,
            name: o.user.name,
        }));

        return res.status(201).json({
            id: event.id,
            name: event.name,
            location: event.location,
            organizers,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const removeEventOrganizer = async (req, res) => {
    try {
        const { eventId, userId } = req.params;

        const userRole = req.user?.role;
        if (!(userRole === "manager" || userRole === "superuser")) {
            return res.status(403).json({ error: "Not authorized to remove organizers" });
        }

        const organizer = await prisma.eventOrganizer.findUnique({
            where: {
                userId_eventId: {
                    userId: parseInt(userId),
                    eventId: parseInt(eventId)
                }
            },
        });

        if (!organizer) return res.status(404).json({ error: "Organizer not found for this event" });

        await prisma.eventOrganizer.delete({
            where: {
                userId_eventId: {
                    userId: parseInt(userId),
                    eventId: parseInt(eventId)
                }
            },
        });

        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const addEventGuest = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { utorid } = req.body;

        if (!utorid) return res.status(400).json({ error: "utorid is required" });

        const user = await prisma.user.findUnique({ where: { utorid } });
        if (!user) return res.status(404).json({ error: "User not found" });

        const event = await prisma.event.findUnique({
            where: { id: parseInt(eventId) },
            include: { guests: true, organizers: true },
        });
        if (!event) return res.status(404).json({ error: "Event not found" });

        const now = new Date();
        if (event.endTime < now) return res.status(410).json({ error: "Event has ended" });

        const userRole = req.user?.role;
        const isPrivileged = userRole === "manager" || userRole === "superuser";
        const isOrganizer = event.organizers.some(o => o.userId === req.user.id);

        if (!isPrivileged && !isOrganizer) {
            return res.status(403).json({ error: "Not authorized to add guests" });
        }

        const isUserOrganizer = event.organizers.some(o => o.userId === user.id);
        if (isUserOrganizer) return res.status(400).json({ error: "Remove user as organizer first" });

        // Check if user is already a guest
        const alreadyGuest = event.guests.some(g => g.userId === user.id);
        if (alreadyGuest) return res.status(400).json({ error: "User is already a guest for this event" });

        const guestCount = Array.isArray(event.guests) ? event.guests.length : 0;
        if (event.capacity !== null && event.capacity !== undefined && guestCount >= event.capacity) {
            return res.status(410).json({ error: "Event is full" });
        }

        await prisma.eventGuest.create({
            data: { eventId: event.id, userId: user.id },
        });

        const numGuests = guestCount + 1;

        return res.status(201).json({
            id: event.id,
            name: event.name,
            location: event.location,
            guestAdded: { id: user.id, utorid: user.utorid, name: user.name },
            numGuests,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const removeEventGuest = async (req, res) => {
    try {
        const { eventId, userId } = req.params;

        const event = await prisma.event.findUnique({ where: { id: parseInt(eventId) } });
        if (!event) return res.status(404).json({ error: "Event not found" });

        const now = new Date();
        if (event.endTime < now) return res.status(410).json({ error: "Event has ended" });

        const userRole = req.user?.role;
        if (!(userRole === "manager" || userRole === "superuser")) {
            return res.status(403).json({ error: "Not authorized to remove guests" });
        }

        const guest = await prisma.eventGuest.findUnique({
            where: { userId_eventId: { userId: parseInt(userId), eventId: parseInt(eventId) } },
        });
        if (!guest) return res.status(404).json({ error: "Guest not found for this event" });

        await prisma.eventGuest.delete({
            where: { userId_eventId: { userId: parseInt(userId), eventId: parseInt(eventId) } },
        });

        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const addSelfAsGuest = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user.id;

        // Validate user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, utorid: true, name: true }
        });
        if (!user) {
            return res.status(404).json({ error: "User not found. Please log in again." });
        }

        const event = await prisma.event.findUnique({
            where: { id: parseInt(eventId) },
            include: { guests: true },
        });
        if (!event) return res.status(404).json({ error: "Event not found" });

        const now = new Date();
        if (event.endTime < now) return res.status(410).json({ error: "Event has ended" });

        const alreadyGuest = event.guests.some(g => g.userId === userId);
        if (alreadyGuest) return res.status(400).json({ error: "Already RSVPed" });

        const guestCount = Array.isArray(event.guests) ? event.guests.length : 0;
        if (event.capacity !== null && event.capacity !== undefined && guestCount >= event.capacity) {
            return res.status(410).json({ error: "Event is full" });
        }

        await prisma.eventGuest.create({
            data: {
                eventId: event.id,
                userId: user.id
            },
        });

        const numGuests = guestCount + 1;

        return res.status(201).json({
            id: event.id,
            name: event.name,
            location: event.location,
            guestAdded: {
                id: user.id,
                utorid: user.utorid,
                name: user.name,
            },
            numGuests,
        });
    } catch (error) {
        console.error('RSVP Error:', error);
        if (error.code === 'P2003') {
            return res.status(400).json({ error: "Invalid user or event reference. Please log in again." });
        }
        return res.status(500).json({ error: error.message });
    }
};

export const removeSelfAsGuest = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user.id;

        const event = await prisma.event.findUnique({ where: { id: parseInt(eventId) } });
        if (!event) return res.status(404).json({ error: "Event not found" });

        const now = new Date();
        if (event.endTime < now) return res.status(410).json({ error: "Event has ended" });

        const guest = await prisma.eventGuest.findUnique({
            where: { userId_eventId: { userId, eventId: event.id } },
        });
        if (!guest) return res.status(410).json({ error: "You did not RSVP to this event" });

        await prisma.eventGuest.delete({
            where: { userId_eventId: { userId, eventId: event.id } },
        });

        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const createEventTransaction = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { type, utorid, amount, remark } = req.body;
        const createdBy = req.user.utorid;

        if (type !== "event") return res.status(400).json({ error: 'Type must be "event"' });
        if (!amount || amount <= 0) return res.status(400).json({ error: "Amount must be positive" });

        const userRole = req.user?.role;
        const userId = req.user?.id;

        const event = await prisma.event.findUnique({
            where: { id: parseInt(eventId) },
            include: {
                guests: {
                    include: {
                        user: { select: { id: true, utorid: true, name: true } }
                    }
                },
                organizers: true
            },
        });

        if (!event) return res.status(404).json({ error: "Event not found" });

        const isPrivileged = userRole === "manager" || userRole === "superuser";
        const isOrganizer = event.organizers.some(o => o.userId === userId);

        if (!isPrivileged && !isOrganizer) {
            return res.status(403).json({ error: "Not authorized to award points" });
        }

        // Calculate remaining points
        const totalPointsRemain = (event.pointsAllocated || 0) - (event.pointsAwarded || 0);

        if (utorid) {
            const guest = event.guests.find(g => g.user.utorid === utorid);
            if (!guest) return res.status(400).json({ error: "User is not on the guest list" });
            if (totalPointsRemain < amount) return res.status(400).json({ error: "Insufficient points remaining" });

            const transaction = await prisma.transaction.create({
                data: {
                    type,
                    amount,
                    points: amount,
                    userId: guest.userId,
                    relatedTransactionId: event.id,
                    remark: remark || "",
                    managerVerified: true,
                },
            });

            await prisma.event.update({
                where: { id: event.id },
                data: {
                    pointsAwarded: { increment: amount }
                },
            });

            await prisma.user.update({
                where: { id: guest.userId },
                data: { points: { increment: amount } }
            });

            return res.status(201).json({
                id: transaction.id,
                recipient: guest.user.utorid,
                awarded: amount,
                type: transaction.type,
                relatedId: event.id,
                remark: transaction.remark,
                createdBy,
            });
        } else {
            const eligibleGuests = event.guests;
            if (eligibleGuests.length === 0) return res.status(400).json({ error: "No guests to award" });
            if (totalPointsRemain < amount * eligibleGuests.length) {
                return res.status(400).json({ error: "Insufficient points remaining" });
            }

            const transactions = [];
            for (const guest of eligibleGuests) {
                const t = await prisma.transaction.create({
                    data: {
                        type,
                        amount,
                        points: amount,
                        userId: guest.userId,
                        relatedTransactionId: event.id,
                        remark: remark || "",
                        managerVerified: true,
                    },
                });

                await prisma.user.update({
                    where: { id: guest.userId },
                    data: { points: { increment: amount } }
                });

                transactions.push({
                    id: t.id,
                    recipient: guest.user.utorid,
                    awarded: amount,
                    type: t.type,
                    relatedId: event.id,
                    remark: t.remark,
                    createdBy,
                });
            }

            await prisma.event.update({
                where: { id: event.id },
                data: {
                    pointsAwarded: { increment: amount * eligibleGuests.length }
                },
            });

            return res.status(201).json(transactions);
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
export default { createEvent,getEvents,getEventById,updateEvent,deleteEvent,addEventOrganizer,removeEventOrganizer,addEventGuest,removeEventGuest,addSelfAsGuest,removeSelfAsGuest,createEventTransaction };
