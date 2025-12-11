"use strict";

const express = require("express");
const router = express.Router();
const TransactionController = require("../controllers/transactionController");
const authMiddleware = require("../auth/userAuthentication");

router.post("/transactions", authMiddleware(["cashier", "manager", "superuser"]), TransactionController.createTransaction);
// router.post("/transactions", authMiddleware(["manager", "superuser"]), TransactionController.createTransaction);

router.get("/transactions", authMiddleware(["manager", "superuser"]), TransactionController.getTransactions);
router.get("/transactions/:transactionId", authMiddleware(["regular", "cashier", "manager", "superuser"]), TransactionController.getTransaction);
router.patch("/transactions/:transactionId/suspicious", authMiddleware(["manager", "superuser"]), TransactionController.setTransactionSuspicious);

// IMPORTANT: Specific routes must come BEFORE parameterized routes
// /users/me/transactions must be defined BEFORE /users/:userId/transactions
router.post("/users/me/transactions", authMiddleware(["regular", "cashier", "manager", "superuser"]), TransactionController.createRedemption);
router.get("/users/me/transactions", authMiddleware(["regular", "cashier", "manager", "superuser"]), TransactionController.getMyTransactions);

// Parameterized route comes after specific routes
router.post("/users/:userId/transactions", authMiddleware(["regular", "cashier", "manager", "superuser"]), TransactionController.createTransfer);

router.patch("/transactions/:transactionId/processed", authMiddleware(["cashier", "manager", "superuser"]), TransactionController.processRedemption);

module.exports = router;