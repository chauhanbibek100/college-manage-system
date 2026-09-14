const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Not authorized, no token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Not authorized, invalid token format' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return res.status(500).json({ error: 'Server authentication configuration error' });
    }

    try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Not authorized, token expired or invalid' });
    }
};

module.exports = auth;
