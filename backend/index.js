#!/usr/bin/env node
'use strict';

import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import userRoutes from "./src/routes/userRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import transactionRoutes from "./src/routes/transactionRoutes.js";
import eventRoutes from "./src/routes/eventRoutes.js";
import promotionRoutes from "./src/routes/promotionRoutes.js";

// Load environment variables
dotenv.config();

const port = (() => {
    const args = process.argv;

    if (args.length !== 3) {
        console.error("usage: node index.js port");
        process.exit(1);
    }

    const num = parseInt(args[2], 10);
    if (isNaN(num)) {
        console.error("error: argument must be an integer.");
        process.exit(1);
    }

    return num;
})();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("missing JWT_SECRET");
    process.exit(1);
}

const app = express();

// =============================================================================
// SECURITY: HTTPS Headers (Helmet)
// =============================================================================
// Note: CSP disabled for development (localhost cross-port communication)
// Enable CSP in production with proper domain configuration
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for localhost development
    hsts: {
        maxAge: 31536000, // 1 year - forces HTTPS in production
        includeSubDomains: true,
        preload: true
    }
}));

// =============================================================================
// CORS Configuration
// =============================================================================
const allowedOrigins = [
    'https://loyaloop-production.up.railway.app',
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

app.use(express.json());

// Handle preflight requests
app.options('*', cors());

// Set JWT secret on app for middleware access
app.set("jwtSecret", JWT_SECRET);

// Register routes
app.use(authRoutes);
app.use(userRoutes);
app.use(transactionRoutes);
app.use(eventRoutes);
app.use(promotionRoutes)


const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`cannot start server: ${err.message}`);
    process.exit(1);
});

export default app;
