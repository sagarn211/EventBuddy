const express = require('express');
const router = express.Router();
const Friendship = require('../models/friendship.model');
const User = require('../models/user.model');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * @route   POST /friends/request/:id
 * @desc    Send a buddy request
 */
router.post('/request/:id', authMiddleware, async (req, res) => {
    try {
        const recipientId = req.params.id;
        const requesterId = req.user._id;

        if (recipientId === requesterId.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot add yourself' });
        }

        // Check for existing friendship
        const existing = await Friendship.findOne({
            $or: [
                { requester: requesterId, recipient: recipientId },
                { requester: recipientId, recipient: requesterId }
            ]
        });

        if (existing) {
            return res.status(400).json({ success: false, message: 'Request already exists or already friends' });
        }

        const friendship = new Friendship({
            requester: requesterId,
            recipient: recipientId,
            status: 'pending'
        });

        await friendship.save();

        return res.status(201).json({ success: true, message: 'Buddy request sent' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   PATCH /friends/accept/:id
 * @desc    Accept a buddy request
 */
router.patch('/accept/:id', authMiddleware, async (req, res) => {
    try {
        const friendship = await Friendship.findById(req.params.id);
        
        if (!friendship || friendship.recipient.toString() !== req.user._id.toString()) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        friendship.status = 'accepted';
        await friendship.save();

        // Update both users' contacts arrays
        await User.findByIdAndUpdate(friendship.requester, { $addToSet: { contacts: friendship.recipient } });
        await User.findByIdAndUpdate(friendship.recipient, { $addToSet: { contacts: friendship.requester } });

        return res.status(200).json({ success: true, message: 'Buddy request accepted' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /friends
 * @desc    Get all buddies (accepted friendships)
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const friendships = await Friendship.find({
            $or: [{ requester: req.user._id }, { recipient: req.user._id }],
            status: 'accepted'
        }).populate('requester recipient', 'name avatar phone');

        const friends = friendships.map(f => 
            f.requester._id.toString() === req.user._id.toString() ? f.recipient : f.requester
        );

        return res.status(200).json({ success: true, data: friends });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /friends/pending
 * @desc    Get pending requests
 */
router.get('/pending', authMiddleware, async (req, res) => {
    try {
        const pending = await Friendship.find({
            recipient: req.user._id,
            status: 'pending'
        }).populate('requester', 'name avatar phone');

        return res.status(200).json({ success: true, data: pending });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
