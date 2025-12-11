"use strict";

const express = require("express");
const router = express.Router();
const PromotionController = require("../controllers/promotionController");
const authMiddleware = require("../auth/userAuthentication");

router.post("/promotions", authMiddleware(["manager", "superuser"]), PromotionController.createPromotion);
router.get("/promotions", authMiddleware(["regular", "cashier", "manager", "superuser"]), PromotionController.getPromotions);
router.get("/promotions/:promotionId", authMiddleware(["regular", "cashier", "manager", "superuser"]), PromotionController.getPromotionById);
router.patch("/promotions/:promotionId", authMiddleware(["manager", "superuser"]), PromotionController.updatePromotion);
router.delete("/promotions/:promotionId", authMiddleware(["manager", "superuser"]), PromotionController.deletePromotion);


module.exports = router;