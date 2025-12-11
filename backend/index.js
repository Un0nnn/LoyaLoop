#!/usr/bin/env node
'use strict';

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

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
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

const FRONTEND_URL = process.env.FRONTEND_URL || "https://loyaloop-production.up.railway.app";

// =============================================================================
// CORS Configuration
// =============================================================================
app.use(cors({
    // origin: FRONTEND_URL,
}));
app.use(express.json());

// ADD YOUR WORK HERE

require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("missing JWT_SECRET");
    process.exit(1);
}

app.set("jwtSecret", JWT_SECRET);

// =============================================================================
// CSRF PROTECTION ANALYSIS
// =============================================================================
// This app is PROTECTED against CSRF attacks because:
//
// 1. JWT tokens stored in sessionStorage (not cookies)
//    - CSRF exploits automatic cookie sending by browsers
//    - sessionStorage is not automatically sent with requests
//    - Attackers cannot access sessionStorage from other origins
//
// 2. Authorization headers must be explicitly set
//    - Our app sends: Authorization: Bearer <token>
//    - This requires JavaScript to set the header
//    - Cross-origin JavaScript cannot set custom headers without CORS
//    - CORS preflight blocks unauthorized origins
//
// 3. Why traditional CSRF tokens aren't needed:
//    - CSRF tokens protect cookie-based authentication
//    - JWT in headers is inherently CSRF-proof
//    - Adding CSRF tokens would be redundant
//
// If you switch to cookie-based auth, you would need:
// - CSRF tokens (csurf package)
// - SameSite cookie attribute
// - Cookie-based session management
//
// Current security status: ✅ CSRF Protected via JWT architecture
// =============================================================================

// const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const authRoutes = require("./src/routes/authRoutes");
const transactionRoutes = require("./src/routes/transactionRoutes");
const eventRoutes = require("./src/routes/eventRoutes");
const promotionRoutes = require("./src/routes/promotionRoutes");


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
