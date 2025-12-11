import express from "express";
import PromotionController from "../controllers/promotionController.js";
import authMiddleware from "../auth/userAuthentication.js";

const router = express.Router();

router.post("/promotions", authMiddleware(["manager", "superuser"]), PromotionController.createPromotion);
router.get("/promotions", authMiddleware(["regular", "cashier", "manager", "superuser"]), PromotionController.getPromotions);
router.get("/promotions/:promotionId", authMiddleware(["regular", "cashier", "manager", "superuser"]), PromotionController.getPromotionById);
router.patch("/promotions/:promotionId", authMiddleware(["manager", "superuser"]), PromotionController.updatePromotion);
router.delete("/promotions/:promotionId", authMiddleware(["manager", "superuser"]), PromotionController.deletePromotion);

export default router;
