const messageService = require("../services/message.service");
const { getIO } = require("../services/socket.service");

module.exports.sendMessage = async (req, res) => {
    try {
        const userId = req.user._id;
        const message = await messageService.sendMessage({ ...req.body, sender: userId });
        
        // Emit via socket
        const io = getIO();
        if (req.body.planId) {
            io.to(`plan:${req.body.planId}`).emit("reciveMessage", message);
        }
        
        res.status(201).json({ success: true, data: message });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.getMessages = async (req, res) => {
    try {
        const { limit, skip } = req.query;
        const messages = await messageService.getMessages(
            req.params.planId,
            limit ? parseInt(limit) : 50,
            skip ? parseInt(skip) : 0
        );
        res.status(200).json({ success: true, data: messages });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.getChats = async (req, res) => {
    try {
        const userId = req.user._id;
        const chats = await messageService.getChats(userId);
        res.status(200).json({ success: true, data: chats });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const message = await messageService.markAsRead(req.params.messageId, userId);
        res.status(200).json({ success: true, data: message });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.markPlanAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const result = await messageService.markPlanAsRead(req.params.planId, userId);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.deleteMessage = async (req, res) => {
    try {
        const userId = req.user._id;
        const result = await messageService.deleteMessage(req.params.messageId, userId);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.editMessage = async (req, res) => {
    try {
        const userId = req.user._id;
        const { text } = req.body;
        const message = await messageService.editMessage(req.params.messageId, userId, text);
        
        // Emit via socket
        const io = getIO();
        if (message.planId) {
            io.to(`plan:${message.planId}`).emit("messageEdited", message);
        }
        
        res.status(200).json({ success: true, data: message });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.searchMessages = async (req, res) => {
    try {
        const { searchText } = req.query;
        if (!searchText) {
            return res.status(400).json({ success: false, message: "Search text required" });
        }
        const messages = await messageService.searchMessages(req.params.planId, searchText);
        res.status(200).json({ success: true, data: messages });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.sendDirectMessage = async (req, res) => {
    try {
        const sender = req.user._id;
        const { recipient } = req.params;
        const { text } = req.body;

        const message = await messageService.sendDirectMessage({
            sender,
            recipient,
            text
        });

        // Emit via socket
        const io = getIO();
        io.to(`direct:${recipient}`).emit("directMessage", message);
        io.to(`direct:${sender}`).emit("directMessage", message);

        res.status(201).json({ success: true, data: message });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.getDirectMessages = async (req, res) => {
    try {
        const userId = req.user._id;
        const { recipient } = req.params;
        const { limit = 50, skip = 0 } = req.query;

        const messages = await messageService.getDirectMessages(
            userId,
            recipient,
            parseInt(limit),
            parseInt(skip)
        );

        res.status(200).json({ success: true, data: messages });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.getDirectConversations = async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit = 20, skip = 0 } = req.query;

        const conversations = await messageService.getDirectConversations(
            userId,
            parseInt(limit),
            parseInt(skip)
        );

        res.status(200).json({ success: true, data: conversations });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};