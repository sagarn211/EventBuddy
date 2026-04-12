const badgeModel = require("../models/badge.model");
const userModel = require("../models/user.model");

//Assign badge
module.exports.assignBadge = async (userId, badgeName) => {
    let badge = await badgeModel.findOne({ name: badgeName });

    if(!badge){
        badge = await badgeModel.create({ name: badgeName });
    }

    const user = await userModel.findById(userId);

    if(!user.badges.includes(badge._id)){
        user.badges.push(badge._id);
        await user.save();
    }

    return badge;
};

//Get badges
module.exports.getBadges = async (userId) =>{
    return await userModel.findById(userId).populate("badges");
};

// Backward-compatible alias
module.exports.getUserBadges = module.exports.getBadges;
