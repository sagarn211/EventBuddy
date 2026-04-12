const planService = require("../services/plan.service");
const { getIO } = require("../services/socket.service");

module.exports.createPlan = async (req, res) => {
    try {
        const userId = req.user ? req.user._id : req.body.userId;
        const plan = await planService.createPlan({ userId, ...req.body });
        
        // Notify via socket
        const io = getIO();
        io.emit("planCreated", plan);
        
        res.status(201).json({ success: true, data: plan });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.getPlans = async (req, res) => {
    try {
        const { category } = req.query;
        const filters = {};
        if (category && category !== "all") {
            filters.category = category;
        }
        const plans = await planService.getPlans(filters);
        res.status(200).json({ success: true, data: plans });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.getCategoryCounts = async (req, res) => {
    try {
        const counts = await planService.getCategoryCounts();
        res.status(200).json({ success: true, data: counts });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.getPlanById = async (req, res) => {
    try {
        const plan = await planService.getPlanById(req.params.id);
        res.status(200).json({ success: true, data: plan });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.joinPlan = async (req, res) => {
    try {
        const userId = req.user._id;
        const planId = req.params.id;
        const plan = await planService.joinPlan(planId, userId);
        
        // Notify via socket
        const io = getIO();
        io.to(`plan:${planId}`).emit("memberJoined", {
            userId,
            plan
        });
        
        res.status(200).json({ success: true, data: plan });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.getUserPlans = async (req, res) => {
    try {
        const userId = req.user ? req.user._id : req.params.userId;
        const plans = await planService.getUserPlans(userId);
        res.status(200).json({ success: true, data: plans });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.updatePlan = async (req, res) => {
    try {
        const planId = req.params.id;
        const plan = await planService.updatePlan(planId, req.body);
        
        // Notify via socket
        const io = getIO();
        io.to(`plan:${planId}`).emit("planUpdated", plan);
        
        res.status(200).json({ success: true, data: plan });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.deletePlan = async (req, res) => {
    try {
        const planId = req.params.id;
        await planService.deletePlan(planId);
        res.status(200).json({ success: true, message: "Plan deleted" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.leavePlan = async (req, res) => {
    try {
        const userId = req.user._id;
        const planId = req.params.id;
        const plan = await planService.leavePlan(planId, userId);
        
        // Notify via socket
        const io = getIO();
        io.to(`plan:${planId}`).emit("memberLeft", { userId });
        
        res.status(200).json({ success: true, data: plan });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.getNearbyPlans = async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: "Latitude and longitude required" });
        }
        const plans = await planService.getNearbyPlans(
            parseFloat(lat),
            parseFloat(lng),
            radius ? parseFloat(radius) : 15000
        );
        res.status(200).json({ success: true, data: plans });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.endPlan = async (req, res) => {
    try {
        const userId = req.user._id;
        const planId = req.params.id;
        const plan = await planService.endPlan(planId, userId);
        
        // Notify via socket
        const io = getIO();
        io.to(`plan:${planId}`).emit("planEnded", plan);
        
        res.status(200).json({ success: true, data: plan, message: "Event ended successfully" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.savePlan = async (req, res) => {
    try {
        const userId = req.user._id;
        const planId = req.params.id;
        
        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID not found" });
        }
        
        const savedPlan = await planService.savePlan(planId, userId);
        res.status(200).json({ success: true, data: savedPlan, message: "Plan saved" });
    } catch (err) {
        console.error("Save plan error:", err);
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.unsavePlan = async (req, res) => {
    try {
        const userId = req.user._id;
        const planId = req.params.id;
        const result = await planService.unsavePlan(planId, userId);
        res.status(200).json({ success: true, data: result, message: "Plan removed from saved" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
