import express from "express";
import EventController from "../controllers/eventController.js";
import authMiddleware from "../auth/userAuthentication.js";

const router = express.Router();

router.post("/events", authMiddleware(["manager", "superuser"]), EventController.createEvent);
router.get("/events", authMiddleware(["regular", "cashier", "manager", "superuser"]), EventController.getEvents);

router.get("/events", authMiddleware(["manager", "superuser"]), EventController.getEvents);
router.get("/events/:eventId", authMiddleware(["regular", "cashier", "manager", "superuser"]), EventController.getEventById);
router.get("/events/:eventId", authMiddleware(["manager", "superuser"]), EventController.getEventById);
router.patch("/events/:eventId", authMiddleware(["manager", "superuser"]), EventController.updateEvent);
router.delete("/events/:eventId", authMiddleware(["manager", "superuser"]), EventController.deleteEvent);
router.post("/events/:eventId/organizers", authMiddleware(["manager", "superuser"]), EventController.addEventOrganizer);
router.delete("/events/:eventId/organizers/:userId", authMiddleware(["manager", "superuser"]), EventController.removeEventOrganizer);
router.post("/events/:eventId/guests", authMiddleware(["regular", "cashier", "manager", "superuser"]), EventController.addEventGuest);
router.delete("/events/:eventId/guests/:userId", authMiddleware(["manager", "superuser"]), EventController.removeEventGuest);
router.post("/events/:eventId/guests/me", authMiddleware(["regular", "cashier", "manager", "superuser"]), EventController.addSelfAsGuest);
router.delete("/events/:eventId/guests/me", authMiddleware(["regular", "cashier", "manager", "superuser"]), EventController.removeSelfAsGuest);
router.post("/events/:eventId/transactions", authMiddleware(["manager", "superuser"]), EventController.createEventTransaction);

export default router;
