const express = require('express');
const router = express.Router();
const DateSheet = require('../models/DateSheet');
const Result = require('../models/Result');
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

const resultStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads', 'results'));
    },
    filename: function(req, file, cb) {
        const safeClass = (req.body.className || 'all').toString().trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'result-class-' + safeClass + '-' + Date.now() + ext);
    }
});

const uploadResult = multer({
    storage: resultStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

router.get('/datesheet', auth, async (req, res) => {
    try {
        const query = {};
        if (req.query.className && typeof req.query.className === 'string') {
            query.className = req.query.className.trim();
        }
        const dateSheets = await DateSheet.find(query).sort({ date: 1 });
        res.json(dateSheets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/datesheet', auth, async (req, res) => {
    try {
        const dateSheet = new DateSheet(req.body);
        await dateSheet.save();
        res.status(201).json(dateSheet);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/datesheet/:id', auth, async (req, res) => {
    try {
        const dateSheet = await DateSheet.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!dateSheet) return res.status(404).json({ error: 'Date sheet entry not found' });
        res.json(dateSheet);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/datesheet/:id', auth, async (req, res) => {
    try {
        const dateSheet = await DateSheet.findByIdAndDelete(req.params.id);
        if (!dateSheet) return res.status(404).json({ error: 'Date sheet entry not found' });
        res.json({ message: 'Date sheet entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/result', auth, (req, res, next) => {
    uploadResult.single('resultFile')(req, res, function (err) {
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
        const { className } = req.body;
        if (!className || typeof className !== 'string') {
            return res.status(400).json({ error: 'Class name is required' });
        }

        const filePath = '/uploads/results/' + req.file.filename;
        const originalName = req.file.originalname;

        let result = await Result.findOne({ className });
        if (result) {
            result.filePath = filePath;
            result.originalName = originalName;
            await result.save();
        } else {
            result = new Result({
                className,
                filePath,
                originalName
            });
            await result.save();
        }
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/result', auth, async (req, res) => {
    try {
        const query = {};
        if (req.query.className) {
            query.className = req.query.className;
            const result = await Result.findOne(query);
            return res.json(result);
        }
        const results = await Result.find(query);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
