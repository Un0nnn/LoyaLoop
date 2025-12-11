const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();
const { v4: uuidv4 } = require("uuid");

exports.createUser = async (req, res) => {
    try {
        let { utorid, name, email} = req.body;

        if (!utorid || !name || !email) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        utorid = utorid.trim();
        name = name.trim();
        email = email.trim().toLowerCase();

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { utorid },
                    { email }
                ]
            }
        });

        if (existingUser) {
            return res.status(409).json({ error: "User already exists" });
        }

        if (utorid.length !== 7 && utorid.length !== 8) {
            return res.status(400).json({
                error: "Utorid is not 7 or 8 characters long",
            })
        }

        if (name.length < 1 || name.length > 50) {
            return res.status(400).json({
                error: "Invalid name length",
            })
        }

        const utoridRegex = /^[a-zA-Z0-9]{7,8}$/;
        if (!utoridRegex.test(utorid)) {
            return res.status(400).json({ error: "Invalid UTORid format" });
        }

        const emailRegex = /^[A-Za-z0-9._%+-]+@mail\.utoronto\.ca$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid University of Toronto email" });
        }

        const tempPassword = uuidv4();
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                utorid,
                name,
                points: 0,
                verified: false,
                activated: false,
            }
        });

        const resetToken = uuidv4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await prisma.resetPassword.create({
            data: {
                token: resetToken,
                expiresAt: expiresAt,
                userId: newUser.id
            }
        })

        return res.status(201).json({
            id: newUser.id,
            utorid: newUser.utorid,
            name: newUser.name,
            email: newUser.email,
            verified: newUser.verified,
            expiresAt: expiresAt,
            resetToken: resetToken,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        if (page <= 0 || limit <= 0) {
            return res.status(400).json({ error: "Invalid page or limit" });
        }

        const filters = {};
        if (req.query.role) filters.role = req.query.role;
        if (req.query.verified !== undefined) filters.verified = req.query.verified === "true";
        if (req.query.activated !== undefined) filters.lastLogin = req.query.activated === "true" ? { not: null } : null;
        if (req.query.name) {
            const q = String(req.query.name);
            filters.OR = [
                { utorid: { contains: q } },
                { name: { contains: q } },
            ];
        }

        const total = await prisma.user.count({ where: filters });

        const users = await prisma.user.findMany({
            where: filters,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { id: "asc" },
            select: {
                id: true,
                utorid: true,
                name: true,
                email: true,
                birthday: true,
                role: true,
                points: true,
                createdAt: true,
                lastLogin: true,
                verified: true,
                avatarUrl: true,
            },
        });

        const results = users.map(user => ({
            id: user.id,
            utorid: user.utorid,
            name: user.name,
            email: user.email,
            birthday: user.birthday,
            role: user.role,
            points: user.points,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            verified: user.verified,
            avatarUrl: user.avatarUrl,
        }));

        return res.status(200).json({ count: total, results });
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ error: error.message });
    }
};

