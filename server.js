require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');
const bcrypt = require('bcryptjs');

// Import Admin model
const Admin = require('./models/Admin');

// Ensure directories exist
const dirsToCreate = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads', 'results'),
    path.join(__dirname, 'uploads', 'calendar')
];

dirsToCreate.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Initialize express app
const app = express();

// Disable tech stack disclosure
app.disable('x-powered-by');

// Security middleware
const { securityHeaders, noSqlSanitizer, apiRateLimiter } = require('./middleware/security');
app.use(securityHeaders);

// Connect to database
connectDB();

// Middleware with bounded payload size to prevent DoS
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(noSqlSanitizer);
app.use(cors());

// Apply rate limiting to all API endpoints
app.use('/api', apiRateLimiter);

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routes (using try-catch for graceful handling if files don't exist yet)
const mountRoute = (path, modulePath) => {
    try {
        app.use(path, require(modulePath));
    } catch (err) {
        console.warn(`Route module ${modulePath} not found. Ensure it is created before testing.`);
    }
};

mountRoute('/api/auth', './routes/auth');
mountRoute('/api/students', './routes/students');
mountRoute('/api/teachers', './routes/teachers');
mountRoute('/api/fees', './routes/fees');
mountRoute('/api/exams', './routes/exams');
mountRoute('/api/calendar', './routes/calendar');
mountRoute('/api/settings', './routes/settings');

// Seed default admin
const seedAdmin = async () => {
    try {
        const adminExists = await Admin.findOne({ username: 'admin' });
        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            await Admin.create({
                username: 'admin',
                password: hashedPassword
            });
            console.log('Default admin created successfully.');
        }
    } catch (error) {
        console.error('Error seeding default admin:', error.message);
    }
};

seedAdmin();

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
