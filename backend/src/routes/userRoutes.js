import express from "express";
import UserController from "../controllers/userController.js";
import authMiddleware from "../auth/userAuthentication.js";
import multer from 'multer';

const router = express.Router();
const upload = multer();

router.post("/users", authMiddleware(["cashier", "manager", "superuser"]), UserController.createUser);
router.get("/users", authMiddleware(["manager", "superuser"]), UserController.getUsers);

router.patch("/users/me", authMiddleware(["regular", "cashier", "manager", "superuser"]), upload.single('avatar'), UserController.updateMe);
router.get("/users/me", authMiddleware(["regular", "cashier", "manager", "superuser"]), UserController.getCurrentUser);
router.patch("/users/me/password", authMiddleware(["regular", "cashier", "manager", "superuser"]), UserController.updateMePassword);

router.get("/users/:userId", authMiddleware(["cashier", "manager", "superuser"]), UserController.getUser);
router.patch("/users/:userId", authMiddleware(["manager", "superuser"]), UserController.updateUser);
router.delete("/users/:userId", authMiddleware(["manager", "superuser"]), UserController.deleteUser);

export default router;
