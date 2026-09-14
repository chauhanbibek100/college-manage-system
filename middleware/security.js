// Security Middleware: Headers, Rate Limiting, and NoSQL Injection Protection

// In-memory rate limiting cache
const rateLimitBuckets = new Map();

/**
 * Creates a rate limiting middleware
 * @param {Object} options
 * @param {number} options.windowMs Time window in milliseconds
 * @param {number} options.maxRequests Maximum requests allowed per window
 * @param {string} options.message Error message returned when limit is exceeded
 */
function createRateLimiter({ windowMs = 15 * 60 * 1000, maxRequests = 100, message = 'Too many requests, please try again later.' }) {
    // Periodic cleanup of expired rate limit entries every 5 minutes
    setInterval(() => {
        const now = Date.now();
        for (const [key, record] of rateLimitBuckets.entries()) {
            if (now > record.resetTime) {
                rateLimitBuckets.delete(key);
            }
        }
    }, 5 * 60 * 1000).unref();

    return function rateLimiter(req, res, next) {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const key = `${req.baseUrl || req.path}:${ip}`;
        const now = Date.now();

        let record = rateLimitBuckets.get(key);
        if (!record || now > record.resetTime) {
            record = { count: 1, resetTime: now + windowMs };
            rateLimitBuckets.set(key, record);
        } else {
            record.count++;
        }

        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

        if (record.count > maxRequests) {
            return res.status(429).json({
                error: message,
                retryAfter: Math.ceil((record.resetTime - now) / 1000)
            });
        }

        next();
    };
}

// Strict rate limiter for authentication endpoints (prevent brute-force password guessing)
const authRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,           // max 10 failed/passed attempts per 15 minutes
    message: 'Too many login attempts from this IP. Please wait 15 minutes before trying again.'
});

// General API rate limiter
const apiRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 400,          // generous for regular dashboard operations
    message: 'Too many requests to the API. Please slow down.'
});

/**
 * Applies OWASP recommended HTTP Security Headers
 */
function securityHeaders(req, res, next) {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Prevent Clickjacking attacks
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    // Basic legacy XSS filter protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Content-Security-Policy (allows self, Google Fonts, data URIs for images)
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "font-src 'self' https://fonts.gstatic.com data:; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "script-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob: /uploads/; " +
        "frame-src 'self' /uploads/; " +
        "connect-src 'self'"
    );
    next();
}

/**
 * Sanitizes input objects to prevent MongoDB / NoSQL Query Injection ($gt, $ne, etc.)
 */
function sanitizeInput(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(sanitizeInput);
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        // Strip any key that begins with '$' or contains '.'
        if (key.startsWith('$') || key.includes('.')) {
            continue;
        }
        if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeInput(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

function noSqlSanitizer(req, res, next) {
    if (req.body) req.body = sanitizeInput(req.body);
    if (req.query) req.query = sanitizeInput(req.query);
    if (req.params) req.params = sanitizeInput(req.params);
    next();
}

module.exports = {
    securityHeaders,
    noSqlSanitizer,
    authRateLimiter,
    apiRateLimiter
};
