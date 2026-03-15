const db = require('../config/db');

// GET /api/projects
const getAllProjects = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, u.name AS manager_name, u.avatar_initials AS manager_avatar
            FROM projects p
            LEFT JOIN users u ON p.manager_id = u.user_id
            ORDER BY p.created_at DESC
        `);
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/projects/:id
const getProjectById = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, u.name AS manager_name, u.avatar_initials AS manager_avatar
            FROM projects p
            LEFT JOIN users u ON p.manager_id = u.user_id
            WHERE p.project_id = ?
        `, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found.' });
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/projects
const createProject = async (req, res) => {
    try {
        const { name, description, start_date, end_date, total_duration_days, status, manager_id } = req.body;
        if (!name || !start_date) {
            return res.status(400).json({ success: false, message: 'name and start_date are required.' });
        }
        const [result] = await db.query(
            'INSERT INTO projects (name, description, start_date, end_date, total_duration_days, status, manager_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, description, start_date, end_date, total_duration_days, status || 'planning', manager_id]
        );
        return res.status(201).json({ success: true, message: 'Project created.', project_id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/projects/:id
const updateProject = async (req, res) => {
    try {
        const { name, description, start_date, end_date, total_duration_days, status, manager_id } = req.body;
        await db.query(
            `UPDATE projects SET
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                start_date = COALESCE(?, start_date),
                end_date = COALESCE(?, end_date),
                total_duration_days = COALESCE(?, total_duration_days),
                status = COALESCE(?, status),
                manager_id = COALESCE(?, manager_id)
            WHERE project_id = ?`,
            [name, description, start_date, end_date, total_duration_days, status, manager_id, req.params.id]
        );
        return res.json({ success: true, message: 'Project updated.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res) => {
    try {
        await db.query('DELETE FROM projects WHERE project_id = ?', [req.params.id]);
        return res.json({ success: true, message: 'Project deleted.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/projects/:id/stats  — Dashboard summary
const getProjectStats = async (req, res) => {
    try {
        const id = req.params.id;
        const [[taskStats]] = await db.query(`
            SELECT
                COUNT(*) AS total_tasks,
                SUM(status = 'done') AS completed_tasks,
                SUM(status = 'active') AS active_tasks,
                SUM(is_critical = 1) AS critical_tasks
            FROM tasks WHERE project_id = ?
        `, [id]);

        const [[budgetStats]] = await db.query(`
            SELECT
                SUM(total_budget) AS total_budget,
                (SELECT SUM(amount) FROM expenses WHERE project_id = ? AND status = 'approved') AS actual_spent
            FROM budget_categories WHERE project_id = ?
        `, [id, id]);

        const [[riskStats]] = await db.query(`
            SELECT
                COUNT(*) AS total_risks,
                SUM(risk_score >= 15) AS high_risks,
                SUM(status = 'open') AS open_risks
            FROM risks WHERE project_id = ?
        `, [id]);

        const [[resourceStats]] = await db.query(`
            SELECT COUNT(*) AS total_resources FROM resources WHERE project_id = ?
        `, [id]);

        return res.json({
            success: true,
            data: {
                tasks: taskStats,
                budget: budgetStats,
                risks: riskStats,
                resources: resourceStats,
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getAllProjects, getProjectById, createProject, updateProject, deleteProject, getProjectStats };
