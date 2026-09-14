const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/security');

router.post('/login', authRateLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const admin = await Admin.findOne({ username: username.trim() });
        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET environment variable is missing');
        }

        const token = jwt.sign(
            { id: admin._id, username: admin.username },
            jwtSecret,
            { expiresIn: '24h' }
        );
        res.json({ token, username: admin.username });
    } catch (error) {
        res.status(500).json({ error: 'Authentication failed. Please try again.' });
    }
});

router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword || typeof newPassword !== 'string') {
            return res.status(400).json({ error: 'Both current and new passwords are required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters long' });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ error: 'New password cannot be the same as current password' });
        }

        const admin = await Admin.findById(req.user.id);
        if (!admin) {
             return res.status(404).json({ error: 'Admin not found' });
        }
        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(newPassword, salt);
        await admin.save();
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to change password. Please try again.' });
    }
});

module.exports = router;
