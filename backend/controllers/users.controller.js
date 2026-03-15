const db = require('../config/db');

// GET /api/users
const getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT user_id, name, email, avatar_initials, role, status, created_at FROM users ORDER BY name'
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT user_id, name, email, avatar_initials, role, status, created_at FROM users WHERE user_id = ?',
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
    try {
        const { name, avatar_initials, role, status } = req.body;
        const { id } = req.params;
        await db.query(
            'UPDATE users SET name = COALESCE(?, name), avatar_initials = COALESCE(?, avatar_initials), role = COALESCE(?, role), status = COALESCE(?, status) WHERE user_id = ?',
            [name, avatar_initials, role, status, id]
        );
        return res.json({ success: true, message: 'User updated.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/users/:id
const deleteUser = async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE user_id = ?', [req.params.id]);
        return res.json({ success: true, message: 'User deleted.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