exports.getUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        if (!userId || isNaN(userId) || userId <= 0) {
            return res.status(400).json({ error: "Invalid user id" });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                utorid: true,
                name: true,
                email: true,
                birthday: true,
                role: true,
                points: true,
                createdAt: true,
                lastLogin: true,
                verified: true,
                avatarUrl: true,
                usedPromotions: {
                    where: {
                        // Only include one-time promotions (those with points)
                        promotion: {
                            points: { not: null }
                        }
                    },
                    select: {
                        promotion: {
                            select: {
                                id: true,
                                name: true,
                                minSpending: true,
                                rate: true,
                                points: true,
                            }
                        }
                    }
                },
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Format promotions to flatten the structure
        const formattedPromotions = user.usedPromotions.map(up => up.promotion);

        // Check clearance level
        const userRole = req.user.role;
        const isCashier = userRole === 'cashier';
        const isManagerOrHigher = ['manager', 'superuser'].includes(userRole);

        if (isCashier) {
            // Cashier can only see limited information
            return res.status(200).json({
                id: user.id,
                utorid: user.utorid,
                name: user.name,
                points: user.points,
                verified: user.verified,
                promotions: formattedPromotions,
            });
        } else if (isManagerOrHigher) {
            // Manager or higher can see full information
            return res.status(200).json({
                id: user.id,
                utorid: user.utorid,
                name: user.name,
                email: user.email,
                birthday: user.birthday,
                role: user.role,
                points: user.points,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,
                verified: user.verified,
                avatarUrl: user.avatarUrl,
                promotions: formattedPromotions,
            });
        } else {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        if (!userId || isNaN(userId) || userId <= 0) {
            return res.status(400).json({ error: "Invalid user id" });
        }

        const { email, verified, suspicious, role } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (verified === false) {
            return res.status(400).json({ error: "Cannot update non-verified user" });
        }

        const updates = {};

        if (email !== undefined && email !== null) {
            const emailRegex = /^[A-Za-z0-9._%+-]+@mail\.utoronto\.ca$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: "Invalid University of Toronto email" });
            }
            updates.email = email.toLowerCase();
        }

        if (verified !== undefined && verified !== null) {
            if (typeof verified !== 'boolean') {
                return res.status(400).json({ error: 'Invalid verified value' });
            }
            updates.verified = verified;
        }

        // Parse suspicious value
        let suspiciousValue = user.suspicious; // Start with current value
        if (suspicious !== undefined && suspicious !== null) {
            let sVal = suspicious;
            if (typeof sVal === 'string') {
                const lower = sVal.toLowerCase();
                if (lower === 'true') sVal = true;
                else if (lower === 'false') sVal = false;
                else return res.status(400).json({ error: 'Invalid suspicious value' });
            }
            if (typeof sVal !== 'boolean') {
                return res.status(400).json({ error: 'Invalid suspicious value' });
            }
            suspiciousValue = sVal;
            updates.suspicious = sVal;
        }

        if (role !== undefined && role !== null) {
             // Validate role value
             if (!['regular', 'cashier', 'manager', 'superuser'].includes(role)) {
                 return res.status(400).json({ error: "Invalid role" });
             }

             // Check manager permissions
             if (req.user.role === 'manager') {
                 if (!['regular', 'cashier'].includes(role)) {
                     return res.status(403).json({ error: "Managers can only assign regular or cashier roles" });
                 }
             }

             // Check superuser permissions
             if (req.user.role !== "superuser" && role === "superuser") {
                 return res.status(403).json({ error: "Only superusers can create superusers" });
             }

             updates.role = role;
         }

        // Validate cashier + suspicious constraints
        // When promoting to cashier, ensure the user is not suspicious
        if (role === "cashier") {
            // If the request explicitly sets suspicious to true, reject
            if (suspiciousValue === true) {
                return res.status(400).json({ error: "Cannot assign cashier role to a suspicious user" });
            }

            // Ensure suspicious is set to false when promoting to cashier (if not provided)
            if (suspicious === undefined) {
                updates.suspicious = false;
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "No valid fields to update" });
        }

        let updatedUser;
        try {
            updatedUser = await prisma.user.update({
                where: { id: userId },
                data: updates,
                select: {
                    id: true,
                    utorid: true,
                    name: true,
                    email: true,
                    verified: true,
                    suspicious: true,
                    role: true
                }
            });
        } catch (e) {
            if (e.code === "P2002" && e.meta?.target?.includes("email")) {
                return res.status(400).json({ error: "Email already in use" });
            }
            throw e;
        }

        // Build response with only updated fields
        const response = {
            id: updatedUser.id,
            utorid: updatedUser.utorid,
            name: updatedUser.name,
        };

        // Add only the fields that were actually updated
        if ('email' in updates) response.email = updatedUser.email;
        if ('verified' in updates) response.verified = updatedUser.verified;
        if ('suspicious' in updates) response.suspicious = updatedUser.suspicious;
        if ('role' in updates) response.role = updatedUser.role;

        return res.status(200).json(response);
    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ error: error.message });
    }
};

// Delete a user and clean up dependent records. Protected to manager/superuser via routes.
exports.deleteUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (!userId || isNaN(userId) || userId <= 0) {
            return res.status(400).json({ error: 'Invalid user id' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Remove dependent records that reference the user to avoid foreign key errors.
        // Transactions where user was customer, cashier or target
        await prisma.transaction.deleteMany({ where: { OR: [{ userId }, { cashierId: userId }, { targetUserId: userId }] } });

        // Promotion uses
        await prisma.promotionUse.deleteMany({ where: { userId } }).catch(() => {});

        // Event organizers and guests
        await prisma.eventOrganizer.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.eventGuest.deleteMany({ where: { userId } }).catch(() => {});

        // Reset tokens
        await prisma.resetPassword.deleteMany({ where: { userId } }).catch(() => {});

        // Finally delete the user
        await prisma.user.delete({ where: { id: userId } });

        return res.status(200).json({ success: true, id: userId });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ error: error.message });
    }
};

