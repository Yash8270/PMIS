const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'pmis_secret_key_2026';
const JWT_EXPIRES = '7d';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

const cookieOptions = {
    httpOnly: true,          // not accessible via JS (XSS protection)
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'lax',         // CSRF protection while allowing normal navigations
    maxAge: COOKIE_MAX_AGE,  // 7 days, then auto-removed by browser
};

// POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password, role, avatar_initials } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'name, email, password and role are required.' });
        }

        const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Email already registered.' });
        }

        const hash = await bcrypt.hash(password, 10);
        const initials = avatar_initials || name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 5);

        const [result] = await db.query(
            'INSERT INTO users (name, email, password_hash, avatar_initials, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, hash, initials, role]
        );

        return res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            user_id: result.insertId,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const user = rows[0];
        if (user.status === 'inactive') {
            return res.status(403).json({ success: false, message: 'Account is inactive.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { user_id: user.user_id, email: user.email, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        // Set token as HttpOnly cookie (7-day expiry)
        res.cookie('pmis_token', token, cookieOptions);

        return res.status(200).json({
            success: true,
            token,           // still returned in body for frontend localStorage fallback
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar_initials: user.avatar_initials,
                status: user.status,
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/auth/logout
const logout = (req, res) => {
    res.clearCookie('pmis_token', { ...cookieOptions, maxAge: 0 });
    return res.json({ success: true, message: 'Logged out successfully.' });
};

// GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT user_id, name, email, avatar_initials, role, status, created_at FROM users WHERE user_id = ?',
            [req.user.user_id]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
        return res.json({ success: true, user: rows[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { register, login, logout, getMe };
