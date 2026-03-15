const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'pmis_secret_key_2026';

/**
 * Verifies JWT token. Checks (in order):
 *  1. HttpOnly cookie: pmis_token
 *  2. Authorization: Bearer <token> header  (fallback / API clients)
 */
const authenticate = (req, res, next) => {
    // 1. Try cookie first
    let token = req.cookies?.pmis_token;

    // 2. Fall back to Authorization header
    if (!token) {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided. Access denied.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};

/**
 * Restricts access to specific roles.
 * Usage: authorize('admin', 'pm')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Requires one of: [${roles.join(', ')}]`,
            });
        }
        next();
    };
};

module.exports = { authenticate, authorize };
