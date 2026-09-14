const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Settings routes are handled via auth routes (change password)
// This file exists for future extensibility

router.get('/', auth, (req, res) => {
    res.json({ message: 'Settings endpoint' });
});

module.exports = router;
