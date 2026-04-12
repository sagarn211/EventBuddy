const express = require("express");
const router = express.Router();

const planController = require("../controllers/plan.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Protected routes
router.post("/", authMiddleware, planController.createPlan);
router.post("/:id/join", authMiddleware, planController.joinPlan);
router.post("/:id/leave", authMiddleware, planController.leavePlan);
router.post("/:id/end", authMiddleware, planController.endPlan);
router.post("/:id/save", authMiddleware, planController.savePlan);
router.post("/:id/unsave", authMiddleware, planController.unsavePlan);
router.put("/:id", authMiddleware, planController.updatePlan);
router.delete("/:id", authMiddleware, planController.deletePlan);
router.get("/user/my-plans", authMiddleware, planController.getUserPlans);
router.get("/nearby", authMiddleware, planController.getNearbyPlans);

// Public routes
router.get("/counts", planController.getCategoryCounts);
router.get("/", planController.getPlans);
router.get("/:id", planController.getPlanById);

module.exports = router;