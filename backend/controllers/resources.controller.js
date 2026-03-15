const db = require('../config/db');

// GET /api/resources?project_id=1&type=human
const getResources = async (req, res) => {
    try {
        const { project_id, type } = req.query;
        if (!project_id) return res.status(400).json({ success: false, message: 'project_id required.' });
        let sql = `
            SELECT r.*, u.name AS user_name, u.email AS user_email
            FROM resources r
            LEFT JOIN users u ON r.user_id = u.user_id
            WHERE r.project_id = ?
        `;
        const params = [project_id];
        if (type) { sql += ' AND r.type = ?'; params.push(type); }
        sql += ' ORDER BY r.name';
        const [rows] = await db.query(sql, params);
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/resources/:id
const getResourceById = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT r.*, u.name AS user_name FROM resources r LEFT JOIN users u ON r.user_id = u.user_id WHERE r.resource_id = ?',
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Resource not found.' });
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/resources
const createResource = async (req, res) => {
    try {
        const { project_id, type, name, user_id, role_title, skills, utilization_pct, status, current_allocation } = req.body;
        if (!project_id || !type || !name) {
            return res.status(400).json({ success: false, message: 'project_id, type, name required.' });
        }
        const skillsJson = skills ? JSON.stringify(skills) : null;
        const [result] = await db.query(
            'INSERT INTO resources (project_id, type, name, user_id, role_title, skills, utilization_pct, status, current_allocation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [project_id, type, name, user_id, role_title, skillsJson, utilization_pct, status || 'active', current_allocation]
        );
        return res.status(201).json({ success: true, message: 'Resource created.', resource_id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/resources/:id
const updateResource = async (req, res) => {
    try {
        const { name, role_title, skills, utilization_pct, status, current_allocation } = req.body;
        const skillsJson = skills ? JSON.stringify(skills) : undefined;
        await db.query(
            `UPDATE resources SET
                name = COALESCE(?, name),
                role_title = COALESCE(?, role_title),
                skills = COALESCE(?, skills),
                utilization_pct = COALESCE(?, utilization_pct),
                status = COALESCE(?, status),
                current_allocation = COALESCE(?, current_allocation)
            WHERE resource_id = ?`,
            [name, role_title, skillsJson, utilization_pct, status, current_allocation, req.params.id]
        );
        return res.json({ success: true, message: 'Resource updated.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/resources/:id
const deleteResource = async (req, res) => {
    try {
        await db.query('DELETE FROM resources WHERE resource_id = ?', [req.params.id]);
        return res.json({ success: true, message: 'Resource deleted.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/resources/assignments?project_id=1
const getAssignments = async (req, res) => {
    try {
        const { project_id, resource_id } = req.query;
        let sql = `
            SELECT ra.*, r.name AS resource_name, r.type, t.name AS task_name, pp.phase_name, u.name AS assigned_by_name
            FROM resource_assignments ra
            LEFT JOIN resources r ON ra.resource_id = r.resource_id
            LEFT JOIN tasks t ON ra.task_id = t.task_id
            LEFT JOIN project_phases pp ON ra.phase_id = pp.phase_id
            LEFT JOIN users u ON ra.assigned_by = u.user_id
            WHERE 1=1
        `;
        const params = [];
        if (project_id) { sql += ' AND r.project_id = ?'; params.push(project_id); }
        if (resource_id) { sql += ' AND ra.resource_id = ?'; params.push(resource_id); }
        const [rows] = await db.query(sql, params);
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/resources/assignments
const createAssignment = async (req, res) => {
    try {
        const { resource_id, task_id, phase_id, assigned_from, assigned_to } = req.body;
        if (!resource_id) return res.status(400).json({ success: false, message: 'resource_id required.' });
        const [result] = await db.query(
            'INSERT INTO resource_assignments (resource_id, task_id, phase_id, assigned_from, assigned_to, assigned_by) VALUES (?, ?, ?, ?, ?, ?)',
            [resource_id, task_id, phase_id, assigned_from, assigned_to, req.user?.user_id]
        );
        return res.status(201).json({ success: true, message: 'Assignment created.', id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/resources/assignments/:id
const deleteAssignment = async (req, res) => {
    try {
        await db.query('DELETE FROM resource_assignments WHERE id = ?', [req.params.id]);
        return res.json({ success: true, message: 'Assignment removed.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getResources, getResourceById, createResource, updateResource, deleteResource, getAssignments, createAssignment, deleteAssignment };
