'use strict';

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

const resetRequestTimestamps = new Map();

// Optional: configure nodemailer if SMTP env vars are present
let mailer = null;
try {
    const nodemailer = require('nodemailer');
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = process.env.SMTP_PORT;
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;

    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
        mailer = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
        });
    }
} catch (e) {
    // nodemailer not installed or other error - mailer remains null
}

exports.authenticateUser = async (req, res) => {
    try {
        const { utorid, password } = req.body;

        if (!utorid || !password) {
            return res.status(400).json({ error: "utorid and password are required" });
        }

        let user = await prisma.user.findUnique({
            where: { utorid },
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid utorid or password" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        console.log("Valid password:", validPassword);

        if (!validPassword) {
            return res.status(401).json({ error: "Invalid utorid or password" });
        }

        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                lastLogin: new Date(),
            }
        });
        const token = jwt.sign(
            {
                id: user.id,
                utorid: user.utorid,
                role: user.role,
                email: user.email,
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 1000);

        user = await prisma.user.findUnique({
            where: { utorid },
        });

        return res.status(200).json({
            user,
            token,
            expiresAt,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.requestPasswordReset = async (req, res) => {
    try {
        const { utorid, email } = req.body;

        if (!utorid) {
            return res.status(400).json({ error: "utorid is required" });
        }
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
        const key = `${ip}|${utorid}`;
        const now = Date.now();
        const last = resetRequestTimestamps.get(key) || 0;
        if (now - last < 60 * 1000) {
            return res.status(429).json({ error: "Too many requests. Please try again later." });
        }
        resetRequestTimestamps.set(key, now);

        const user = await prisma.user.findUnique({ where: { utorid } });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // SECURITY: Only allow reset requests for a user if:
        // - the requester is authenticated and either the same utorid or is manager/superuser, OR
        // - the requester provides the user's registered email in the request body and it matches the user's email
        // This prevents unauthenticated callers from requesting resets for arbitrary users without proving ownership of the email.
        const requester = req.user || null;
        const isAuthedRequesterSameUser = requester && (requester.utorid === utorid);
        const isAuthedManager = requester && (requester.role === 'manager' || requester.role === 'superuser');

        if (!isAuthedRequesterSameUser && !isAuthedManager) {
            // unauthenticated or different authenticated user
            if (!email) {
                return res.status(403).json({ error: 'Email required to request a password reset for this user' });
            }
            // compare case-insensitively
            if ((String(email).trim().toLowerCase()) !== (String(user.email || '').trim().toLowerCase())) {
                return res.status(403).json({ error: 'Email does not match user records' });
            }
        }

        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        const resetToken = uuidv4();

        if (user) {
            await prisma.resetPassword.create({
                data: { userId: user.id, token: resetToken, expiresAt },
            });
        }

        // If mailer configured, attempt to send an email. If email sending fails, fall back to returning token in response.
        if (mailer) {
            try {
                const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/resets/${resetToken}`;
                const mailOptions = {
                    from: process.env.SMTP_FROM || process.env.SMTP_USER,
                    to: user.email,
                    subject: 'CSSU Rewards - Password reset',
                    text: `You requested a password reset. Use the following link to reset your password (expires in 1 hour): ${resetUrl}`,
                    html: `<p>You requested a password reset. Click the link below to reset your password (expires in 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
                };
                await mailer.sendMail(mailOptions);
                return res.status(202).json({ expiresAt, message: 'Reset email sent' });
            } catch (mailErr) {
                console.error('Failed to send reset email:', mailErr);
                // fall through to return token in body only when caller was authorized (authed same user or manager) or provided matching email
            }
        }

        // Default behaviour: return the token in the response for authorized callers
        // (authorized if authenticated as same user, manager/superuser, or provided matching email above)
        return res.status(202).json({ expiresAt, resetToken });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.resetPasswordWithToken = async (req, res) => {
    try {
        const { resetToken } = req.params;
        const { utorid, password } = req.body;

        if (!utorid || !password) {
            return res.status(400).json({ error: "utorid and password are required" });
        }

        const resetEntry = await prisma.resetPassword.findUnique({
            where: { token: resetToken },
        });

        if (!resetEntry) {
            return res.status(404).json({ error: "Reset token not found" });
        }

        // Determine if the token is invalid for any of the following reasons:
        // - it has already been used
        // - it is expired (current time >= expiresAt)
        // - there is a newer token for the same user (only the most recent token is valid)
        const now = new Date();
        const expiresAt = new Date(resetEntry.expiresAt);

        // Find the newest token entry for this user; compare tokens by id (autoincrement) ordering
        const latestForUser = await prisma.resetPassword.findFirst({
            where: { userId: resetEntry.userId },
            orderBy: { id: 'desc' },
        });

        // If it was used, expired, or not the latest token -> consider it gone
        if (resetEntry.used || now >= expiresAt || !latestForUser || latestForUser.token !== resetToken) {
            return res.status(410).json({ message: "Token expired" });
        }

        const user = await prisma.user.findUnique({ where: { id: resetEntry.userId } });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.utorid !== utorid) {
            return res.status(401).json({ error: "utorid does not match token" });
        }

        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/;

        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                error: "Password must be 8–20 chars, include uppercase, lowercase, number, and special character.",
            });
        }

        const hashed = await bcrypt.hash(password, 12);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashed },
        });

        await prisma.resetPassword.update({
            where: { token: resetToken },
            data: { used: true },
        });

        // await prisma.resetPassword.delete({ where: { token: resetToken } });

        return res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
