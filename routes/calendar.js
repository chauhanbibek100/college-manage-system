const express = require('express');
const router = express.Router();
const Calendar = require('../models/Calendar');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext) && allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and image files (JPG, PNG, WebP) are allowed.'));
    }
};

const calendarStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads', 'calendar'));
    },
    filename: function(req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'calendar-' + Date.now() + ext);
    }
});

const uploadCalendar = multer({
    storage: calendarStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

router.post('/', auth, (req, res, next) => {
    uploadCalendar.single('calendarFile')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File size exceeds maximum limit of 10MB' });
            }
            return res.status(400).json({ error: err.message });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // Delete any existing calendar records first
        await Calendar.deleteMany({});
        
        const filePath = '/uploads/calendar/' + req.file.filename;
        const originalName = req.file.originalname;
        
        const calendar = new Calendar({
            filePath,
            originalName,
            uploadDate: new Date().toISOString()
        });
        await calendar.save();
        
        res.status(201).json(calendar);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const calendar = await Calendar.findOne().sort({ _id: -1 });
        res.json(calendar);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
