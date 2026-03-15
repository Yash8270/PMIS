const db = require('../config/db');

// ─── Channels ─────────────────────────────────────────────────────────────────

// GET /api/communication/channels?project_id=1
const getChannels = async (req, res) => {
    try {
        const { project_id } = req.query;
        if (!project_id) return res.status(400).json({ success: false, message: 'project_id required.' });
        const [rows] = await db.query(`
            SELECT c.*, COUNT(cm.user_id) AS member_count,
                (SELECT COUNT(*) FROM messages m WHERE m.channel_id = c.channel_id) AS message_count
            FROM channels c
            LEFT JOIN channel_members cm ON c.channel_id = cm.channel_id
            WHERE c.project_id = ?
            GROUP BY c.channel_id
            ORDER BY c.channel_name
        `, [project_id]);
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/communication/channels
const createChannel = async (req, res) => {
    try {
        const { project_id, channel_name, description } = req.body;
        if (!project_id || !channel_name) return res.status(400).json({ success: false, message: 'project_id and channel_name required.' });
        const [result] = await db.query(
            'INSERT INTO channels (project_id, channel_name, description, created_by) VALUES (?, ?, ?, ?)',
            [project_id, channel_name, description, req.user?.user_id]
        );
        return res.status(201).json({ success: true, message: 'Channel created.', channel_id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/communication/channels/:id
const deleteChannel = async (req, res) => {
    try {
        await db.query('DELETE FROM messages WHERE channel_id = ?', [req.params.id]);
        await db.query('DELETE FROM channel_members WHERE channel_id = ?', [req.params.id]);
        await db.query('DELETE FROM channels WHERE channel_id = ?', [req.params.id]);
        return res.json({ success: true, message: 'Channel deleted.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/communication/channels/:id/join
const joinChannel = async (req, res) => {
    try {
        await db.query(
            'INSERT IGNORE INTO channel_members (channel_id, user_id) VALUES (?, ?)',
            [req.params.id, req.user?.user_id]
        );
        return res.json({ success: true, message: 'Joined channel.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Messages ─────────────────────────────────────────────────────────────────

// GET /api/communication/messages?channel_id=1&limit=50
const getMessages = async (req, res) => {
    try {
        const { channel_id, limit = 50, offset = 0 } = req.query;
        if (!channel_id) return res.status(400).json({ success: false, message: 'channel_id required.' });
        const [rows] = await db.query(`
            SELECT m.*, u.name AS sender_name, u.avatar_initials, u.role
            FROM messages m
            JOIN users u ON m.sender_id = u.user_id
            WHERE m.channel_id = ?
            ORDER BY m.sent_at DESC
            LIMIT ? OFFSET ?
        `, [channel_id, parseInt(limit), parseInt(offset)]);
        return res.json({ success: true, data: rows.reverse() });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/communication/messages
const sendMessage = async (req, res) => {
    try {
        const { channel_id, message_text } = req.body;
        if (!channel_id || !message_text) return res.status(400).json({ success: false, message: 'channel_id and message_text required.' });
        const [result] = await db.query(
            'INSERT INTO messages (channel_id, sender_id, message_text) VALUES (?, ?, ?)',
            [channel_id, req.user?.user_id, message_text]
        );
        return res.status(201).json({ success: true, message: 'Message sent.', message_id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/communication/messages/:id
const deleteMessage = async (req, res) => {
    try {
        await db.query('DELETE FROM messages WHERE message_id = ?', [req.params.id]);
        return res.json({ success: true, message: 'Message deleted.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Announcements ────────────────────────────────────────────────────────────

// GET /api/communication/announcements?project_id=1
const getAnnouncements = async (req, res) => {
    try {
        const { project_id } = req.query;
        if (!project_id) return res.status(400).json({ success: false, message: 'project_id required.' });
        const [rows] = await db.query(`
            SELECT a.*, u.name AS posted_by_name, u.avatar_initials
            FROM announcements a
            LEFT JOIN users u ON a.posted_by = u.user_id
            WHERE a.project_id = ?
            ORDER BY a.posted_at DESC
        `, [project_id]);
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/communication/announcements
const createAnnouncement = async (req, res) => {
    try {
        const { project_id, title, body, priority } = req.body;
        if (!project_id || !title || !body) return res.status(400).json({ success: false, message: 'project_id, title, body required.' });
        const [result] = await db.query(
            'INSERT INTO announcements (project_id, title, body, priority, posted_by) VALUES (?, ?, ?, ?, ?)',
            [project_id, title, body, priority || 'medium', req.user?.user_id]
        );
        return res.status(201).json({ success: true, message: 'Announcement posted.', announcement_id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/communication/announcements/:id
const deleteAnnouncement = async (req, res) => {
    try {
        await db.query('DELETE FROM announcements WHERE announcement_id = ?', [req.params.id]);
        return res.json({ success: true, message: 'Announcement deleted.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Workspaces ───────────────────────────────────────────────────────────────

// GET /api/communication/workspaces?project_id=1
const getWorkspaces = async (req, res) => {
    try {
        const { project_id } = req.query;
        if (!project_id) return res.status(400).json({ success: false, message: 'project_id required.' });
        const [rows] = await db.query(`
            SELECT w.*, COUNT(wm.user_id) AS member_count
            FROM workspaces w
            LEFT JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
            WHERE w.project_id = ?
            GROUP BY w.workspace_id
        `, [project_id]);
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/communication/workspaces
const createWorkspace = async (req, res) => {
    try {
        const { project_id, name, icon, status } = req.body;
        if (!project_id || !name) return res.status(400).json({ success: false, message: 'project_id and name required.' });
        const [result] = await db.query(
            'INSERT INTO workspaces (project_id, name, icon, status, created_by) VALUES (?, ?, ?, ?, ?)',
            [project_id, name, icon, status || 'active', req.user?.user_id]
        );
        return res.status(201).json({ success: true, message: 'Workspace created.', workspace_id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/communication/workspaces/:id/join
const joinWorkspace = async (req, res) => {
    try {
        await db.query(
            'INSERT IGNORE INTO workspace_members (workspace_id, user_id) VALUES (?, ?)',
            [req.params.id, req.user?.user_id]
        );
        return res.json({ success: true, message: 'Joined workspace.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getChannels, createChannel, deleteChannel, joinChannel,
    getMessages, sendMessage, deleteMessage,
    getAnnouncements, createAnnouncement, deleteAnnouncement,
    getWorkspaces, createWorkspace, joinWorkspace,
};