exports.updateMe = async (req, res) => {
    try {
        const userId = req.user.id;
        let { name, email, birthday } = req.body || {};
        // multer may put file in req.file; some clients might send avatar as a string field
        const avatar = req.file || (req.body && req.body.avatar ? { originalname: req.body.avatar } : null);

        console.log('updateMe called - body keys:', Object.keys(req.body || {}), 'file:', !!req.file);

        // Normalize empty strings to undefined
        if (typeof name === 'string') name = name.trim();
        if (name === '') name = undefined;
        if (typeof email === 'string') email = email.trim();
        if (email === '') email = undefined;
        if (typeof birthday === 'string') birthday = birthday.trim();
        if (birthday === '') birthday = undefined;

        const dataToUpdate = {};

        // If no fields provided and no avatar file, return 400
        if (name === undefined && email === undefined && birthday === undefined && !avatar) {
            console.log('updateMe: no fields provided');
            return res.status(400).json({ error: "No fields provided" });
        }

        if (name !== undefined) {
            if (typeof name !== 'string' || name.length < 1 || name.length > 50) {
                return res.status(400).json({ error: "Name must be between 1 and 50 characters" });
            }
            dataToUpdate.name = name;
        }

        if (email !== undefined) {
            if (typeof email !== 'string') {
                return res.status(400).json({ error: "Invalid email format" });
            }
            const emailRegex = /^[A-Za-z0-9._%+-]+@mail\.utoronto\.ca$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: "Email must be a valid UofT email" });
            }
            dataToUpdate.email = email.toLowerCase();
        }

        if (birthday !== undefined) {
            if (birthday === null || birthday === 'null') {
                dataToUpdate.birthday = null;
            } else {
                // Accept YYYY-MM-DD or ISO date strings
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(birthday)) {
                    return res.status(400).json({ error: "Birthday must be in YYYY-MM-DD format" });
                }
                // Build UTC midnight date to store in DB
                const birthdayDate = new Date(birthday + 'T00:00:00.000Z');
                if (isNaN(birthdayDate.getTime())) {
                    return res.status(400).json({ error: "Invalid birthday date" });
                }
                dataToUpdate.birthday = birthdayDate;
            }
        }

        if (avatar) {
            // multer memory storage provides originalname; when disk storage used, filename may exist
            const filename = avatar.filename || avatar.originalname || `${req.user.utorid}`;
            dataToUpdate.avatarUrl = `/uploads/avatars/${filename}`;
        }

        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({ error: "No valid fields to update" });
        }

        let updatedUser;
        try {
            updatedUser = await prisma.user.update({
                where: { id: userId },
                data: dataToUpdate,
                select: {
                    id: true,
                    utorid: true,
                    name: true,
                    email: true,
                    birthday: true,
                    role: true,
                    points: true,
                    createdAt: true,
                    lastLogin: true,
                    verified: true,
                    avatarUrl: true,
                },
            });
        } catch (error) {
            if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
                return res.status(400).json({ error: 'Email already in use' });
            }
            throw error;
        }

        const response = {
            id: updatedUser.id,
            utorid: updatedUser.utorid,
            name: updatedUser.name,
            email: updatedUser.email,
            birthday: updatedUser.birthday ? updatedUser.birthday.toISOString().split('T')[0] : null,
            role: updatedUser.role,
            points: updatedUser.points,
            createdAt: updatedUser.createdAt,
            lastLogin: updatedUser.lastLogin,
            verified: updatedUser.verified,
            avatarUrl: updatedUser.avatarUrl,
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error('Error updating user (updateMe):', error);
        return res.status(500).json({ error: "An unexpected error occurred" });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized: No user logged in" });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                utorid: true,
                name: true,
                email: true,
                role: true,
                points: true,
                createdAt: true,
                lastLogin: true,
                verified: true,
                avatarUrl: true,
                birthday: true,
                usedPromotions: {
                    select: {
                        id: true,
                        promotionId: true,
                        usedAt: true,
                        promotion: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                type: true,
                                startTime: true,
                                endTime: true,
                                minSpending: true,
                                rate: true,
                                points: true,
                            }
                        }
                    }
                },
                // NEVER include password
            },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({
            id: user.id,
            utorid: user.utorid,
            name: user.name,
            email: user.email,
            role: user.role,
            points: user.points,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            verified: user.verified,
            avatarUrl: user.avatarUrl,
            birthday: user.birthday,
            promotions: user.usedPromotions,
        });
    } catch (error) {
        console.error("Error retrieving current user:", error);
        return res.status(500).json({ error: error.message });
    }
};

exports.updateMePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { old, new: newPassword } = req.body;

        if (!old || !newPassword) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: "User not found" });

        const isValid = await bcrypt.compare(old, user.password);
        if (!isValid) {
            return res.status(403).json({ error: "Incorrect current password" });
        }

        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                error:
                    "New password must be 8–20 chars, include uppercase, lowercase, number, and special character.",
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({ error: "Failed to update password" });
    }
};