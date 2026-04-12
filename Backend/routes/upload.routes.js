const express = require('express');
const router = express.Router();
const multer = require('multer');
const imagekit = require('../config/imagekit.config');
const authMiddleware = require('../middlewares/auth.middleware');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

/**
 * @route   POST /api/upload
 * @desc    Upload an image or file to ImageKit
 * @access  Private
 */
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const folder = req.body.folder || 'misc';
        const fileName = `${Date.now()}-${req.file.originalname}`;

        const uploadResponse = await imagekit.upload({
            file: req.file.buffer, // Buffer from multer
            fileName: fileName,
            folder: `/eventbuddy/${folder}`,
            useUniqueFileName: true,
            tags: [folder, 'eventbuddy'],
        });

        return res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                fileId: uploadResponse.fileId,
                name: uploadResponse.name,
                url: uploadResponse.url,
                thumbnailUrl: uploadResponse.thumbnailUrl,
            }
        });
    } catch (error) {
        console.error('[Upload] Error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error during upload',
            error: error.message 
        });
    }
});

module.exports = router;
