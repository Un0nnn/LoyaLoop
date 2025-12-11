'use strict'

const jwt = require("jsonwebtoken");

const authMiddleware = (allowedRoles = []) => {
    return (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            console.log(authHeader);
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({error:"Not authorized"});
            }
            const token = authHeader.substring(7, authHeader.length);

            const jwtSecret = req.app.get("jwtSecret");

            if (!jwtSecret) {
                return res.status(500).json({error:  "Server configuration error"});
            }
            const decoded = jwt.verify(token, jwtSecret);
            console.log(decoded);
            req.user = {
                id: decoded.id,
                utorid: decoded.utorid,
                role: decoded.role,
                email: decoded.email,
            }
            if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
                return res.status(403).json({error:"Insufficient permissions"});
            }
            next();
        }
        catch (error) {
            return res.status(401).json({ error: "Not authorized" });
        }
    }
}

module.exports = authMiddleware;