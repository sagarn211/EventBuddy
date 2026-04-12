const Message = require("../models/message.model");
const Plan = require("../models/plan.model");
const notificationService = require('./notification.service');

//Send Message 
module.exports.sendMessage = async ({ planId, sender, text, receiver, attachments = [] }) => {
    if(!planId || !sender || !text){
        throw new Error("All fields are required");
    }

    const message = await Message.create({
        planId,
        sender,
        text,
        attachments,
        readBy: [sender]
    });

    //Notification
    if (receiver) {
        await notificationService.notifyNewMessage({
            receiver,
            message: "New message",
            planId
        });
    }

    return await message.populate("sender", "name avatar phone");
};

//Get messages for a plan/chat
module.exports.getMessages = async (planId, limit = 50, skip = 0) =>{
    return await Message.find({ planId })
        .populate("sender", "name avatar phone")
        .populate("readBy", "name")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
};

// Get all chats for a user (plans with messages)
module.exports.getChats = async (userId) => {
    const chats = await Message.aggregate([
        { 
            $match: { 
                $or: [
                    { sender: userId },
                    { "readBy": userId }
                ]
            } 
        },
        { $group: { 
            _id: "$planId", 
            lastMessage: { $last: "$text" },
            lastMessageTime: { $last: "$createdAt" },
            count: { $sum: 1 },
            unreadCount: {
                $sum: {
                    $cond: [{ $nin: [userId, "$readBy"] }, 1, 0]
                }
            }
        } },
        { $sort: { lastMessageTime: -1 } }
    ]);

    // Populate plan details
    const populatedChats = await Promise.all(
        chats.map(async (chat) => {
            const plan = await Plan.findById(chat._id)
                .populate("createdBy", "name avatar")
                .populate("participants", "name avatar");
            return { ...chat, plan };
        })
    );

    return populatedChats;
};

// Mark message as read
module.exports.markAsRead = async (messageId, userId) => {
    const message = await Message.findByIdAndUpdate(
        messageId,
        { $addToSet: { readBy: userId } },
        { new: true }
    );
    return message;
};

// Mark all messages as read for a plan
module.exports.markPlanAsRead = async (planId, userId) => {
    const result = await Message.updateMany(
        { planId, readBy: { $nin: [userId] } },
        { $addToSet: { readBy: userId } }
    );
    return result;
};

// Delete a message
module.exports.deleteMessage = async (messageId, userId) => {
    const message = await Message.findById(messageId);
    if (!message) {
        throw new Error("Message not found");
    }
    if (message.sender.toString() !== userId.toString()) {
        throw new Error("Unauthorized to delete this message");
    }
    await Message.deleteOne({ _id: messageId });
    return { success: true };
};

// Edit a message
module.exports.editMessage = async (messageId, userId, newText) => {
    const message = await Message.findById(messageId);
    if (!message) {
        throw new Error("Message not found");
    }
    if (message.sender.toString() !== userId.toString()) {
        throw new Error("Unauthorized to edit this message");
    }
    message.text = newText;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();
    return message.populate("sender", "name avatar phone");
};

// Search messages
module.exports.searchMessages = async (planId, searchText) => {
    return await Message.find({
        planId,
        text: { $regex: searchText, $options: "i" }
    })
    .populate("sender", "name avatar phone")
    .sort({ createdAt: -1 });
};

// Send direct message
module.exports.sendDirectMessage = async ({ sender, recipient, text, attachments = [] }) => {
    if (!sender || !recipient || !text) {
        throw new Error("All fields are required");
    }

    const message = await Message.create({
        sender,
        recipient,
        text,
        attachments,
        isDirect: true,
        readBy: [sender]
    });

    return await message.populate("sender", "firstName lastName avatar phone");

};

// Get direct messages between two users
module.exports.getDirectMessages = async (userId, recipientId, limit = 50, skip = 0) => {
    return await Message.find({
        isDirect: true,
        $or: [
            { sender: userId, recipient: recipientId },
            { sender: recipientId, recipient: userId }
        ]
    })
    .populate("sender", "firstName lastName avatar phone")

    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Get all direct conversations for a user
module.exports.getDirectConversations = async (userId, limit = 20, skip = 0) => {
    const conversations = await Message.aggregate([
        {
            $match: {
                isDirect: true,
                $or: [
                    { sender: userId },
                    { recipient: userId }
                ]
            }
        },
        {
            $group: {
                _id: {
                    $cond: [
                        { $eq: ["$sender", userId] },
                        "$recipient",
                        "$sender"
                    ]
                },
                lastMessage: { $last: "$text" },
                lastMessageTime: { $last: "$createdAt" },
                unreadCount: {
                    $sum: {
                        $cond: [
                            { $and: [
                                { $eq: ["$recipient", userId] },
                                { $nin: [userId, "$readBy"] }
                            ]},
                            1,
                            0
                        ]
                    }
                }
            }
        },
        { $sort: { lastMessageTime: -1 } },
        { $limit: limit },
        { $skip: skip }
    ]);

    // Populate user details
    const User = require("../models/user.model");
    const populatedConversations = await Promise.all(
        conversations.map(async (conv) => {
            const user = await User.findById(conv._id).select("firstName lastName avatar");

            return { ...conv, user };
        })
    );

    return populatedConversations;
};
