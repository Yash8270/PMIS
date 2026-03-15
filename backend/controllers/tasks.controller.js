const db = require('../config/db');

// GET /api/tasks?project_id=1
const getTasksByProject = async (req, res) => {
    try {
        const { project_id, status, phase_id } = req.query;
        if (!project_id) return res.status(400).json({ success: false, message: 'project_id is required.' });

        let sql = `
            SELECT t.*, pp.phase_name, u.name AS assignee_name, u.avatar_initials
            FROM tasks t
            LEFT JOIN project_phases pp ON t.phase_id = pp.phase_id
            LEFT JOIN users u ON t.assignee_id = u.user_id
            WHERE t.project_id = ?
        `;
        const params = [project_id];
        if (status) { sql += ' AND t.status = ?'; params.push(status); }
        if (phase_id) { sql += ' AND t.phase_id = ?'; params.push(phase_id); }
        sql += ' ORDER BY t.start_day';

        const [tasks] = await db.query(sql, params);

        // Fetch dependencies for each task
        const taskIds = tasks.map(t => t.task_id);
        let dependencies = [];
        if (taskIds.length > 0) {
            [dependencies] = await db.query(
                'SELECT * FROM task_dependencies WHERE task_id IN (?)',
                [taskIds]
            );
        }

        const depMap = {};
        dependencies.forEach(d => {
            if (!depMap[d.task_id]) depMap[d.task_id] = [];
            depMap[d.task_id].push(d.depends_on_task_id);
        });

        const result = tasks.map(t => ({ ...t, dependencies: depMap[t.task_id] || [] }));
        return res.json({ success: true, data: result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/tasks/:id
const getTaskById = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT t.*, pp.phase_name, u.name AS assignee_name, u.avatar_initials
            FROM tasks t
            LEFT JOIN project_phases pp ON t.phase_id = pp.phase_id
            LEFT JOIN users u ON t.assignee_id = u.user_id
            WHERE t.task_id = ?
        `, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found.' });

        const [deps] = await db.query('SELECT depends_on_task_id FROM task_dependencies WHERE task_id = ?', [req.params.id]);
        return res.json({ success: true, data: { ...rows[0], dependencies: deps.map(d => d.depends_on_task_id) } });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/tasks
const createTask = async (req, res) => {
    try {
        const { project_id, phase_id, name, start_day, duration_days, status, is_critical, assignee_id, dependencies } = req.body;
        if (!project_id || !name || start_day === undefined || !duration_days) {
            return res.status(400).json({ success: false, message: 'project_id, name, start_day and duration_days are required.' });
        }

        const [result] = await db.query(
            'INSERT INTO tasks (project_id, phase_id, name, start_day, duration_days, status, is_critical, assignee_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [project_id, phase_id, name, start_day, duration_days, status || 'pending', is_critical || 0, assignee_id]
        );
        const taskId = result.insertId;

        // Insert dependencies
        if (dependencies && dependencies.length > 0) {
            const depValues = dependencies.map(d => [taskId, d]);
            await db.query('INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES ?', [depValues]);
        }

        return res.status(201).json({ success: true, message: 'Task created.', task_id: taskId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/tasks/:id
const updateTask = async (req, res) => {
    try {
        const { name, phase_id, start_day, duration_days, status, is_critical, assignee_id, dependencies } = req.body;
        const id = req.params.id;
        await db.query(
            `UPDATE tasks SET
                name = COALESCE(?, name),
                phase_id = COALESCE(?, phase_id),
                start_day = COALESCE(?, start_day),
                duration_days = COALESCE(?, duration_days),
                status = COALESCE(?, status),
                is_critical = COALESCE(?, is_critical),
                assignee_id = COALESCE(?, assignee_id)
            WHERE task_id = ?`,
            [name, phase_id, start_day, duration_days, status, is_critical, assignee_id, id]
        );

        // Replace dependencies if provided
        if (dependencies !== undefined) {
            await db.query('DELETE FROM task_dependencies WHERE task_id = ?', [id]);
            if (dependencies.length > 0) {
                const depValues = dependencies.map(d => [id, d]);
                await db.query('INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES ?', [depValues]);
            }
        }

        return res.json({ success: true, message: 'Task updated.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
    try {
        await db.query('DELETE FROM task_dependencies WHERE task_id = ? OR depends_on_task_id = ?', [req.params.id, req.params.id]);
        await db.query('DELETE FROM tasks WHERE task_id = ?', [req.params.id]);
        return res.json({ success: true, message: 'Task deleted.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getTasksByProject, getTaskById, createTask, updateTask, deleteTask };
