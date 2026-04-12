const userModel = require("../models/user.model");

//Create user
module.exports.createUser = async (data) => {
    return await userModel.create(data);
};

//Get profile
module.exports.getProfile = async(userId) => {
    return await userModel.findById(userId).populate("badges");
};

//Get user by id
module.exports.getUserById = async (userId) => {
    return await userModel.findById(userId).populate("badges");
};

//Update Profil
module.exports.updateProfile = async (userId, data) =>{
    return await userModel.findByIdAndUpdate(
        userId,
        data,
        { new: true }
    ).populate("badges");
};

//NearBY users
module.exports.getNearByUsers = async (lat ,lng , radius = 5000) => {
    return await userModel.find({
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [lng, lat],
                },
                $maxDistance: radius,
            },
        },
    }).select("-otp").populate("badges");
};

// Search users by name or interests
module.exports.searchUsers = async (query, limit = 10) => {
    return await userModel.find({
        $or: [
            { name: { $regex: query, $options: "i" } },
            { interests: { $regex: query, $options: "i" } }
        ]
    }).select("-otp").limit(limit);
};

// Get user by email
module.exports.getUserByEmail = async (email) => {
    return await userModel.findOne({ email }).populate("badges");
};

// Get user by phone
module.exports.getUserByPhone = async (phone) => {
    return await userModel.findOne({ phone }).populate("badges");
};

// Update user location
module.exports.updateUserLocation = async (userId, lat, lng) => {
    return await userModel.findByIdAndUpdate(
        userId,
        {
            location: {
                type: "Point",
                coordinates: [lng, lat]
            }
        },
        { new: true }
    );
};

// Get user credibility score
module.exports.getUserCredibility = async (userId) => {
    const user = await userModel.findById(userId).populate("badges");
    const credibilityScore = (user.badges?.length || 0) * 10 + (user.reviewsCount || 0) * 5;
    return {
        credibilityScore,
        badges: user.badges,
        reviewsCount: user.reviewsCount || 0
    };
};

// Get active buddies (contacts who have been recently active)
module.exports.getActiveBuddies = async (userId, limit = 20) => {
    try {
        const buddies = await userModel.find({
            _id: { $ne: userId }
        })
        .select("_id firstName lastName name avatar lastSeen isOnline status")
        .limit(limit)
        .lean();
        
        // Return with normalized field names
        return buddies.map(buddy => ({
            ...buddy,
            firstName: buddy.firstName || buddy.name || "",
        }));


    } catch (error) {
        console.error("getActiveBuddies service error:", error);
        throw new Error(`Failed to fetch active buddies: ${error.message}`);
    }
};

// Get all contacts for a user
module.exports.getContacts = async (userId, limit = 100, skip = 0) => {
    try {
        const user = await userModel.findById(userId)
            .select("contacts")
            .populate({
                path: "contacts",
                select: "firstName lastName name avatar lastSeen isOnline status",
                options: { limit, skip }
            })
            .lean();
        
        const contacts = user?.contacts || [];
        
        // Normalize field names
        return contacts.map(contact => ({
            ...contact,
            firstName: contact.firstName || contact.name || "",
        }));


    } catch (error) {
        console.error("getContacts service error:", error);
        throw new Error(`Failed to fetch contacts: ${error.message}`);
    }
};

// Add a contact
module.exports.addContact = async (userId, contactId) => {
    return await userModel.findByIdAndUpdate(
        userId,
        { $addToSet: { contacts: contactId } },
        { new: true }
    ).populate("contacts");
};

// Remove a contact
module.exports.removeContact = async (userId, contactId) => {
    return await userModel.findByIdAndUpdate(
        userId,
        { $pull: { contacts: contactId } },
        { new: true }
    ).populate("contacts");
};
// Get user leaderboard by badge count
module.exports.getLeaderboard = async (limit = 10) => {
    try {
        // Find users with populating badges to get count, or use aggregation for better performance
        // For simplicity with the current schema, we'll use find and sort after or use aggregation
        return await userModel.aggregate([
            {
                $project: {
                    name: 1,
                    avatar: 1,
                    badgeCount: { $size: { $ifNull: ["$badges", []] } }
                }
            },
            { $sort: { badgeCount: -1, name: 1 } },
            { $limit: limit }
        ]);
    } catch (error) {
        console.error("getLeaderboard service error:", error);
        throw new Error(`Failed to fetch leaderboard: ${error.message}`);
    }
};
