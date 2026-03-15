require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const SERVER_PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
    origin: [process.env.FRONTEND_URL , 'http://localhost:5173'],
    credentials: true,          // allow cookies to be sent/received
}));
app.use(express.json());
app.use(cookieParser());        // parse req.cookies

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/projects', require('./routes/projects.routes'));
app.use('/api/phases', require('./routes/phases.routes'));
app.use('/api/tasks', require('./routes/tasks.routes'));
app.use('/api/costs', require('./routes/costs.routes'));
app.use('/api/resources', require('./routes/resources.routes'));
app.use('/api/documents', require('./routes/documents.routes'));
app.use('/api/communication', require('./routes/communication.routes'));
app.use('/api/risks', require('./routes/risks.routes'));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ message: 'PMIS API is running ✅', version: '1.0.0' });
});

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(SERVER_PORT, () => {
    console.log(`🚀 PMIS Backend running on http://localhost:${SERVER_PORT}`);
});
