const planModel = require('../models/plan.model');
const notificationService = require('./notification.service');

//Create Plan
module.exports.createPlan = async (data) => {
    const { userId, ...planData } = data || {};
    if (!userId) {
        throw new Error("User ID is required");
    }
    const plan = await planModel.create({
        ...planData,
        createdBy: userId,
        participants: [userId],
    });

    // If it's an official event, notify nearby users (20-30km)
    if (plan.isOfficial) {
        console.log(`[PLAN] Official event "${plan.title}" created. Triggering nearby notifications...`);
        notificationService.notifyNearbyUsers(plan).catch(err => {
            console.error("[PLAN] Error notifying nearby users:", err);
        });
    }

    return plan;
};

//Get Plans
module.exports.getPlans = async (filters = {}) =>{
    return await planModel.find(filters)
    .populate("createdBy", "name avatar phone")
    .populate("participants", "name avatar phone")
    .sort({ createdAt: -1 });
};

//Get counts for trending categories
module.exports.getCategoryCounts = async () => {
    return await planModel.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);
};

//Join Plan
module.exports.joinPlan = async (planId, userId) => {
    const plan = await planModel.findById(planId);

    if(!plan) {
        throw new Error("Plan not found");
    }

    if(!plan.participants.includes(userId)) {
        plan.participants.push(userId);
        await plan.save();
    }

    return await planModel.findById(planId).populate("createdBy", "name avatar phone").populate("participants", "name avatar phone");
};

//Get Plan by ID
module.exports.getPlanById = async (id) => {
    return await planModel.findById(id)
    .populate("createdBy", "name avatar phone")
    .populate("participants", "name avatar phone");
};

// Get user's plans
module.exports.getUserPlans = async (userId) => {
    return await planModel.find({
        $or: [
            { createdBy: userId },
            { participants: userId }
        ]
    })
    .populate("createdBy", "name avatar phone")
    .populate("participants", "name avatar phone")
    .sort({ createdAt: -1 });
};

// Update plan
module.exports.updatePlan = async (planId, data) => {
    return await planModel.findByIdAndUpdate(
        planId,
        data,
        { new: true }
    )
    .populate("createdBy", "name avatar phone")
    .populate("participants", "name avatar phone");
};

// Delete plan
module.exports.deletePlan = async (planId) => {
    return await planModel.findByIdAndDelete(planId);
};

// Leave plan
module.exports.leavePlan = async (planId, userId) => {
    const plan = await planModel.findById(planId);
    
    if (!plan) {
        throw new Error("Plan not found");
    }

    plan.participants = plan.participants.filter(id => id.toString() !== userId.toString());
    await plan.save();
    
    return await planModel.findById(planId).populate("createdBy", "name avatar phone").populate("participants", "name avatar phone");
};

// Get nearby plans
module.exports.getNearbyPlans = async (lat, lng, radius = 15000) => {
    return await planModel.find({
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [lng, lat]
                },
                $maxDistance: radius
            }
        },
        status: "active"
    })
    .populate("createdBy", "name avatar phone")
    .populate("participants", "name avatar phone")
    .sort({ createdAt: -1 });
};

// Backward-compatible aliases
module.exports.creatPlan = module.exports.createPlan;
module.exports.joinPlsn = module.exports.joinPlan;

// End plan
module.exports.endPlan = async (planId, userId) => {
    const plan = await planModel.findById(planId);
    
    if (!plan) {
        throw new Error("Plan not found");
    }

    // Check if user is the host
    if (plan.createdBy.toString() !== userId.toString()) {
        throw new Error("Only the host can end the event");
    }

    plan.status = "ended";
    await plan.save();
    
    return await planModel.findById(planId).populate("createdBy", "name avatar phone").populate("participants", "name avatar phone");
};

// Save plan
module.exports.savePlan = async (planId, userId) => {
    const plan = await planModel.findById(planId);
    
    if (!plan) {
        throw new Error("Plan not found");
    }

    // Add user to savedBy if not already there
    const userIdString = userId.toString();
    const isSaved = plan.savedBy.some(id => id.toString() === userIdString);
    
    if (!isSaved) {
        plan.savedBy.push(userId);
        await plan.save();
    }
    
    return await planModel.findById(planId).populate("createdBy", "name avatar phone").populate("participants", "name avatar phone");
};

// Unsave plan
module.exports.unsavePlan = async (planId, userId) => {
    const plan = await planModel.findById(planId);
    
    if (!plan) {
        throw new Error("Plan not found");
    }

    // Remove user from savedBy
    plan.savedBy = plan.savedBy.filter(id => id.toString() !== userId.toString());
    await plan.save();
    
    return await planModel.findById(planId).populate("createdBy", "name avatar phone").populate("participants", "name avatar phone");
};

// Get saved plans
module.exports.getSavedPlans = async (userId) => {
    return await planModel.find({
        savedBy: userId
    })
    .populate("createdBy", "name avatar phone")
    .populate("participants", "name avatar phone")
    .populate("savedBy", "name avatar phone")
    .sort({ createdAt: -1 });
};
