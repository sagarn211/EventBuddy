const express = require('express');
const router = express.Router();
const Story = require('../models/story.model');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * @route   POST /api/stories
 * @desc    Create a new story
 * @access  Private
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { type, text, media, mediaId, visibility, selectedContacts } = req.body;
        const user = req.user;

        if (!type || (type === 'text' && !text) || (type !== 'text' && !media)) {
            return res.status(400).json({ success: false, message: 'Invalid story content' });
        }

        const newStory = new Story({
            userId: user._id,
            userName: user.name || user.phone,
            userAvatar: user.avatar,

            type,
            text,
            media,
            mediaId,
            visibility,
            selectedContacts: selectedContacts || [],
        });

        await newStory.save();

        return res.status(201).json({
            success: true,
            message: 'Story posted successfully',
            data: newStory
        });
    } catch (error) {
        console.error('[Story] Create Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to post story' });
    }
});

/**
 * @route   GET /api/stories
 * @desc    Get all active stories (from buddies or public)
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Fetch stories that are public OR where user is in selectedContacts OR owned by user
        const stories = await Story.find({
            $or: [
                { visibility: 'public' },
                { userId: userId },
                { selectedContacts: userId }
            ]
        })
        .sort({ createdAt: -1 })
        .populate('userId', 'name avatar');


        return res.status(200).json({
            success: true,
            data: stories
        });
    } catch (error) {
        console.error('[Story] Fetch Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch stories' });
    }
});

/**
 * @route   DELETE /api/stories/:id
 * @desc    Delete a story
 * @access  Private
 */
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        
        if (!story) {
            return res.status(404).json({ success: false, message: 'Story not found' });
        }

        if (story.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        // Note: Real deletion from ImageKit should be handled if media exists
        // const imagekit = require('../config/imagekit.config');
        // if (story.mediaId) await imagekit.deleteFile(story.mediaId);

        await story.deleteOne();

        return res.status(200).json({ success: true, message: 'Story deleted' });
    } catch (error) {
        console.error('[Story] Delete Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete story' });
    }
});

module.exports = router;
